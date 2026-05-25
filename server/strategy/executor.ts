/**
 * Executor de Estratégia
 * Executa blocos de uma estratégia e gera sinais
 */

import { IndicatorCalculator } from './indicators';
import { StrategyParser } from './parser';
import type {
  ExecutableStrategy,
  BlockExecutionResult,
  StrategyExecutionResult,
  ExecutionGraph,
} from '../../shared/strategy-types';

export interface MarketData {
  asset: string;
  currentPrice: number;
  previousPrice?: number;
  prices: number[]; // Últimos N preços
  volumes: number[]; // Últimos N volumes
  currentVolume: number;
  timestamp: Date;
}

export class StrategyExecutor {
  /**
   * Executa uma estratégia com dados de mercado
   */
  static async execute(strategy: ExecutableStrategy, marketData: MarketData): Promise<StrategyExecutionResult> {
    const startTime = Date.now();
    const blockResults: BlockExecutionResult[] = [];
    const logs: string[] = [];

    try {
      // 1. Construir grafo
      const graph = StrategyParser.buildExecutionGraph(strategy);

      if (!graph.isValid) {
        return {
          strategyId: strategy.id,
          asset: strategy.asset,
          timestamp: new Date(),
          blockResults: [],
          signal: 'none',
          errors: graph.errors,
          executionTime: Date.now() - startTime,
        };
      }

      // 2. Executar blocos em ordem
      const executionOrder = StrategyParser.getExecutionOrder(graph);
      const blockValues = new Map<string, any>();
      let conditionMet = true; // Começa como true, AND lógico

      for (const node of executionOrder) {
        const result = this.executeBlock(node.block, marketData, blockValues, logs);
        blockResults.push(result);

        if (result.success && result.value !== undefined) {
          blockValues.set(node.blockId, result.value);

          // Se é um trigger ou indicador, avaliar condição
          if (node.block.type === 'trigger' || node.block.type === 'indicator') {
            conditionMet = conditionMet && (result.value === true);
          } else if (node.block.type === 'operator') {
            conditionMet = this.evaluateOperator(node.block, blockValues, logs);
          }
        }
      }

      // 3. Determinar sinal
      let signal: 'buy' | 'sell' | 'close' | 'none' = 'none';
      let signalStrength = 0;

      if (conditionMet) {
        const actionBlocks = StrategyParser.getActionBlocks(graph);
        if (actionBlocks.length > 0) {
          const actionBlock = actionBlocks[0];
          if (actionBlock.block.subType === 'buy') {
            signal = 'buy';
            signalStrength = 100;
          } else if (actionBlock.block.subType === 'sell') {
            signal = 'sell';
            signalStrength = 100;
          } else if (actionBlock.block.subType === 'close') {
            signal = 'close';
            signalStrength = 100;
          }
        }
      }

      // 4. Extrair níveis de risco
      const riskBlocks = StrategyParser.getRiskBlocks(graph);
      const riskLevels: any = {};

      riskBlocks.forEach((riskBlock) => {
        if (riskBlock.block.subType === 'stop_loss') {
          riskLevels.stopLoss = riskBlock.block.params.percentage;
        } else if (riskBlock.block.subType === 'take_profit') {
          riskLevels.takeProfit = riskBlock.block.params.percentage;
        }
      });

      return {
        strategyId: strategy.id,
        asset: strategy.asset,
        timestamp: new Date(),
        blockResults,
        signal,
        signalStrength,
        riskLevels: Object.keys(riskLevels).length > 0 ? riskLevels : undefined,
        errors: [],
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        strategyId: strategy.id,
        asset: strategy.asset,
        timestamp: new Date(),
        blockResults,
        signal: 'none',
        errors: [error instanceof Error ? error.message : String(error)],
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Executa um bloco individual
   */
  private static executeBlock(
    block: any,
    marketData: MarketData,
    blockValues: Map<string, any>,
    logs: string[]
  ): BlockExecutionResult {
    const result: BlockExecutionResult = {
      blockId: block.id,
      blockType: block.type,
      success: false,
      timestamp: new Date(),
      logs: [],
    };

    try {
      if (block.type === 'trigger') {
        result.value = this.executeTrigger(block, marketData, logs);
        result.success = true;
      } else if (block.type === 'indicator') {
        result.value = this.executeIndicator(block, marketData, logs);
        result.success = true;
      } else if (block.type === 'operator') {
        // Operadores são avaliados depois
        result.success = true;
      } else if (block.type === 'action') {
        result.value = block.params;
        result.success = true;
      } else if (block.type === 'risk') {
        result.value = block.params;
        result.success = true;
      }

      result.logs = logs;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.logs = logs;
    }

    return result;
  }

  /**
   * Executa bloco de trigger
   */
  private static executeTrigger(block: any, marketData: MarketData, logs: string[]): boolean {
    const { subType, params } = block;

    if (subType === 'price_above') {
      const result = IndicatorCalculator.evaluatePriceCondition(marketData.currentPrice, params.value, 'above');
      logs.push(`[TRIGGER] Preço ${marketData.currentPrice} > ${params.value}: ${result}`);
      return result;
    } else if (subType === 'price_below') {
      const result = IndicatorCalculator.evaluatePriceCondition(marketData.currentPrice, params.value, 'below');
      logs.push(`[TRIGGER] Preço ${marketData.currentPrice} < ${params.value}: ${result}`);
      return result;
    } else if (subType === 'ma_cross') {
      if (!marketData.previousPrice) {
        logs.push(`[TRIGGER] MA Cross: Sem preço anterior`);
        return false;
      }

      const fastMA = IndicatorCalculator.calculateSMA(marketData.prices, params.fastPeriod);
      const slowMA = IndicatorCalculator.calculateSMA(marketData.prices, params.slowPeriod);
      const previousFastMA = IndicatorCalculator.calculateSMA(
        marketData.prices.slice(0, -1),
        params.fastPeriod
      );
      const previousSlowMA = IndicatorCalculator.calculateSMA(
        marketData.prices.slice(0, -1),
        params.slowPeriod
      );

      const result = IndicatorCalculator.evaluateMAcross(
        fastMA,
        slowMA,
        previousFastMA,
        previousSlowMA,
        params.direction
      );
      logs.push(
        `[TRIGGER] MA Cross ${params.direction}: Fast=${fastMA}, Slow=${slowMA}, Result=${result}`
      );
      return result;
    }

    return false;
  }

  /**
   * Executa bloco de indicador
   */
  private static executeIndicator(block: any, marketData: MarketData, logs: string[]): boolean {
    const { subType, params } = block;

    if (subType === 'rsi') {
      const rsi = IndicatorCalculator.calculateRSI(marketData.prices, params.period);
      const result = IndicatorCalculator.evaluateIndicatorCondition(rsi, params.value, params.condition);
      logs.push(`[INDICATOR] RSI=${rsi} ${params.condition} ${params.value}: ${result}`);
      return result;
    } else if (subType === 'ma') {
      let ma: number;
      if (params.type === 'sma') {
        ma = IndicatorCalculator.calculateSMA(marketData.prices, params.period);
      } else {
        ma = IndicatorCalculator.calculateEMA(marketData.prices, params.period);
      }

      const result = IndicatorCalculator.evaluateIndicatorCondition(ma, params.value, params.condition);
      logs.push(`[INDICATOR] ${params.type.toUpperCase()}=${ma} ${params.condition} ${params.value}: ${result}`);
      return result;
    } else if (subType === 'macd') {
      const { macd, signal } = IndicatorCalculator.calculateMACD(
        marketData.prices,
        params.fastPeriod,
        params.slowPeriod,
        params.signalPeriod
      );

      const result = IndicatorCalculator.evaluateMACDCondition(macd, signal, 0, 0, params.condition);
      logs.push(`[INDICATOR] MACD=${macd} Signal=${signal} Condition=${params.condition}: ${result}`);
      return result;
    } else if (subType === 'volume') {
      const avgVolume = IndicatorCalculator.calculateAverageVolume(marketData.volumes, params.period);
      const result = IndicatorCalculator.evaluateVolumeCondition(
        marketData.currentVolume,
        avgVolume,
        params.condition
      );
      logs.push(
        `[INDICATOR] Volume=${marketData.currentVolume} ${params.condition} Avg=${avgVolume}: ${result}`
      );
      return result;
    }

    return false;
  }

  /**
   * Avalia operador AND/OR
   */
  private static evaluateOperator(block: any, blockValues: Map<string, any>, logs: string[]): boolean {
    const values = Array.from(blockValues.values()).filter((v) => typeof v === 'boolean');
    let result: boolean;

    if (block.subType === 'and') {
      result = values.length > 0 && values.every((v) => v === true);
    } else if (block.subType === 'or') {
      result = values.length > 0 && values.some((v) => v === true);
    } else {
      result = false;
    }

    logs.push(`[OPERATOR] ${block.subType.toUpperCase()}: ${result}`);
    return result;
  }
}
