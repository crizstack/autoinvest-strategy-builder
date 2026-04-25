import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { InsertUser, users } from '../../drizzle/schema';
import { TRPCError } from '@trpc/server';

export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user
   */
  static async register(email: string, password: string, name?: string): Promise<InsertUser> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const newUser: InsertUser = {
      email,
      passwordHash,
      name: name || email.split('@')[0],
      loginMethod: 'email',
      openId: `email_${email}_${Date.now()}`, // Temporary openId for email users
      role: 'user',
    };

    await db.insert(users).values(newUser);

    return newUser;
  }

  /**
   * Login user with email and password
   */
  static async login(email: string, password: string) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Find user by email
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userList.length === 0) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    const user = userList[0];

    // Verify password
    if (!user.passwordHash) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
      });
    }

    // Update lastSignedIn
    await db
      .update(users)
      .set({ lastSignedIn: new Date() })
      .where(eq(users.id, user.id));

    return user;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string) {
    const db = await getDb();
    if (!db) return null;

    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return userList.length > 0 ? userList[0] : null;
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number) {
    const db = await getDb();
    if (!db) return null;

    const userList = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return userList.length > 0 ? userList[0] : null;
  }

  /**
   * Update password
   */
  static async updatePassword(userId: number, newPassword: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const passwordHash = await this.hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
  }

  /**
   * Generate password reset token (simple implementation)
   * In production, use a proper token service with expiration
   */
  static generatePasswordResetToken(email: string): string {
    const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
    return token;
  }

  /**
   * Verify password reset token
   */
  static verifyPasswordResetToken(token: string, email: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [tokenEmail, timestamp] = decoded.split(':');
      
      // Check if email matches
      if (tokenEmail !== email) return false;

      // Check if token is not older than 1 hour
      const tokenTime = parseInt(timestamp, 10);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      return now - tokenTime < oneHour;
    } catch {
      return false;
    }
  }
}
