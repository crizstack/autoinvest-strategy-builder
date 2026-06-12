/**
 * Notification Event Bus
 * Centraliza todos os eventos de notificação do sistema
 * Permite que múltiplos subscribers se inscrevam em eventos específicos
 */

export type NotificationEventType =
  | 'trade_opened'
  | 'trade_closed'
  | 'trade_closed_by_sl'
  | 'trade_closed_by_tp'
  | 'trade_error'
  | 'strategy_executed'
  | 'strategy_signal_generated'
  | 'strategy_error'
  | 'sync_completed'
  | 'market_alert'
  | 'system_error'
  | 'system_warning'
  | 'risk_limit_exceeded'
  | 'daily_loss_limit_hit';

export interface NotificationEvent {
  type: NotificationEventType;
  userId: number;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'normal' | 'high' | 'critical';
  eventType: NotificationEventType;
  strategyId?: number;
  actionUrl?: string;
  soundEnabled?: boolean;
  soundUrl?: string;
  metadata?: Record<string, unknown>;
}

type EventHandler = (event: NotificationEvent) => Promise<void> | void;

export class NotificationEventBus {
  private static subscribers: Map<NotificationEventType, EventHandler[]> = new Map();
  private static globalSubscribers: EventHandler[] = [];

  /**
   * Inscrever em um tipo específico de evento
   */
  static subscribe(eventType: NotificationEventType, handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    const handlers = this.subscribers.get(eventType)!;
    handlers.push(handler);

    // Retornar função para desinscrever
    return () => {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Inscrever em todos os eventos
   */
  static subscribeAll(handler: EventHandler): () => void {
    this.globalSubscribers.push(handler);

    return () => {
      const index = this.globalSubscribers.indexOf(handler);
      if (index > -1) {
        this.globalSubscribers.splice(index, 1);
      }
    };
  }

  /**
   * Emitir um evento
   */
  static async emit(event: NotificationEvent): Promise<void> {
    console.log(`[NotificationEventBus] Emitindo evento: ${event.type} para usuário ${event.userId}`);

    // Executar global subscribers
    for (const handler of this.globalSubscribers) {
      try {
        await Promise.resolve(handler(event));
      } catch (error) {
        console.error(`[NotificationEventBus] Erro em global subscriber:`, error);
      }
    }

    // Executar subscribers específicos
    const handlers = this.subscribers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await Promise.resolve(handler(event));
      } catch (error) {
        console.error(`[NotificationEventBus] Erro em subscriber para ${event.type}:`, error);
      }
    }
  }

  /**
   * Limpar todos os subscribers (para testes)
   */
  static clear(): void {
    this.subscribers.clear();
    this.globalSubscribers = [];
  }

  /**
   * Obter número de subscribers
   */
  static getSubscriberCount(eventType?: NotificationEventType): number {
    if (eventType) {
      return (this.subscribers.get(eventType) || []).length;
    }
    return this.globalSubscribers.length + Array.from(this.subscribers.values()).reduce((sum, arr) => sum + arr.length, 0);
  }
}

/**
 * Helpers para criar eventos específicos
 */
export const createNotificationEvent = {
  tradeOpened: (userId: number, asset: string, quantity: number, entryPrice: number, strategyId?: number): NotificationEvent => ({
    type: 'trade_opened',
    userId,
    title: `📈 Trade Aberto: ${asset}`,
    message: `${quantity} unidades de ${asset} a R$ ${entryPrice.toFixed(2)}`,
    severity: 'success',
    priority: 'high',
    eventType: 'trade_opened',
    strategyId,
    soundEnabled: true,
    soundUrl: '/sounds/trade-opened.mp3',
  }),

  tradeClosed: (userId: number, asset: string, pnl: number, pnlPercent: number, reason: string, strategyId?: number): NotificationEvent => ({
    type: 'trade_closed',
    userId,
    title: `${pnl > 0 ? '✅' : '❌'} Trade Fechado: ${asset}`,
    message: `P&L: R$ ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%) - ${reason}`,
    severity: pnl > 0 ? 'success' : 'warning',
    priority: 'high',
    eventType: 'trade_closed',
    strategyId,
    soundEnabled: true,
    soundUrl: pnl > 0 ? '/sounds/profit.mp3' : '/sounds/loss.mp3',
  }),

  stopLossHit: (userId: number, asset: string, pnl: number, strategyId?: number): NotificationEvent => ({
    type: 'trade_closed_by_sl',
    userId,
    title: `⛔ Stop Loss Acionado: ${asset}`,
    message: `Trade fechado automaticamente. P&L: R$ ${pnl.toFixed(2)}`,
    severity: 'warning',
    priority: 'critical',
    eventType: 'trade_closed_by_sl',
    strategyId,
    soundEnabled: true,
    soundUrl: '/sounds/stop-loss.mp3',
  }),

  takeProfitHit: (userId: number, asset: string, pnl: number, strategyId?: number): NotificationEvent => ({
    type: 'trade_closed_by_tp',
    userId,
    title: `🎯 Take Profit Acionado: ${asset}`,
    message: `Trade fechado com lucro. P&L: R$ ${pnl.toFixed(2)}`,
    severity: 'success',
    priority: 'high',
    eventType: 'trade_closed_by_tp',
    strategyId,
    soundEnabled: true,
    soundUrl: '/sounds/take-profit.mp3',
  }),

  strategyExecuted: (userId: number, strategyName: string, signalsGenerated: number, strategyId?: number): NotificationEvent => ({
    type: 'strategy_executed',
    userId,
    title: `⚙️ Estratégia Executada: ${strategyName}`,
    message: `${signalsGenerated} sinais gerados`,
    severity: 'info',
    priority: 'normal',
    eventType: 'strategy_executed',
    strategyId,
  }),

  syncCompleted: (userId: number, assetsCount: number): NotificationEvent => ({
    type: 'sync_completed',
    userId,
    title: '✅ Sincronização Concluída',
    message: `${assetsCount} ativos sincronizados com sucesso`,
    severity: 'success',
    priority: 'low',
    eventType: 'sync_completed',
  }),

  systemError: (userId: number, errorMessage: string): NotificationEvent => ({
    type: 'system_error',
    userId,
    title: '🔴 Erro do Sistema',
    message: errorMessage,
    severity: 'error',
    priority: 'critical',
    eventType: 'system_error',
    soundEnabled: true,
    soundUrl: '/sounds/error.mp3',
  }),

  riskLimitExceeded: (userId: number, limitType: string, currentValue: number, maxValue: number): NotificationEvent => ({
    type: 'risk_limit_exceeded',
    userId,
    title: '⚠️ Limite de Risco Excedido',
    message: `${limitType}: ${currentValue.toFixed(2)} / ${maxValue.toFixed(2)}`,
    severity: 'error',
    priority: 'critical',
    eventType: 'risk_limit_exceeded',
    soundEnabled: true,
    soundUrl: '/sounds/warning.mp3',
  }),
};
