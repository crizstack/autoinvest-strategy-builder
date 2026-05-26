import { getDb } from '../db';
import { auditLogs, securityEvents } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

let db: any = null;

// Initialize db lazily
async function getDatabase() {
  if (!db) {
    db = await getDb();
  }
  return db;
}

export type AuditAction = 
  | 'strategy_created'
  | 'strategy_updated'
  | 'strategy_deleted'
  | 'strategy_activated'
  | 'backtest_created'
  | 'trade_executed'
  | 'trade_closed'
  | 'settings_changed'
  | 'password_changed'
  | 'email_changed'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'session_revoked'
  | 'login'
  | 'logout';

export type SecurityEventType = 
  | 'login_success'
  | 'login_failed'
  | 'login_2fa'
  | 'suspicious_activity'
  | 'password_changed'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'session_revoked';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export class AuditService {
  /**
   * Log an audit event
   */
  static async logAudit(
    userId: number | null,
    action: AuditAction,
    resourceType?: string,
    resourceId?: number,
    details?: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    try {
      const database = await getDatabase();
      if (!database) return;
      await database.insert(auditLogs).values({
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  }

  /**
   * Log a security event
   */
  static async logSecurityEvent(
    userId: number | null,
    eventType: SecurityEventType,
    severity: SeverityLevel = 'low',
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const database = await getDatabase();
      if (!database) return;
      await database.insert(securityEvents).values({
        userId,
        eventType,
        severity,
        ipAddress,
        userAgent,
        details,
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(userId: number, limit = 50) {
    const database = await getDatabase();
    if (!database) return [];
    return database
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(auditLogs.createdAt)
      .limit(limit);
  }

  /**
   * Get security events for a user
   */
  static async getUserSecurityEvents(userId: number, limit = 50) {
    const database = await getDatabase();
    if (!database) return [];
    return database
      .select()
      .from(securityEvents)
      .where(eq(securityEvents.userId, userId))
      .orderBy(securityEvents.createdAt)
      .limit(limit);
  }

  /**
   * Get unacknowledged security events
   */
  static async getUnacknowledgedEvents(userId: number) {
    const database = await getDatabase();
    if (!database) return [];
    const { and } = require('drizzle-orm');
    return database
      .select()
      .from(securityEvents)
      .where(and(
        eq(securityEvents.userId, userId),
        eq(securityEvents.acknowledged, false)
      ));
  }

  /**
   * Acknowledge a security event
   */
  static async acknowledgeEvent(eventId: number): Promise<void> {
    const database = await getDatabase();
    if (!database) return;
    await database.update(securityEvents)
      .set({ acknowledged: true })
      .where(eq(securityEvents.id, eventId));
  }

  /**
   * Check for suspicious activity
   */
  static async checkSuspiciousActivity(userId: number  ): Promise<{
    isSuspicious: boolean;
    reason?: string;
    events: any[];
  }> {
    const database = await getDatabase();
    if (!database) return { isSuspicious: false, events: [] };
    const { and, gte } = require('drizzle-orm');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFailedLogins = await database
      .select()
      .from(securityEvents)
      .where(and(
        eq(securityEvents.userId, userId),
        eq(securityEvents.eventType, 'login_failed'),
        gte(securityEvents.createdAt, oneHourAgo)
      ));

    if (recentFailedLogins.length >= 5) {
      return {
        isSuspicious: true,
        reason: 'Multiple failed login attempts',
        events: recentFailedLogins,
      };
    }

    return {
      isSuspicious: false,
      events: [],
    };
  }

  /**
   * Get account security score
   */
  static async getSecurityScore(userId: number): Promise<{
    score: number; // 0-100
    status: 'critical' | 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    let score = 50; // Base score

    // Check 2FA
    const db = await getDatabase();
    if (!db) return { score: 0, status: 'critical', recommendations: [] };
    
    // Note: twoFactorAuth table not found in schema, skipping 2FA check
    const twoFa = null;

    if (twoFa?.enabled) {
      score += 30;
    } else {
      recommendations.push('Enable two-factor authentication');
    }

    // Check recent security events
    const { and: and2, gte: gte2 } = require('drizzle-orm');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentEvents = await db
      .select()
      .from(securityEvents)
      .where(and2(
        eq(securityEvents.userId, userId),
        gte2(securityEvents.createdAt, thirtyDaysAgo)
      ));

    const criticalEvents = recentEvents.filter((e: any) => e.severity === 'critical');
    if (criticalEvents.length > 0) {
      score -= 20;
      recommendations.push('Review recent security alerts');
    }

    // Check session count
    // Note: userSessions table not found in schema, skipping session check
    const sessions = [];

    if (sessions.length > 5) {
      score -= 10;
      recommendations.push('Review and revoke unused sessions');
    }

    const status = score >= 80 ? 'high' : score >= 60 ? 'medium' : score >= 40 ? 'low' : 'critical';

    return { score: Math.max(0, Math.min(100, score)), status, recommendations };
  }
}
