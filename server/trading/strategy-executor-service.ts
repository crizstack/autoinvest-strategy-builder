/**
 * Strategy Executor Service
 * Executa estratégias ativas periodicamente e gera trades automaticamente
 * Monitora sinais de entrada e abre posições quando condições são atendidas
 */

import { getDb } from '../db';
import { strategies, paperTrades, portfolios } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { StrategyExecutorV2 } from '../strategy/executor-v2';
import { getLatestCandle, getCandles } from '../market/candles-service';
import { PaperTradingEngine } from './paper-trading-engine';
import { TradeLoggerService } from './trade-logger-service';
import { TradeMonitorService } from './trade-monitor-service';
import type { ExecutableStrategy } from '../../shared/strategy-types';

export interface StrategyExecutionContext {
  strategyId: number;
  userId: number;
  asset: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  blocks: any[];
  connections: any[];
}

export class StrategyExecutorService {
  /**
   * Executar todas as estratégias ativas
   * Chamado periodicamente (a cada minuto)
   */
  static async executeActiveStrategies(): Promise<{
    executed: number;
    tradesOpened: number;
    errors: string[];
  }> {
    const db = await getDb();
    if (!db) {
      return { executed: 0, tradesOpened: 0, errors: ['Database not available'] };
    }

    const result = { executed: 0, tradesOpened: 0, errors: [] as string[] };

    try {
      // 1. Buscar estratégias ativas com paper trading ativado
      const activeStrategies = await db
        .select()
        .from(strategies)
        .where(
          and(
            eq(strategies.status, 'active'),
            eq(strategies.paperTradingActive, true)
          )
        );

      console.log(`[StrategyExecutor] Encontradas ${activeStrategies.length} estratégias ativas`);

      // 2. Executar cada estratégia
      for (const strategy of activeStrategies) {
        try {
          const tradesOpened = await this.executeStrategy(strategy);
          result.executed++;
          result.tradesOpened += tradesOpened;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Strategy ${strategy.id}: ${errorMsg}`);
          console.error(`[StrategyExecutor] Erro ao executar estratégia ${strategy.id}:`, error);
        }
      }

      console.log(
        `[StrategyExecutor] Execução completa: ${result.executed} estratégias, ${result.tradesOpened} trades abertos`
      );

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Fatal error: ${errorMsg}`);
      console.error('[StrategyExecutor] Erro fatal:', error);
      return result;
    }
  }

  /**
   * Executar uma estratégia específica
   */
  private static async executeStrategy(strategy: any): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    let tradesOpened = 0;

    try {
      // 1. Reconstruir ExecutableStrategy
      const blocks = strategy.blocks ? JSON.parse(strategy.blocks as any) : [];
      const connections = strategy.connections ? JSON.parse(strategy.connections as any) : [];

      const executableStrategy: ExecutableStrategy = {
        id: strategy.id.toString(),
        name: strategy.name,
        description: strategy.description || undefined,
        asset: strategy.asset,
        blocks,
        connections,
        userId: strategy.userId,
        status: strategy.status,
        createdAt: strategy.createdAt,
        updatedAt: strategy.updatedAt,
      };

      // 2. Buscar dados de mercado mais recentes
      const latestCandle = await getLatestCandle(strategy.asset);
      if (!latestCandle) {
        console.warn(`[StrategyExecutor] Sem dados de mercado para ${strategy.asset}`);
        return 0;
      }

      // 3. Buscar últimos candles para indicadores
      const candles = await getCandles(strategy.asset, new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), new Date());
      if (candles.length === 0) {
        console.warn(`[StrategyExecutor] Sem histórico de candles para ${strategy.asset}`);
        return 0;
      }

      // 4. Executar estratégia
      const marketData = {
        asset: strategy.asset,
        currentPrice: latestCandle.close,
        previousPrice: candles.length > 1 ? candles[candles.length - 2].close : latestCandle.close,
        prices: candles.map((c: any) => c.close),
        volumes: candles.map((c: any) => c.volume),
        currentVolume: latestCandle.volume,
        timestamp: new Date(),
      };

      const executionResult = await StrategyExecutorV2.execute(executableStrategy, marketData);

      // 5. Se houver sinal de compra/venda, abrir posição
      if (executionResult.signal && (executionResult.signal === 'buy' || executionResult.signal === 'sell')) {
        // Verificar se já existe posição aberta para esta estratégia
        const existingPosition = await db
          .select()
          .from(paperTrades)
          .where(
            and(
              eq(paperTrades.strategyId, strategy.id),
              eq(paperTrades.status, 'open')
            )
          )
          .limit(1)
          .then((rows: any[]) => rows[0] || null);

        // Só abrir nova posição se não houver posição aberta
        if (!existingPosition) {
          // Determinar quantidade baseada no portfolio
          const portfolio = await db
            .select()
            .from(portfolios)
            .where(eq(portfolios.userId, strategy.userId))
            .limit(1)
            .then((rows: any[]) => rows[0] || null);

          if (portfolio) {
            const availableBalance = Number(portfolio.currentBalance || portfolio.initialBalance || 10000);
            const riskPerTrade = availableBalance * 0.02; // 2% do portfolio por trade
            const quantity = Math.floor(riskPerTrade / latestCandle.close);

            if (quantity > 0) {
              // Calcular stop loss e take profit
              const stopLossPercent = 0.02; // 2% de stop loss
              const takeProfitPercent = 0.05; // 5% de take profit

              const stopLoss =
                executionResult.signal === 'buy'
                  ? latestCandle.close * (1 - stopLossPercent)
                  : latestCandle.close * (1 + stopLossPercent);

              const takeProfit =
                executionResult.signal === 'buy'
                  ? latestCandle.close * (1 + takeProfitPercent)
                  : latestCandle.close * (1 - takeProfitPercent);

              // Abrir posição
              await PaperTradingEngine.openPosition({
                strategyId: strategy.id,
                userId: strategy.userId,
                asset: strategy.asset,
                type: executionResult.signal === 'buy' ? 'buy' : 'sell',
                quantity,
                entryPrice: latestCandle.close,
                stopLoss,
                takeProfit,
                entryReason: `Sinal automático: ${executionResult.signal.toUpperCase()}`,
              });

              tradesOpened++;

              console.log(
                `[StrategyExecutor] ✅ Posição aberta: ${strategy.asset} ${executionResult.signal.toUpperCase()} x${quantity} @ R$${latestCandle.close}`
              );
            }
          }
        }
      }

      return tradesOpened;
    } catch (error) {
      console.error(`[StrategyExecutor] Erro ao executar estratégia ${strategy.id}:`, error);
      throw error;
    }
  }

  /**
   * Monitorar posições abertas e verificar stop loss/take profit
   * Chamado periodicamente (a cada minuto)
   */
  static async monitorOpenPositions(): Promise<{
    monitored: number;
    closed: number;
    errors: string[];
  }> {
    const monitorResult = await TradeMonitorService.monitorAllOpenPositions();
    return {
      monitored: monitorResult.monitored,
      closed: monitorResult.closed,
      errors: monitorResult.errors,
    };
  }

}
