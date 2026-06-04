import { getDb } from '../db';
import { strategies, backtests, paperTrades } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Serviço de Análise Profunda de Estratégias
 * Analisa lógica, performance e sugere otimizações
 */

export interface StrategyAnalysisResult {
  strategyId: number;
  strategyName: string;
  status: string;
  
  // Estrutura
  hasAsset: boolean;
  hasTrigger: boolean;
  hasConditions: boolean;
  hasActions: boolean;
  hasRiskManagement: boolean;
  blockCount: number;
  
  // Performance
  totalBacktests: number;
  bestBacktest?: {
    winRate: number;
    sharpeRatio: number;
    drawdown: number;
    returnPercent: number;
  };
  
  // Análise
  issues: string[];
  strengths: string[];
  improvements: string[];
  riskLevel: 'low' | 'medium' | 'high';
  readiness: number; // 0-100
}

export class StrategyAnalyzerService {
  /**
   * Analisar estratégia completa
   */
  static async analyzeStrategy(userId: number, strategyId: number): Promise<StrategyAnalysisResult> {
    // Buscar estratégia
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    const strategy = await db
      .select()
      .from(strategies)
      .where(and(eq(strategies.id, strategyId), eq(strategies.userId, userId)))
      .limit(1);

    if (!strategy || strategy.length === 0) {
      throw new Error('Estratégia não encontrada');
    }

    const strat = strategy[0];
    const blocks = strat.blocks ? JSON.parse(strat.blocks as any) : [];

    // Buscar backtests
    const backtestResults = await db
      .select()
      .from(backtests)
      .where(eq(backtests.strategyId, strategyId));

    // Buscar trades da estratégia
    const trades = await db
      .select()
      .from(paperTrades)
      .where(eq(paperTrades.strategyId, strategyId));

    // Análise de estrutura
    const analysis: StrategyAnalysisResult = {
      strategyId,
      strategyName: strat.name || 'Sem nome',
      status: strat.status || 'draft',
      
      hasAsset: !!strat.asset,
      hasTrigger: blocks.some((b: any) => b.type === 'trigger'),
      hasConditions: blocks.some((b: any) => b.type === 'condition'),
      hasActions: blocks.some((b: any) => b.type === 'action'),
      hasRiskManagement: blocks.some((b: any) => b.type === 'risk'),
      blockCount: blocks.length,
      
      totalBacktests: backtestResults.length,
      issues: [],
      strengths: [],
      improvements: [],
      riskLevel: 'medium',
      readiness: 0,
    };

    // Encontrar melhor backtest
    if (backtestResults.length > 0) {
      const best = backtestResults.reduce((prev: any, current: any) => {
        const prevReturn = Number(prev.totalReturn || 0);
        const currReturn = Number(current.totalReturn || 0);
        return currReturn > prevReturn ? current : prev;
      });

      analysis.bestBacktest = {
        winRate: Number(best.winRate || 0),
        sharpeRatio: Number(best.sharpeRatio || 0),
        drawdown: Number(best.maxDrawdown || 0),
        returnPercent: Number(best.totalReturn || 0),
      };
    }

    // Detectar problemas
    if (!analysis.hasAsset) {
      analysis.issues.push('❌ Nenhum ativo selecionado');
    }
    if (!analysis.hasTrigger) {
      analysis.issues.push('❌ Falta Trigger (gatilho de entrada)');
    }
    if (!analysis.hasActions) {
      analysis.issues.push('❌ Falta Ação (compra/venda)');
    }
    if (!analysis.hasRiskManagement) {
      analysis.issues.push('⚠️ Sem proteção de risco (Stop Loss/Take Profit)');
    }
    if (blocks.length === 0) {
      analysis.issues.push('❌ Estratégia vazia (sem blocos)');
    }

    // Detectar pontos fortes
    if (analysis.hasAsset && analysis.hasTrigger && analysis.hasActions) {
      analysis.strengths.push('✅ Estrutura básica completa');
    }
    if (analysis.hasRiskManagement) {
      analysis.strengths.push('✅ Proteção de risco implementada');
    }
    if (analysis.hasConditions) {
      analysis.strengths.push('✅ Condições refinadas para entrada');
    }
    if (analysis.totalBacktests > 0) {
      analysis.strengths.push(`✅ ${analysis.totalBacktests} backtest(s) executado(s)`);
    }

    // Sugestões de melhoria
    if (!analysis.hasRiskManagement) {
      analysis.improvements.push('💡 Adicione Stop Loss para limitar perdas');
      analysis.improvements.push('💡 Adicione Take Profit para proteger ganhos');
    }
    if (!analysis.hasConditions && analysis.hasTrigger) {
      analysis.improvements.push('💡 Refine o gatilho com condições adicionais');
    }
    if (analysis.bestBacktest && analysis.bestBacktest.drawdown > 30) {
      analysis.improvements.push('⚠️ Drawdown muito elevado - revise o risk management');
    }
    if (analysis.bestBacktest && analysis.bestBacktest.winRate < 40) {
      analysis.improvements.push('⚠️ Taxa de acerto baixa - considere ajustar indicadores');
    }

    // Calcular nível de risco
    if (analysis.issues.length > 2) {
      analysis.riskLevel = 'high';
    } else if (analysis.issues.length > 0) {
      analysis.riskLevel = 'medium';
    } else if (analysis.hasRiskManagement && analysis.bestBacktest && analysis.bestBacktest.drawdown < 20) {
      analysis.riskLevel = 'low';
    }

    // Calcular readiness (0-100)
    let readiness = 0;
    if (analysis.hasAsset) readiness += 15;
    if (analysis.hasTrigger) readiness += 20;
    if (analysis.hasActions) readiness += 20;
    if (analysis.hasConditions) readiness += 15;
    if (analysis.hasRiskManagement) readiness += 20;
    if (analysis.totalBacktests > 0) readiness += 10;
    
    analysis.readiness = Math.min(readiness, 100);

    return analysis;
  }

  /**
   * Comparar múltiplas estratégias
   */
  static async compareStrategies(userId: number, strategyIds: number[]): Promise<StrategyAnalysisResult[]> {
    const analyses: StrategyAnalysisResult[] = [];
    
    for (const strategyId of strategyIds) {
      try {
        const analysis = await this.analyzeStrategy(userId, strategyId);
        analyses.push(analysis);
      } catch (error) {
        console.error(`Erro ao analisar estratégia ${strategyId}:`, error);
      }
    }

    return analyses;
  }

  /**
   * Gerar recomendações de otimização
   */
  static async getOptimizationRecommendations(
    userId: number,
    strategyId: number
  ): Promise<string[]> {
    const analysis = await this.analyzeStrategy(userId, strategyId);
    const recommendations: string[] = [];

    // Baseado em performance
    if (analysis.bestBacktest) {
      const { winRate, sharpeRatio, drawdown, returnPercent } = analysis.bestBacktest;

      if (winRate < 45) {
        recommendations.push('🎯 Taxa de acerto baixa: considere adicionar mais filtros ao gatilho');
      }
      if (sharpeRatio < 0.8) {
        recommendations.push('📊 Retorno não compensa o risco: revise o tamanho das posições');
      }
      if (drawdown > 25) {
        recommendations.push('⚠️ Drawdown elevado: aumente o Stop Loss ou reduza o tamanho');
      }
      if (returnPercent > 30 && winRate > 55) {
        recommendations.push('✅ Performance excelente: considere aumentar o tamanho das posições');
      }
    }

    // Baseado em estrutura
    if (!analysis.hasConditions && analysis.hasTrigger) {
      recommendations.push('🔍 Adicione condições para refinar o gatilho (ex: RSI, MACD)');
    }
    if (analysis.blockCount < 3) {
      recommendations.push('🧩 Estratégia muito simples: considere adicionar mais lógica');
    }

    // Baseado em risco
    if (analysis.riskLevel === 'high') {
      recommendations.push('🛡️ Risco elevado: implemente Stop Loss e Take Profit imediatamente');
    }

    return recommendations;
  }
}
