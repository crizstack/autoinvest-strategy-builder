/**
 * WebSocket Server - Servidor realtime para atualizar dados em tempo real
 * Implementa reconnect automático e fallback para polling
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { ConnectionManager } from './connection-manager';
import { EventBus, type EventType, type EventPayload } from './event-bus';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'pong';
  subscription?: string;
  userId?: number;
  token?: string;
}

class WebSocketServerImpl {
  private static instance: WebSocketServerImpl;
  private wss: WebSocketServer | null = null;
  private httpServer: any = null;
  private port: number = 3001;
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): WebSocketServerImpl {
    if (!WebSocketServerImpl.instance) {
      WebSocketServerImpl.instance = new WebSocketServerImpl();
    }
    return WebSocketServerImpl.instance;
  }

  /**
   * Iniciar servidor WebSocket
   */
  async start(port: number = 3001): Promise<void> {
    if (this.isRunning) {
      console.warn('[WebSocketServer] Server already running');
      return;
    }

    this.port = port;

    try {
      // Criar servidor HTTP
      this.httpServer = createServer();

      // Criar WebSocket server
      this.wss = new WebSocketServer({ server: this.httpServer });

      // Configurar handlers
      this.setupHandlers();

      // Iniciar servidor
      this.httpServer.listen(this.port, () => {
        this.isRunning = true;
        console.log(`[WebSocketServer] Started on port ${this.port}`);
      });

      // Iniciar heartbeat
      this.startHeartbeat();

      // Inscrever em eventos do EventBus
      this.subscribeToEvents();
    } catch (error) {
      console.error('[WebSocketServer] Failed to start:', error);
      throw error;
    }
  }

  /**
   * Parar servidor WebSocket
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    ConnectionManager.clear();

    if (this.wss) {
      this.wss.close();
    }

    if (this.httpServer) {
      this.httpServer.close();
    }

    console.log('[WebSocketServer] Stopped');
  }

  /**
   * Configurar handlers
   */
  private setupHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = uuidv4();
      console.log(`[WebSocketServer] New connection: ${clientId}`);

      // Validar autenticação
      const token = new URL(
        `http://localhost${req.url}`,
        'http://localhost'
      ).searchParams.get('token');

      let userId: number | null = null;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
          userId = decoded.userId;
        } catch (error) {
          console.error('[WebSocketServer] Invalid token:', error);
          ws.close(1008, 'Unauthorized');
          return;
        }
      }

      if (!userId) {
        ws.close(1008, 'Unauthorized');
        return;
      }

      // Registrar conexão
      const connection = ConnectionManager.registerConnection(clientId, userId, ws);

      // Enviar confirmação de conexão
      this.sendMessage(ws, {
        type: 'connection:established',
        clientId,
        userId,
        timestamp: Date.now(),
      });

      // Publicar evento
      EventBus.publish('connection:established', {
        userId,
        timestamp: Date.now(),
      });

      // Handler para mensagens
      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, userId, message);
        } catch (error) {
          console.error('[WebSocketServer] Failed to parse message:', error);
        }
      });

      // Handler para erro
      ws.on('error', (error) => {
        console.error(`[WebSocketServer] Client error (${clientId}):`, error);
      });

      // Handler para desconexão
      ws.on('close', () => {
        ConnectionManager.removeConnection(clientId);
        EventBus.publish('connection:lost', {
          userId,
          timestamp: Date.now(),
        });
        console.log(`[WebSocketServer] Client disconnected: ${clientId}`);
      });
    });
  }

  /**
   * Processar mensagens do cliente
   */
  private handleMessage(
    clientId: string,
    userId: number,
    message: WebSocketMessage
  ): void {
    const connection = ConnectionManager.getConnection(clientId);
    if (!connection) return;

    switch (message.type) {
      case 'subscribe':
        if (message.subscription) {
          ConnectionManager.addSubscription(clientId, message.subscription);
          this.sendMessage(connection.ws, {
            type: 'subscription:confirmed',
            subscription: message.subscription,
          });
        }
        break;

      case 'unsubscribe':
        if (message.subscription) {
          ConnectionManager.removeSubscription(clientId, message.subscription);
          this.sendMessage(connection.ws, {
            type: 'subscription:removed',
            subscription: message.subscription,
          });
        }
        break;

      case 'ping':
        ConnectionManager.updateHeartbeat(clientId);
        this.sendMessage(connection.ws, { type: 'pong' });
        break;

      default:
        console.warn(
          `[WebSocketServer] Unknown message type: ${message.type}`
        );
    }
  }

  /**
   * Enviar mensagem para cliente
   */
  private sendMessage(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Enviar evento para clientes subscritos
   */
  broadcastEvent<T extends EventType>(
    event: T,
    payload: EventPayload[T]
  ): void {
    const connections = ConnectionManager.getConnectionsBySubscription(event);

    connections.forEach(connection => {
      this.sendMessage(connection.ws, {
        type: 'event',
        event,
        payload,
        timestamp: Date.now(),
      });
    });

    console.log(
      `[WebSocketServer] Broadcasted ${event} to ${connections.length} clients`
    );
  }

  /**
   * Enviar evento para usuário específico
   */
  sendToUser<T extends EventType>(userId: number, event: T, payload: EventPayload[T]): void {
    const connections = ConnectionManager.getUserConnections(userId);

    connections.forEach(connection => {
      this.sendMessage(connection.ws, {
        type: 'event',
        event,
        payload,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Iniciar heartbeat para detectar conexões mortas
   */
  private startHeartbeat(): void {
    setInterval(() => {
      const connections = ConnectionManager.getAllConnections();

      connections.forEach(connection => {
        if (connection.ws.readyState === WebSocket.OPEN) {
          this.sendMessage(connection.ws, { type: 'ping' });
        }
      });

      // Remover conexões inativas
      const inactiveConnections = ConnectionManager.getInactiveConnections(60000);
      inactiveConnections.forEach(connection => {
        connection.ws.close(1000, 'Timeout');
      });
    }, 30000); // A cada 30 segundos
  }

  /**
   * Inscrever em eventos do EventBus
   */
  private subscribeToEvents(): void {
    // Eventos de trading
    EventBus.subscribe('trade:open', (payload) => {
      this.broadcastEvent('trade:open', payload);
    });

    EventBus.subscribe('trade:close', (payload) => {
      this.broadcastEvent('trade:close', payload);
    });

    EventBus.subscribe('trade:update', (payload) => {
      this.broadcastEvent('trade:update', payload);
    });

    // Eventos de portfolio
    EventBus.subscribe('portfolio:update', (payload) => {
      this.broadcastEvent('portfolio:update', payload);
    });

    EventBus.subscribe('pnl:update', (payload) => {
      this.broadcastEvent('pnl:update', payload);
    });

    // Eventos de mercado
    EventBus.subscribe('price:update', (payload) => {
      this.broadcastEvent('price:update', payload);
    });

    EventBus.subscribe('candle:update', (payload) => {
      this.broadcastEvent('candle:update', payload);
    });

    // Eventos de notificação
    EventBus.subscribe('notification:new', (payload) => {
      this.broadcastEvent('notification:new', payload);
    });

    console.log('[WebSocketServer] Subscribed to EventBus events');
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      ...ConnectionManager.getStats(),
    };
  }
}

export const WebSocketServerInstance = WebSocketServerImpl.getInstance();
