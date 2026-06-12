/**
 * Notification Processor
 * Processa eventos de notificação, enriquece dados e persiste no banco
 */

import { getDb } from '../db';
import { notifications } from '../../drizzle/schema';
import { NotificationEvent } from './notification-event-bus';
import { lt, and, eq } from 'drizzle-orm';

export interface ProcessedNotification {
  userId: number;
  type: 'execution' | 'risk' | 'market' | 'system';
  eventType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'critical';
  strategyId?: number;
  actionUrl?: string;
  soundEnabled: boolean;
  soundUrl?: string;
  metadata?: string;
}

export class NotificationProcessor {
  /**
   * Processar evento e persistir no banco
   */
  static async process(event: NotificationEvent): Promise<ProcessedNotification | null> {
    try {
      // Enriquecer notificação
      const enriched = this.enrichNotification(event);

      // Aplicar regras de prioridade
      this.applyPriorityRules(enriched);

      // Persistir no banco
      await this.persistNotification(enriched);

      console.log(`[NotificationProcessor] ✅ Notificação processada para usuário ${event.userId}`);
      return enriched;
    } catch (error) {
      console.error(`[NotificationProcessor] Erro ao processar notificação:`, error);
      return null;
    }
  }

  /**
   * Enriquecer notificação com dados adicionais
   */
  private static enrichNotification(event: NotificationEvent): ProcessedNotification {
    // Mapear tipo de evento para categoria
    const typeMap: Record<string, 'execution' | 'risk' | 'market' | 'system'> = {
      trade_opened: 'execution',
      trade_closed: 'execution',
      trade_closed_by_sl: 'execution',
      trade_closed_by_tp: 'execution',
      trade_error: 'execution',
      strategy_executed: 'execution',
      strategy_signal_generated: 'execution',
      strategy_error: 'execution',
      sync_completed: 'market',
      market_alert: 'market',
      system_error: 'system',
      system_warning: 'system',
      risk_limit_exceeded: 'risk',
      daily_loss_limit_hit: 'risk',
    };

    const type = typeMap[event.type] || 'system';

    return {
      userId: event.userId,
      type,
      eventType: event.eventType,
      title: event.title,
      message: event.message,
      severity: event.severity,
      priority: event.priority,
      strategyId: event.strategyId,
      actionUrl: event.actionUrl,
      soundEnabled: event.soundEnabled || false,
      soundUrl: event.soundUrl,
      metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
    };
  }

  /**
   * Aplicar regras de prioridade
   */
  private static applyPriorityRules(notification: ProcessedNotification): void {
    // Regra 1: Erros críticos sempre são críticos
    if (notification.severity === 'error') {
      notification.priority = 'critical';
    }

    // Regra 2: Stop loss e take profit são altos
    if (notification.eventType === 'trade_closed_by_sl' || notification.eventType === 'trade_closed_by_tp') {
      notification.priority = 'high';
    }

    // Regra 3: Limites de risco são críticos
    if (notification.eventType === 'risk_limit_exceeded' || notification.eventType === 'daily_loss_limit_hit') {
      notification.priority = 'critical';
    }

    // Regra 4: Sincronizações são baixa prioridade
    if (notification.eventType === 'sync_completed') {
      notification.priority = 'low';
    }
  }

  /**
   * Persistir notificação no banco
   */
  private static async persistNotification(notification: ProcessedNotification): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.insert(notifications).values({
      userId: notification.userId,
      type: notification.type,
      eventType: notification.eventType,
      title: notification.title,
      message: notification.message,
      severity: notification.severity,
      priority: notification.priority,
      strategyId: notification.strategyId,
      actionUrl: notification.actionUrl,
      soundEnabled: notification.soundEnabled,
      soundUrl: notification.soundUrl,
      metadata: notification.metadata,
      read: false,
    });
  }

  /**
   * Processar lote de eventos
   */
  static async processBatch(events: NotificationEvent[]): Promise<ProcessedNotification[]> {
    const results = await Promise.all(events.map((event) => this.process(event)));
    return results.filter((r) => r !== null) as ProcessedNotification[];
  }

  /**
   * Limpar notificações expiradas
   */
  static async cleanupExpiredNotifications(): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const now = new Date();
    await db.delete(notifications).where(lt(notifications.expiresAt, now));

    console.log(`[NotificationProcessor] Limpeza: notificações expiradas removidas`);
    return 0;
  }

  /**
   * Arquivar notificações antigas
   */
  static async archiveOldNotifications(daysOld: number = 30): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // Marcar como lidas e desativar
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(lt(notifications.createdAt, cutoffDate), eq(notifications.read, false)));

    console.log(`[NotificationProcessor] Arquivamento: notificações antigas marcadas como lidas`);
    return 0;
  }
}
