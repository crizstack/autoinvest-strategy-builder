/**
 * Trading Automation Service
 * Gerencia automação contínua de estratégias e monitoramento de trades
 * Executa scheduler, retry, circuit breaker, anti-duplicação e controle de risco
 */

import { getDb } from '../db';
import { executionLogs, executionQueue, tradeExecutionLocks, riskControls, circuitBreakerStatus } from '../../drizzle/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { StrategyExecutorService } from './strategy-executor-service';
import { TradeMonitorService } from './trade-monitor-service';
import { PaperTradingEngine } from './paper-trading-engine';
import { v4 as uuidv4 } from 'uuid';

export interface AutomationConfig {
  executionIntervalMs: number; // 60000 = 1 minuto
  maxRetries: number; // 3
  retryBackoffMs: number; // 1000
  lockExpiryMs: number; // 30000
  circuitBreakerThreshold: number; // 5 falhas
  circuitBreakerResetMs: number; // 60000
}

export interface ExecutionResult {
  success: boolean;
  tradesOpened: number;
  tradesClosed: number;
  errors: string[];
  duration: number;
}

export class TradingAutomationService {
  private static config: AutomationConfig = {
    executionIntervalMs: 60000, // 1 minuto
    maxRetries: 3,
    retryBackoffMs: 1000,
    lockExpiryMs: 30000,
    circuitBreakerThreshold: 5,
    circuitBreakerResetMs: 60000,
  };

  /**
   * Inicializar automação (chamado no startup)
   */
  static async initialize() {
    console.log('[TradingAutomation] Inicializando automação de trading...');
    
    // Limpar locks expirados
    await this.cleanupExpiredLocks();
    
    // Inicializar circuit breakers
    await this.initializeCircuitBreakers();
    
    console.log('[TradingAutomation] Automação inicializada com sucesso');
  }

  /**
   * Executar ciclo de automação (chamado pelo Heartbeat)
   */
  static async executeAutomationCycle(): Promise<ExecutionResult> {
    const startTime = Date.now();
    const result: ExecutionResult = {
      success: true,
      tradesOpened: 0,
      tradesClosed: 0,
      errors: [],
      duration: 0,
    };

    try {
      // 1. Executar estratégias ativas
      const executionResult = await this.executeStrategies();
      result.tradesOpened += executionResult.tradesOpened;
      result.errors.push(...executionResult.errors.filter((e) => e !== undefined) as string[]);

      // 2. Monitorar trades abertos
      const monitoringResult = await this.monitorTrades();
      result.tradesClosed += monitoringResult.tradesClosed;
      result.errors.push(...monitoringResult.errors.filter((e) => e !== undefined) as string[]);

      // 3. Limpar locks expirados
      await this.cleanupExpiredLocks();

      result.duration = Date.now() - startTime;
      console.log(`[TradingAutomation] Ciclo completo: ${result.tradesOpened} trades abertos, ${result.tradesClosed} fechados em ${result.duration}ms`);
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      console.error('[TradingAutomation] Erro no ciclo de automação:', error);
    }

    return result;
  }

  /**
   * Executar estratégias ativas com proteção
   */
  private static async executeStrategies(): Promise<{ tradesOpened: number; errors: (string | undefined)[] }> {
    const result: { tradesOpened: number; errors: (string | undefined)[] } = { tradesOpened: 0, errors: [] };

    try {
      // Verificar circuit breaker
      const isOpen = await this.isCircuitBreakerOpen('strategy_executor');
      if (isOpen) {
        result.errors.push('Circuit breaker aberto para strategy executor');
        return result;
      }

      // Executar estratégias
      const executionResult = await StrategyExecutorService.executeActiveStrategies();
      result.tradesOpened = executionResult.tradesOpened || 0;

      if (executionResult.errors && executionResult.errors.length > 0) {
        result.errors.push(...executionResult.errors);
        await this.recordCircuitBreakerFailure('strategy_executor');
      } else {
        await this.recordCircuitBreakerSuccess('strategy_executor');
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      await this.recordCircuitBreakerFailure('strategy_executor');
    }

    return result;
  }

  /**
   * Monitorar trades abertos com proteção
   */
  private static async monitorTrades(): Promise<{ tradesClosed: number; errors: (string | undefined)[] }> {
    const result: { tradesClosed: number; errors: (string | undefined)[] } = { tradesClosed: 0, errors: [] };

    try {
      // Verificar circuit breaker
      const isOpen = await this.isCircuitBreakerOpen('trade_monitor');
      if (isOpen) {
        result.errors.push('Circuit breaker aberto para trade monitor');
        return result;
      }

      // Monitorar trades
      const monitoringResult = await StrategyExecutorService.monitorOpenPositions();
      result.tradesClosed = monitoringResult.closed || 0;

      if (monitoringResult.errors && monitoringResult.errors.length > 0) {
        result.errors.push(...monitoringResult.errors);
        await this.recordCircuitBreakerFailure('trade_monitor');
      } else {
        await this.recordCircuitBreakerSuccess('trade_monitor');
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      await this.recordCircuitBreakerFailure('trade_monitor');
    }

    return result;
  }

  /**
   * Adquirir lock transacional para evitar duplicação
   */
  static async acquireLock(
    strategyId: number,
    userId: number,
    asset: string,
    lockType: 'open' | 'close' | 'monitor'
  ): Promise<string | null> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const lockId = uuidv4();
    const expiresAt = new Date(Date.now() + this.config.lockExpiryMs);

    try {
      await db.insert(tradeExecutionLocks).values({
        strategyId,
        userId,
        asset,
        lockType,
        lockId,
        expiresAt,
      });

      return lockId;
    } catch (error) {
      // Lock já existe (outro processo tem o lock)
      return null;
    }
  }

  /**
   * Liberar lock transacional
   */
  static async releaseLock(lockId: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.delete(tradeExecutionLocks).where(eq(tradeExecutionLocks.lockId, lockId));
  }

  /**
   * Verificar se lock pode ser adquirido
   */
  static async canAcquireLock(
    strategyId: number,
    userId: number,
    asset: string,
    lockType: 'open' | 'close' | 'monitor'
  ): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const existingLock = await db
      .select()
      .from(tradeExecutionLocks)
      .where(
        and(
          eq(tradeExecutionLocks.strategyId, strategyId),
          eq(tradeExecutionLocks.userId, userId),
          eq(tradeExecutionLocks.asset, asset),
          eq(tradeExecutionLocks.lockType, lockType),
          lt(tradeExecutionLocks.expiresAt, new Date())
        )
      )
      .limit(1);

    return existingLock.length === 0;
  }

  /**
   * Validar risco antes de abrir trade
   */
  static async validateRisk(userId: number, tradeSize: number, portfolioValue: number): Promise<{ valid: boolean; reason?: string }> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar configuração de risco
    const riskConfig = await db
      .select()
      .from(riskControls)
      .where(eq(riskControls.userId, userId))
      .limit(1);

    if (riskConfig.length === 0) {
      return { valid: true }; // Sem restrição
    }

    const config = riskConfig[0];

    // Validar exposição máxima
    const maxExposure = (portfolioValue * Number(config.maxExposurePercent)) / 100;
    if (tradeSize > maxExposure) {
      return {
        valid: false,
        reason: `Trade size (${tradeSize}) exceeds max exposure (${maxExposure})`,
      };
    }

    // Validar perda máxima por trade
    if (config.maxLossPerTrade && tradeSize * 0.02 > Number(config.maxLossPerTrade)) {
      return {
        valid: false,
        reason: `Potential loss exceeds max loss per trade`,
      };
    }

    return { valid: true };
  }

  /**
   * Registrar circuit breaker failure
   */
  private static async recordCircuitBreakerFailure(serviceName: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const existing = await db
      .select()
      .from(circuitBreakerStatus)
      .where(eq(circuitBreakerStatus.serviceName, serviceName))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(circuitBreakerStatus).values({
        serviceName,
        state: 'closed',
        failureCount: 1,
        lastFailureAt: new Date(),
      });
    } else {
      const failureCount = (existing[0].failureCount || 0) + 1;
      const newState = failureCount >= this.config.circuitBreakerThreshold ? 'open' : 'closed';

      await db
        .update(circuitBreakerStatus)
        .set({
          failureCount,
          lastFailureAt: new Date(),
          state: newState,
          openedAt: newState === 'open' ? new Date() : existing[0].openedAt,
        })
        .where(eq(circuitBreakerStatus.serviceName, serviceName));
    }
  }

  /**
   * Registrar circuit breaker success
   */
  private static async recordCircuitBreakerSuccess(serviceName: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(circuitBreakerStatus)
      .set({
        failureCount: 0,
        lastSuccessAt: new Date(),
        state: 'closed',
        recoveryAttempts: 0,
      })
      .where(eq(circuitBreakerStatus.serviceName, serviceName));
  }

  /**
   * Verificar se circuit breaker está aberto
   */
  private static async isCircuitBreakerOpen(serviceName: string): Promise<boolean> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const status = await db
      .select()
      .from(circuitBreakerStatus)
      .where(eq(circuitBreakerStatus.serviceName, serviceName))
      .limit(1);

    if (status.length === 0) return false;

    const cb = status[0];

    // Se está aberto, verificar se pode tentar recovery
    if (cb.state === 'open' && cb.openedAt) {
      const timeSinceOpen = Date.now() - cb.openedAt.getTime();
      if (timeSinceOpen > this.config.circuitBreakerResetMs) {
        // Tentar half-open
        await db
          .update(circuitBreakerStatus)
          .set({
            state: 'half_open',
            recoveryAttempts: (cb.recoveryAttempts || 0) + 1,
          })
          .where(eq(circuitBreakerStatus.serviceName, serviceName));

        return false; // Permitir tentativa
      }
    }

    return cb.state === 'open';
  }

  /**
   * Limpar locks expirados
   */
  private static async cleanupExpiredLocks(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const now = new Date();
    await db.delete(tradeExecutionLocks).where(lt(tradeExecutionLocks.expiresAt, now));
  }

  /**
   * Inicializar circuit breakers
   */
  private static async initializeCircuitBreakers(): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const services = ['strategy_executor', 'trade_monitor'];

    for (const serviceName of services) {
      const existing = await db
        .select()
        .from(circuitBreakerStatus)
        .where(eq(circuitBreakerStatus.serviceName, serviceName))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(circuitBreakerStatus).values({
          serviceName,
          state: 'closed',
          failureCount: 0,
        });
      }
    }
  }
}
