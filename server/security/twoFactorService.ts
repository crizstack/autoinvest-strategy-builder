import { randomBytes } from 'crypto';
import { db } from '../db';
import { twoFactorAuth, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// TOTP library (speakeasy alternative)
const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += base32Alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(str: string): Buffer {
  const bits: number[] = [];
  for (const char of str.toUpperCase()) {
    if (char === '=') continue; // Skip padding
    const val = base32Alphabet.indexOf(char);
    if (val === -1) throw new Error('Invalid base32 character: ' + char);
    bits.push(...val.toString(2).padStart(5, '0').split('').map(Number));
  }

  const bytes: number[] = [];
  for (let i = 0; i < bits.length - 4; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  }

  return Buffer.from(bytes);
}

function generateTOTP(secret: string, time = Math.floor(Date.now() / 1000 / 30)): string {
  const key = base32Decode(secret);
  const hmac = require('crypto').createHmac('sha1', key);
  
  const buffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    buffer[i] = time & 0xff;
    time = time >> 8;
  }

  hmac.update(buffer);
  const digest = hmac.digest();
  const offset = digest[digest.length - 1] & 0xf;
  const code = (digest[offset] & 0x7f) << 24 |
    (digest[offset + 1] & 0xff) << 16 |
    (digest[offset + 2] & 0xff) << 8 |
    (digest[offset + 3] & 0xff);

  return (code % 1000000).toString().padStart(6, '0');
}

export class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   */
  static generateSecret(email: string): { secret: string; qrCodeUrl: string } {
    const secret = base32Encode(randomBytes(20));
    const qrCodeUrl = `otpauth://totp/AutoInvest:${email}?secret=${secret}&issuer=AutoInvest`;
    return { secret, qrCodeUrl };
  }

  /**
   * Verify a TOTP code
   */
  static verifyTOTP(secret: string, code: string, window = 1): boolean {
    const now = Math.floor(Date.now() / 1000 / 30);
    
    for (let i = -window; i <= window; i++) {
      const expectedCode = generateTOTP(secret, now + i);
      if (expectedCode === code) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Setup 2FA for a user
   */
  static async setup2FA(userId: number, email: string) {
    const { secret, qrCodeUrl } = this.generateSecret(email);
    const backupCodes = this.generateBackupCodes();

    // Hash backup codes (in production, use bcrypt)
    const hashedCodes = backupCodes.map(code => 
      require('crypto').createHash('sha256').update(code).digest('hex')
    );

    await db.insert(twoFactorAuth).values({
      userId,
      secret,
      backupCodes: hashedCodes,
      enabled: false,
    }).onDuplicateKeyUpdate({ set: { secret, backupCodes: hashedCodes } });

    return {
      secret,
      qrCodeUrl,
      backupCodes, // Return unhashed codes to user (only once!)
    };
  }

  /**
   * Verify and enable 2FA
   */
  static async verify2FA(userId: number, code: string): Promise<boolean> {
    const twoFa = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, userId),
    });

    if (!twoFa) {
      throw new Error('2FA not setup');
    }

    if (!this.verifyTOTP(twoFa.secret, code)) {
      return false;
    }

    // Enable 2FA
    await db.update(twoFactorAuth)
      .set({ enabled: true, verifiedAt: new Date() })
      .where(eq(twoFactorAuth.userId, userId));

    return true;
  }

  /**
   * Verify TOTP code during login
   */
  static async verifyLoginCode(userId: number, code: string): Promise<boolean> {
    const twoFa = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, userId),
    });

    if (!twoFa || !twoFa.enabled) {
      return false;
    }

    // Check TOTP
    if (this.verifyTOTP(twoFa.secret, code)) {
      return true;
    }

    // Check backup code
    if (Array.isArray(twoFa.backupCodes)) {
      const codeHash = require('crypto').createHash('sha256').update(code).digest('hex');
      const index = (twoFa.backupCodes as string[]).indexOf(codeHash);
      
      if (index !== -1) {
        // Remove used backup code
        const updated = [...(twoFa.backupCodes as string[])];
        updated.splice(index, 1);
        
        await db.update(twoFactorAuth)
          .set({ backupCodes: updated })
          .where(eq(twoFactorAuth.userId, userId));
        
        return true;
      }
    }

    return false;
  }

  /**
   * Disable 2FA
   */
  static async disable2FA(userId: number): Promise<void> {
    await db.update(twoFactorAuth)
      .set({ enabled: false })
      .where(eq(twoFactorAuth.userId, userId));
  }

  /**
   * Check if user has 2FA enabled
   */
  static async is2FAEnabled(userId: number): Promise<boolean> {
    const twoFa = await db.query.twoFactorAuth.findFirst({
      where: eq(twoFactorAuth.userId, userId),
    });

    return twoFa?.enabled ?? false;
  }
}
