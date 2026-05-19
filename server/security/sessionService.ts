import { randomBytes } from 'crypto';
import { getDb } from '../db';
import { userSessions } from '../../drizzle/schema';
import { eq, and, isNull } from 'drizzle-orm';

let db: any = null;

// Initialize db lazily
async function getDatabase() {
  if (!db) {
    db = await getDb();
  }
  return db;
}

export class SessionService {
  /**
   * Create a new session
   */
  static async createSession(
    userId: number,
    ipAddress?: string,
    userAgent?: string,
    expiresInDays = 30
  ): Promise<string> {
    const database = await getDatabase();
    if (!database) throw new Error('Database not available');
    const sessionToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await database.insert(userSessions).values({
      userId,
      sessionToken,
      ipAddress,
      userAgent,
      expiresAt,
    });

    return sessionToken;
  }

  /**
   * Validate a session token
   */
  static async validateSession(sessionToken: string): Promise<{
    valid: boolean;
    userId?: number;
    session?: typeof userSessions.$inferSelect;
  }> {
    const database = await getDatabase();
    if (!database) return { valid: false };
    const session = await database.query.userSessions.findFirst({
      where: eq(userSessions.sessionToken, sessionToken),
    });

    if (!session) {
      return { valid: false };
    }

    if (session.revokedAt) {
      return { valid: false };
    }

    if (session.expiresAt && session.expiresAt < new Date()) {
      return { valid: false };
    }

    // Update last activity
    await database.update(userSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(userSessions.id, session.id));

    return { valid: true, userId: session.userId, session };
  }

  /**
   * Get all active sessions for a user
   */
  static async getActiveSessions(userId: number) {
    const database = await getDatabase();
    if (!database) return [];
    return database.query.userSessions.findMany({
      where: (s: any) => and(
        eq(s.userId, userId),
        isNull(s.revokedAt)
      ),
      orderBy: (sessions: any) => sessions.lastActivityAt,
    });
  }

  /**
   * Revoke a session
   */
  static async revokeSession(sessionId: number): Promise<void> {
    const database = await getDatabase();
    if (!database) return;
    await database.update(userSessions)
      .set({ revokedAt: new Date() })
      .where(eq(userSessions.id, sessionId));
  }

  /**
   * Revoke all sessions for a user (except current)
   */
  static async revokeAllOtherSessions(userId: number, currentSessionId?: number): Promise<void> {
    const database = await getDatabase();
    if (!database) return;
    const sessions = await database.query.userSessions.findMany({
      where: (s: any) => and(
        eq(s.userId, userId),
        isNull(s.revokedAt)
      ),
    });

    for (const session of sessions) {
      if (currentSessionId && session.id === currentSessionId) {
        continue;
      }

      await this.revokeSession(session.id);
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const database = await getDatabase();
    if (!database) return 0;
    const now = new Date();
    
    // Mark expired sessions as revoked
    const expiredSessions = await database.query.userSessions.findMany({
      where: (sessions: any) => {
        const { and: andOp, lt, isNull: isNullOp } = require('drizzle-orm');
        return andOp(
          lt(sessions.expiresAt, now),
          isNullOp(sessions.revokedAt)
        );
      },
    });

    for (const session of expiredSessions) {
      await this.revokeSession(session.id);
    }

    return expiredSessions.length;
  }

  /**
   * Detect suspicious session activity
   */
  static async detectSuspiciousActivity(userId: number): Promise<{
    suspicious: boolean;
    reason?: string;
    sessions: any[];
  }> {
    const sessions = await this.getActiveSessions(userId);

    if (sessions.length > 10) {
      return {
        suspicious: true,
        reason: 'Unusually high number of active sessions',
        sessions,
      };
    }

    // Check for sessions from very different IPs
    const ips = new Set(sessions.map((s: any) => s.ipAddress).filter(Boolean));
    if (ips.size > 5) {
      return {
        suspicious: true,
        reason: 'Sessions from multiple different locations',
        sessions,
      };
    }

    return {
      suspicious: false,
      sessions,
    };
  }

  /**
   * Get session info
   */
  static async getSessionInfo(sessionToken: string) {
    return db.query.userSessions.findFirst({
      where: eq(userSessions.sessionToken, sessionToken),
    });
  }
}
