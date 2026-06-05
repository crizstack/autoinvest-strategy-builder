/**
 * Connection Manager - Gerencia conexões WebSocket ativas
 * Rastreia clientes conectados e suas subscriptions
 */

import type { WebSocket } from 'ws';

export interface ClientConnection {
  id: string;
  userId: number;
  ws: WebSocket;
  connectedAt: Date;
  subscriptions: Set<string>;
  lastHeartbeat: Date;
}

class ConnectionManagerImpl {
  private static instance: ConnectionManagerImpl;
  private connections: Map<string, ClientConnection> = new Map();
  private userConnections: Map<number, Set<string>> = new Map();

  private constructor() {}

  static getInstance(): ConnectionManagerImpl {
    if (!ConnectionManagerImpl.instance) {
      ConnectionManagerImpl.instance = new ConnectionManagerImpl();
    }
    return ConnectionManagerImpl.instance;
  }

  /**
   * Registrar nova conexão
   */
  registerConnection(
    id: string,
    userId: number,
    ws: WebSocket
  ): ClientConnection {
    const connection: ClientConnection = {
      id,
      userId,
      ws,
      connectedAt: new Date(),
      subscriptions: new Set(),
      lastHeartbeat: new Date(),
    };

    this.connections.set(id, connection);

    // Rastrear conexões por usuário
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(id);

    console.log(`[ConnectionManager] Client connected: ${id} (User: ${userId})`);
    return connection;
  }

  /**
   * Remover conexão
   */
  removeConnection(id: string): void {
    const connection = this.connections.get(id);
    if (!connection) return;

    this.connections.delete(id);

    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(id);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    console.log(`[ConnectionManager] Client disconnected: ${id}`);
  }

  /**
   * Obter conexão por ID
   */
  getConnection(id: string): ClientConnection | undefined {
    return this.connections.get(id);
  }

  /**
   * Obter todas as conexões de um usuário
   */
  getUserConnections(userId: number): ClientConnection[] {
    const connectionIds = this.userConnections.get(userId) || new Set();
    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter((conn): conn is ClientConnection => conn !== undefined);
  }

  /**
   * Obter todas as conexões
   */
  getAllConnections(): ClientConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Adicionar subscription
   */
  addSubscription(connectionId: string, subscription: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.subscriptions.add(subscription);
      console.log(
        `[ConnectionManager] Subscription added: ${connectionId} -> ${subscription}`
      );
    }
  }

  /**
   * Remover subscription
   */
  removeSubscription(connectionId: string, subscription: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.subscriptions.delete(subscription);
      console.log(
        `[ConnectionManager] Subscription removed: ${connectionId} -> ${subscription}`
      );
    }
  }

  /**
   * Obter todas as subscriptions de uma conexão
   */
  getSubscriptions(connectionId: string): string[] {
    const connection = this.connections.get(connectionId);
    return connection ? Array.from(connection.subscriptions) : [];
  }

  /**
   * Obter conexões que estão subscritas a um evento
   */
  getConnectionsBySubscription(subscription: string): ClientConnection[] {
    return Array.from(this.connections.values()).filter(conn =>
      conn.subscriptions.has(subscription)
    );
  }

  /**
   * Atualizar heartbeat
   */
  updateHeartbeat(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.lastHeartbeat = new Date();
    }
  }

  /**
   * Verificar conexões inativas
   */
  getInactiveConnections(timeoutMs: number = 60000): ClientConnection[] {
    const now = new Date();
    return Array.from(this.connections.values()).filter(conn => {
      const timeSinceHeartbeat = now.getTime() - conn.lastHeartbeat.getTime();
      return timeSinceHeartbeat > timeoutMs;
    });
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      averageSubscriptionsPerConnection:
        Array.from(this.connections.values()).reduce(
          (sum, conn) => sum + conn.subscriptions.size,
          0
        ) / Math.max(this.connections.size, 1),
    };
  }

  /**
   * Limpar todas as conexões
   */
  clear(): void {
    this.connections.clear();
    this.userConnections.clear();
  }
}

export const ConnectionManager = ConnectionManagerImpl.getInstance();
