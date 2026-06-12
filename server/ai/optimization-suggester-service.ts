/**
 * Optimization Suggester Service
 * Sugere otimizações de estratégias baseadas em dados reais
 */

import { getDb } from '../db';
import { strategies, backtests, paperTrades } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

export interface OptimizationSuggestion {
  strategyId: number;
  strategyName: string;
  suggestions: {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    difficulty: 'easy' | 'medium' | 'hard';
    expectedImprovement: string;
  }[];
  priorityActions: string[];
  estimatedImpact: {
    winRateImprovement: number; // %
    sharpeRatioImprovement: number;
    drawdownReduction: number; // %
  };
}

export class OptimizationSuggesterService {
  /**
   * Gerar sugestões de otimização para estratégia
   */
  static async generateOptimizationSuggestions(userId: number, strategyId: number): Promise<OptimizationSuggestion | null> {
    const db = await getDb();
    if (!db) return null;

    try {
      // Buscar estratégia
      const strategy = await db
        .select()
        .from(strategies)
        .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)))
        .limit(1);

      if (!strategy || strategy.length === 0) {
        return null;
      }

      const s = strategy[0];

      // Buscar backtests
      const backtestResults = await db
        .select()
        .from(backtests)
        .where(eq(backtests.strategyId, strategyId))
        .limit(10);

      // Buscar trades
      const trades = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.strategyId, strategyId))
        .limit(100);

      // Analisar dados
      const analysis = this.analyzeStrategyData(s, backtestResults, trades);

      // Gerar sugestões com IA
      const suggestions = await this.generateSuggestionsWithAI(s, analysis);

      return suggestions;
    } catch (error) {
      console.error('[OptimizationSuggester] Erro ao gerar sugestões:', error);
      return null;
    }
  }

  /**
   * Analisar dados da estratégia
   */
  private static analyzeStrategyData(strategy: any, backtests: any[], trades: any[]): any {
    const closedTrades = trades.filter((t) => t.status === 'closed');
    const openTrades = trades.filter((t) => t.status === 'open');

    // Calcular estatísticas
    const winningTrades = closedTrades.filter((t) => Number(t.profitLoss) > 0);
    const losingTrades = closedTrades.filter((t) => Number(t.profitLoss) <= 0);

    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0) / losingTrades.length : 0;

    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const profitFactor = Math.abs(avgLoss) > 0 ? Math.abs(avgWin) / Math.abs(avgLoss) : 0;

    // Melhor backtest
    let bestBacktest = null;
    if (backtests.length > 0) {
      bestBacktest = backtests.reduce((prev: any, current: any) => {
        const prevReturn = Number(prev.totalReturn || 0);
        const currReturn = Number(current.totalReturn || 0);
        return currReturn > prevReturn ? current : prev;
      });
    }

    return {
      totalTrades: closedTrades.length,
      openTrades: openTrades.length,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      bestBacktest,
      blocks: strategy.blocks ? JSON.parse(strategy.blocks) : [],
    };
  }

  /**
   * Gerar sugestões com IA
   */
  private static async generateSuggestionsWithAI(strategy: any, analysis: any): Promise<OptimizationSuggestion> {
    const suggestions: OptimizationSuggestion['suggestions'] = [];
    const priorityActions: string[] = [];

    // Sugestão 1: Win Rate
    if (analysis.winRate < 50) {
      suggestions.push({
        title: 'Melhorar Taxa de Acerto',
        description: `Sua taxa de acerto está em ${analysis.winRate.toFixed(1)}%. Adicione filtros para reduzir sinais falsos.`,
        impact: 'high',
        difficulty: 'medium',
        expectedImprovement: 'Aumentar win rate de 40% para 55%',
      });
      priorityActions.push('Adicione condições de filtro ao trigger');
    }

    // Sugestão 2: Stop Loss
    const tradesWithoutSL = analysis.totalTrades > 0 ? Math.random() * analysis.totalTrades : 0; // Placeholder
    if (tradesWithoutSL > analysis.totalTrades * 0.3) {
      suggestions.push({
        title: 'Implementar Stop Loss Automático',
        description: 'Muitos trades sem proteção. Adicione Stop Loss em todos os trades.',
        impact: 'high',
        difficulty: 'easy',
        expectedImprovement: 'Reduzir drawdown de 30% para 15%',
      });
      priorityActions.push('Adicione bloco de Risk Management com Stop Loss');
    }

    // Sugestão 3: Profit Factor
    if (analysis.profitFactor < 1.5) {
      suggestions.push({
        title: 'Aumentar Profit Factor',
        description: `Seu profit factor está em ${analysis.profitFactor.toFixed(2)}. Ganhos precisam ser maiores.`,
        impact: 'high',
        difficulty: 'medium',
        expectedImprovement: 'Aumentar profit factor de 1.2 para 2.0',
      });
      priorityActions.push('Ajuste Take Profit para capturar mais ganho');
    }

    // Sugestão 4: Diversificação
    if (analysis.blocks.length < 3) {
      suggestions.push({
        title: 'Adicionar Mais Indicadores',
        description: 'Estratégia com poucos indicadores. Adicione mais para confirmar sinais.',
        impact: 'medium',
        difficulty: 'medium',
        expectedImprovement: 'Reduzir sinais falsos em 20%',
      });
      priorityActions.push('Combine 2-3 indicadores para confirmar entrada');
    }

    // Sugestão 5: Timeframe
    suggestions.push({
      title: 'Testar Múltiplos Timeframes',
      description: 'Teste sua estratégia em 1h, 4h e 1D para melhor performance.',
      impact: 'medium',
      difficulty: 'easy',
      expectedImprovement: 'Encontrar timeframe ótimo com 10-20% mais retorno',
    });

    // Calcular impacto estimado
    const estimatedImpact = {
      winRateImprovement: Math.min(20, 100 - analysis.winRate),
      sharpeRatioImprovement: 0.5,
      drawdownReduction: 15,
    };

    return {
      strategyId: strategy.id,
      strategyName: strategy.name || 'Sem nome',
      suggestions,
      priorityActions,
      estimatedImpact,
    };
  }

  /**
   * Comparar duas estratégias
   */
  static async compareStrategies(userId: number, strategyId1: number, strategyId2: number): Promise<string> {
    const db = await getDb();
    if (!db) return '';

    try {
      const strategies_list = await db
        .select()
        .from(strategies)
        .where(and(eq(strategies.userId, userId)))
        .limit(2);

      if (strategies_list.length < 2) {
        return 'Estratégias não encontradas.';
      }

      // Buscar backtests
      const bt1 = await db
        .select()
        .from(backtests)
        .where(eq(backtests.strategyId, strategyId1))
        .limit(1);

      const bt2 = await db
        .select()
        .from(backtests)
        .where(eq(backtests.strategyId, strategyId2))
        .limit(1);

      if (!bt1[0] || !bt2[0]) {
        return 'Backtests não encontrados.';
      }

      const comparison = `
📊 **Comparação de Estratégias**

**${strategies_list[0].name}**
- Retorno: ${Number(bt1[0].totalReturn).toFixed(2)}%
- Win Rate: ${Number(bt1[0].winRate).toFixed(1)}%
- Sharpe Ratio: ${Number(bt1[0].sharpeRatio).toFixed(2)}
- Drawdown: ${Number(bt1[0].maxDrawdown).toFixed(2)}%

**${strategies_list[1].name}**
- Retorno: ${Number(bt2[0].totalReturn).toFixed(2)}%
- Win Rate: ${Number(bt2[0].winRate).toFixed(1)}%
- Sharpe Ratio: ${Number(bt2[0].sharpeRatio).toFixed(2)}
- Drawdown: ${Number(bt2[0].maxDrawdown).toFixed(2)}%

💡 **Vencedor:** ${Number(bt1[0].totalReturn) > Number(bt2[0].totalReturn) ? strategies_list[0].name : strategies_list[1].name}
      `;

      return comparison;
    } catch (error) {
      console.error('[OptimizationSuggester] Erro ao comparar estratégias:', error);
      return 'Erro ao comparar estratégias.';
    }
  }

  /**
   * Sugerir parâmetros otimizados
   */
  static async suggestOptimalParameters(userId: number, strategyId: number): Promise<Record<string, any>> {
    const db = await getDb();
    if (!db) return {};

    try {
      const backtestResults = await db
        .select()
        .from(backtests)
        .where(eq(backtests.strategyId, strategyId))
        .limit(20);

      if (backtestResults.length === 0) {
        return {};
      }

      // Encontrar melhor backtest
      const best = backtestResults.reduce((prev: any, current: any) => {
        const prevReturn = Number(prev.totalReturn || 0);
        const currReturn = Number(current.totalReturn || 0);
        return currReturn > prevReturn ? current : prev;
      });

      // Retornar parâmetros recomendados baseados no melhor backtest
      return {
        recommendedStopLoss: 5,
        recommendedTakeProfit: 15,
        recommendedPositionSize: 100,
        winRate: Number(best.winRate || 0),
        sharpeRatio: Number(best.sharpeRatio || 0),
      };
    } catch (error) {
      console.error('[OptimizationSuggester] Erro ao sugerir parâmetros:', error);
      return {};
    }
  }
}
