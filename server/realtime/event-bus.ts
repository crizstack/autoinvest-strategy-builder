/**
 * Event Bus - Sistema centralizado de eventos para realtime
 * Permite que serviços publiquem eventos e componentes se inscrevam
 */

import { EventEmitter } from 'events';

export type EventType = 
  // Market Data
  | 'price:update'
  | 'candle:update'
  
  // Trading
  | 'trade:open'
  | 'trade:close'
  | 'trade:update'
  
  // Portfolio
  | 'portfolio:update'
  | 'pnl:update'
  
  // Notifications
  | 'notification:new'
  | 'notification:read'
  
  // System
  | 'connection:established'
  | 'connection:lost'
  | 'connection:reconnected';

export interface EventPayload {
  'price:update': { symbol: string; price: number; timestamp: number };
  'candle:update': { symbol: string; candle: any; timestamp: number };
  
  'trade:open': { tradeId: number; asset: string; quantity: number; price: number };
  'trade:close': { tradeId: number; pnl: number; pnlPercent: number };
  'trade:update': { tradeId: number; currentPrice: number; unrealizedPnL: number };
  
  'portfolio:update': { userId: number; balance: number; totalReturn: number; openPositions: number };
  'pnl:update': { userId: number; totalUnrealizedPnL: number; positions: any[] };
  
  'notification:new': { userId: number; type: string; title: string; message: string; severity: string };
  'notification:read': { userId: number; notificationId: number };
  
  'connection:established': { userId: number; timestamp: number };
  'connection:lost': { userId: number; timestamp: number };
  'connection:reconnected': { userId: number; timestamp: number };
}

class EventBusImpl extends EventEmitter {
  private static instance: EventBusImpl;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): EventBusImpl {
    if (!EventBusImpl.instance) {
      EventBusImpl.instance = new EventBusImpl();
    }
    return EventBusImpl.instance;
  }

  /**
   * Publicar um evento
   */
  publish<T extends EventType>(event: T, payload: EventPayload[T]): void {
    console.log(`[EventBus] Publishing event: ${event}`, payload);
    this.emit(event, payload);
  }

  /**
   * Subscrever a um evento
   */
  subscribe<T extends EventType>(
    event: T,
    callback: (payload: EventPayload[T]) => void
  ): () => void {
    this.on(event, callback);
    
    // Retornar função para unsubscribe
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Subscrever a múltiplos eventos
   */
  subscribeMultiple<T extends EventType>(
    events: T[],
    callback: (event: T, payload: any) => void
  ): () => void {
    const unsubscribers = events.map(event => {
      this.on(event, (payload) => callback(event, payload));
      return () => this.off(event, (payload) => callback(event, payload));
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }

  /**
   * Subscrever uma única vez
   */
  subscribeOnce<T extends EventType>(
    event: T,
    callback: (payload: EventPayload[T]) => void
  ): void {
    this.once(event, callback);
  }

  /**
   * Obter número de subscribers
   */
  getSubscriberCount(event: EventType): number {
    return this.listenerCount(event);
  }

  /**
   * Limpar todos os listeners
   */
  clear(): void {
    this.removeAllListeners();
  }
}

export const EventBus = EventBusImpl.getInstance();
