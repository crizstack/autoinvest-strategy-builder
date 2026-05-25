/**
 * Executor de Estratégia V2
 * Executa blocos respeitando o grafo topológico
 * Suporta múltiplas ações e operadores AND/OR corretos
 */

import { IndicatorCalculator } from './indicators';
import { StrategyParser } from './parser';
import type {
  ExecutableStrategy,
  BlockExecutionResult,
  StrategyExecutionResult,
  ExecutionGraph,
  StrategyBlock,
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

export class StrategyExecutorV2 {
  /**
   * Executa uma estratégia com dados de mercado
   * Respeita o grafo topológico e permite múltiplas ações
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

      // 2. Executar blocos em ordem topológica
      const blockValues = new Map<string, any>();
      const executionOrder = graph.executionOrder;

      for (const blockId of executionOrder) {
        const node = graph.nodes.get(blockId);
        if (!node) continue;

        // Verificar se todas as dependências foram executadas
        const allDependenciesExecuted = node.dependencies.every((depId) => blockValues.has(depId));

        if (!allDependenciesExecuted) {
          logs.push(`⚠️ Bloco ${blockId} tem dependências não executadas`);
          continue;
        }

        // Executar bloco
        const result = this.executeBlock(node.block, marketData, blockValues, logs);
        blockResults.push(result);

        if (result.success && result.value !== undefined) {
          blockValues.set(blockId, result.value);
        }
      }

      // 3. Determinar sinais (pode haver múltiplos)
      const signals: Array<{ type: 'buy' | 'sell' | 'close'; strength: number }> = [];

      // Encontrar todos os blocos de ação que devem ser executados
      const actionBlocks = strategy.blocks.filter((b) => b.type === 'action');

      for (const actionBlock of actionBlocks) {
        // Verificar se há caminho de trigger para esta ação
        const hasPath = this.hasPathFromTrigger(strategy, actionBlock.id);
        if (!hasPath) continue;

        // Verificar se todas as condições antes desta ação são verdadeiras
        const predecessors = this.getPredecessors(strategy, actionBlock.id);
        const allConditionsTrue = predecessors.every((predId) => {
          const value = blockValues.get(predId);
          return value === true;
        });

        if (allConditionsTrue) {
          const signal = this.getSignalFromAction(actionBlock);
          if (signal) {
            signals.push({ type: signal, strength: 100 });
          }
        }
      }

      // Usar o primeiro sinal se houver múltiplos
      let signal: 'buy' | 'sell' | 'close' | 'none' = 'none';
      let signalStrength = 0;

      if (signals.length > 0) {
        signal = signals[0].type;
        signalStrength = signals[0].strength;
      }

      // 4. Extrair níveis de risco
      const riskBlocks = strategy.blocks.filter((b) => b.type === 'risk');
      const riskLevels: any = {};

      riskBlocks.forEach((riskBlock) => {
        if (riskBlock.subType === 'stop_loss') {
          riskLevels.stopLoss = riskBlock.params.percentage;
        } else if (riskBlock.subType === 'take_profit') {
          riskLevels.takeProfit = riskBlock.params.percentage;
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
    block: StrategyBlock,
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
        result.value = this.executeOperator(block, blockValues, logs);
        result.success = true;
      } else if (block.type === 'action') {
        result.value = true; // Ações sempre retornam true se executadas
        result.success = true;
      } else if (block.type === 'risk') {
        result.value = true; // Riscos sempre retornam true se executados
        result.success = true;
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      result.success = false;
    }

    return result;
  }

  /**
   * Executa um trigger
   */
  private static executeTrigger(block: StrategyBlock, marketData: MarketData, logs: string[]): boolean {
    try {
      if (block.subType === 'price_above') {
        const value = block.params.value;
        const result = marketData.currentPrice > value;
        logs.push(`📈 Trigger ${block.label}: Preço ${marketData.currentPrice} > ${value} = ${result}`);
        return result;
      }

      if (block.subType === 'price_below') {
        const value = block.params.value;
        const result = marketData.currentPrice < value;
        logs.push(`📉 Trigger ${block.label}: Preço ${marketData.currentPrice} < ${value} = ${result}`);
        return result;
      }

      if (block.subType === 'ma_cross') {
        const fastPeriod = block.params.fastPeriod || 9;
        const slowPeriod = block.params.slowPeriod || 21;
        const direction = block.params.direction || 'up';

        if (marketData.prices.length < slowPeriod) {
          logs.push(`⚠️ Trigger ${block.label}: Dados insuficientes`);
          return false;
        }

        const fastMA = IndicatorCalculator.calculateSMA(marketData.prices, fastPeriod);
        const slowMA = IndicatorCalculator.calculateSMA(marketData.prices, slowPeriod);

        const result = direction === 'up' ? fastMA > slowMA : fastMA < slowMA;
        logs.push(`🔀 Trigger ${block.label}: MA${fastPeriod} ${fastMA.toFixed(2)} vs MA${slowPeriod} ${slowMA.toFixed(2)} = ${result}`);
        return result;
      }

      return false;
    } catch (error) {
      logs.push(`❌ Erro em trigger: ${error}`);
      return false;
    }
  }

  /**
   * Executa um indicador
   */
  private static executeIndicator(block: StrategyBlock, marketData: MarketData, logs: string[]): boolean {
    try {
      if (block.subType === 'rsi') {
        const period = block.params.period || 14;
        const condition = block.params.condition || 'below';
        const value = block.params.value || 30;

        if (marketData.prices.length < period) {
          logs.push(`⚠️ Indicador ${block.label}: Dados insuficientes`);
          return false;
        }

        const rsi = IndicatorCalculator.calculateRSI(marketData.prices, period);
        const result = condition === 'below' ? rsi < value : rsi > value;
        logs.push(`📊 RSI ${block.label}: ${rsi.toFixed(2)} ${condition} ${value} = ${result}`);
        return result;
      }

      if (block.subType === 'ma') {
        const period = block.params.period || 20;
        const type = block.params.type || 'sma';
        const condition = block.params.condition || 'above';
        const value = block.params.value;

        if (marketData.prices.length < period) {
          logs.push(`⚠️ Indicador ${block.label}: Dados insuficientes`);
          return false;
        }

        const ma = type === 'sma'
          ? IndicatorCalculator.calculateSMA(marketData.prices, period)
          : IndicatorCalculator.calculateEMA(marketData.prices, period);

        const result = condition === 'above' ? marketData.currentPrice > ma : marketData.currentPrice < ma;
        logs.push(`📈 MA ${block.label}: Preço ${marketData.currentPrice.toFixed(2)} ${condition} MA${period} ${ma.toFixed(2)} = ${result}`);
        return result;
      }

      if (block.subType === 'macd') {
        const fastPeriod = block.params.fastPeriod || 12;
        const slowPeriod = block.params.slowPeriod || 26;
        const signalPeriod = block.params.signalPeriod || 9;
        const condition = block.params.condition || 'above_signal';

        if (marketData.prices.length < slowPeriod) {
          logs.push(`⚠️ Indicador ${block.label}: Dados insuficientes`);
          return false;
        }

        const macd = IndicatorCalculator.calculateMACD(marketData.prices);
        const result = condition === 'above_signal' ? macd.macd > macd.signal : macd.macd < macd.signal;
        logs.push(`📉 MACD ${block.label}: ${macd.macd.toFixed(2)} ${condition} ${macd.signal.toFixed(2)} = ${result}`);
        return result;
      }

      if (block.subType === 'volume') {
        const condition = block.params.condition || 'above';
        const value = block.params.value || 1000000;
        const period = block.params.period || 20;

        if (marketData.volumes.length < period) {
          logs.push(`⚠️ Indicador ${block.label}: Dados insuficientes`);
          return false;
        }

        const avgVolume = marketData.volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
        const result = condition === 'above' ? marketData.currentVolume > avgVolume : marketData.currentVolume < avgVolume;
        logs.push(`📦 Volume ${block.label}: ${marketData.currentVolume.toFixed(0)} ${condition} ${avgVolume.toFixed(0)} = ${result}`);
        return result;
      }

      return false;
    } catch (error) {
      logs.push(`❌ Erro em indicador: ${error}`);
      return false;
    }
  }

  /**
   * Executa um operador (AND/OR)
   * Avalia apenas os predecessores diretos
   */
  private static executeOperator(block: StrategyBlock, blockValues: Map<string, any>, logs: string[]): boolean {
    try {
      if (block.subType === 'and') {
        // AND: todos os predecessores devem ser true
        const values = Array.from(blockValues.values());
        const result = values.every((v) => v === true);
        logs.push(`∧ AND ${block.label}: ${values.join(', ')} = ${result}`);
        return result;
      }

      if (block.subType === 'or') {
        // OR: pelo menos um predecessor deve ser true
        const values = Array.from(blockValues.values());
        const result = values.some((v) => v === true);
        logs.push(`∨ OR ${block.label}: ${values.join(', ')} = ${result}`);
        return result;
      }

      return false;
    } catch (error) {
      logs.push(`❌ Erro em operador: ${error}`);
      return false;
    }
  }

  /**
   * Verifica se há caminho de um trigger para um bloco
   */
  private static hasPathFromTrigger(strategy: ExecutableStrategy, targetId: string): boolean {
    const triggers = strategy.blocks.filter((b) => b.type === 'trigger').map((b) => b.id);
    const visited = new Set<string>();
    const queue = [...triggers];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetId) return true;

      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = strategy.connections
        ?.filter((c) => c.source === current)
        .map((c) => c.target) || [];

      queue.push(...neighbors);
    }

    return false;
  }

  /**
   * Encontra todos os predecessores de um bloco
   */
  private static getPredecessors(strategy: ExecutableStrategy, blockId: string): string[] {
    const predecessors: string[] = [];
    const visited = new Set<string>();
    const queue = [blockId];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current)) continue;
      visited.add(current);

      const preds = strategy.connections
        ?.filter((c) => c.target === current)
        .map((c) => c.source) || [];

      predecessors.push(...preds);
      queue.push(...preds);
    }

    return predecessors;
  }

  /**
   * Extrai o tipo de sinal de um bloco de ação
   */
  private static getSignalFromAction(block: StrategyBlock): 'buy' | 'sell' | 'close' | null {
    if (block.subType === 'buy') return 'buy';
    if (block.subType === 'sell') return 'sell';
    if (block.subType === 'close') return 'close';
    return null;
  }
}
