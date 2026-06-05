/**
 * useRealtimeData Hook - Fornece dados realtime com fallback para polling
 * Tenta usar WebSocket, mas volta para polling se não estiver disponível
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useWebSocket, type WebSocketEventType } from './useWebSocket';

export interface UseRealtimeDataOptions {
  event: WebSocketEventType;
  pollingInterval?: number;
  fallbackToPolling?: boolean;
  onData?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useRealtimeData<T = any>(
  queryFn: () => Promise<T>,
  options: UseRealtimeDataOptions
) {
  const {
    event,
    pollingInterval = 30000,
    fallbackToPolling = true,
    onData,
    onError,
  } = options;

  const { isConnected, subscribe } = useWebSocket({
    autoConnect: true,
  });

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /**
   * Buscar dados
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await queryFn();
      setData(result);
      setError(null);
      onData?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, onData, onError]);

  /**
   * Iniciar polling
   */
  const startPolling = useCallback(() => {
    // Buscar imediatamente
    fetchData();

    // Configurar polling
    pollingTimeoutRef.current = setInterval(() => {
      fetchData();
    }, pollingInterval);
  }, [fetchData, pollingInterval]);

  /**
   * Parar polling
   */
  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Inicializar realtime ou polling
   */
  useEffect(() => {
    if (isConnected) {
      // Usar WebSocket
      console.log(`[useRealtimeData] Using WebSocket for ${event}`);

      // Buscar dados iniciais
      fetchData();

      // Subscrever a atualizações
      unsubscribeRef.current = subscribe(event, (payload) => {
        setData(payload);
        onData?.(payload);
      });

      stopPolling();
    } else if (fallbackToPolling) {
      // Fallback para polling
      console.log(`[useRealtimeData] Using polling for ${event}`);
      startPolling();
    } else {
      // Apenas buscar uma vez
      fetchData();
    }

    return () => {
      stopPolling();
      unsubscribeRef.current?.();
    };
  }, [isConnected, event, fetchData, subscribe, onData, fallbackToPolling, startPolling, stopPolling]);

  /**
   * Refetch manual
   */
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isRealtime: isConnected,
  };
}
