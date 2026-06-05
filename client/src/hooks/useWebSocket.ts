/**
 * useWebSocket Hook - Gerencia conexão WebSocket com reconnect automático
 * Fornece interface simples para subscribe/unsubscribe de eventos realtime
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';

export type WebSocketEventType =
  | 'price:update'
  | 'candle:update'
  | 'trade:open'
  | 'trade:close'
  | 'trade:update'
  | 'portfolio:update'
  | 'pnl:update'
  | 'notification:new'
  | 'notification:read'
  | 'connection:established'
  | 'connection:lost'
  | 'connection:reconnected';

export interface WebSocketMessage {
  type: string;
  event?: WebSocketEventType;
  payload?: any;
  subscription?: string;
  clientId?: string;
  userId?: number;
  timestamp?: number;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

const DEFAULT_RECONNECT_INTERVAL = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnectAttempts = MAX_RECONNECT_ATTEMPTS,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Map<WebSocketEventType, Set<(payload: any) => void>>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Conectar ao WebSocket
   */
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (!user) {
      console.warn('[useWebSocket] User not authenticated');
      return;
    }

    setIsConnecting(true);

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = sessionStorage.getItem('auth_token') || '';
      const wsUrl = `${protocol}//${window.location.host}?token=${token}`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[useWebSocket] Connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
        onConnect?.();

        // Reinscrever em eventos após reconectar
        subscriptionsRef.current.forEach((_, event) => {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              subscription: event,
            })
          );
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'event' && message.event) {
            const callbacks = subscriptionsRef.current.get(message.event);
            if (callbacks) {
              callbacks.forEach(callback => callback(message.payload));
            }
          } else if (message.type === 'pong') {
            // Heartbeat response
          } else if (message.type === 'connection:established') {
            console.log('[useWebSocket] Connection established:', message.clientId);
          }
        } catch (error) {
          console.error('[useWebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[useWebSocket] Error:', error);
        onError?.(new Error('WebSocket error'));
      };

      ws.onclose = () => {
        console.log('[useWebSocket] Disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // Tentar reconectar
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(
              `[useWebSocket] Reconnecting... (attempt ${reconnectAttemptsRef.current})`
            );
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[useWebSocket] Failed to connect:', error);
      setIsConnecting(false);
      onError?.(error instanceof Error ? error : new Error('Failed to connect'));
    }
  }, [user, reconnectInterval, maxReconnectAttempts, onConnect, onDisconnect, onError]);

  /**
   * Desconectar do WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  /**
   * Subscrever a um evento
   */
  const subscribe = useCallback(
    (event: WebSocketEventType, callback: (payload: any) => void) => {
      if (!subscriptionsRef.current.has(event)) {
        subscriptionsRef.current.set(event, new Set());
      }

      subscriptionsRef.current.get(event)!.add(callback);

      // Enviar subscribe se conectado
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'subscribe',
            subscription: event,
          })
        );
      }

      // Retornar função para unsubscribe
      return () => {
        const callbacks = subscriptionsRef.current.get(event);
        if (callbacks) {
          callbacks.delete(callback);
          if (callbacks.size === 0) {
            subscriptionsRef.current.delete(event);

            // Enviar unsubscribe se conectado
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: 'unsubscribe',
                  subscription: event,
                })
              );
            }
          }
        }
      };
    },
    []
  );

  /**
   * Enviar ping para manter conexão viva
   */
  const ping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  /**
   * Inicializar conexão
   */
  useEffect(() => {
    if (autoConnect && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, user, connect, disconnect]);

  /**
   * Heartbeat para manter conexão viva
   */
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      ping();
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [isConnected, ping]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    subscribe,
    ping,
  };
}
