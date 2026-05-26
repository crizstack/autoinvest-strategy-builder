import { ContextualAIService, UserContext } from './contextual-service';

/**
 * Analysis Engine
 * Gera insights personalizados baseados em dados reais
 */

export interface AnalysisResult {
  risks: string[];
  suggestions: string[];
  contextSummary: string;
  insights: string[];
  recommendations: string[];
}

export class AnalysisEngine {
  /**
   * Análise completa do portfolio do usuário
   */
  static async analyzePortfolio(userId: number): Promise<AnalysisResult> {
    const context = await ContextualAIService.getUserContext(userId);

    const risks = ContextualAIService.detectRisks(context);
    const suggestions = ContextualAIService.generateSuggestions(context);
    const contextSummary = ContextualAIService.generateContextSummary(context);
    const insights = this.generateInsights(context);
    const recommendations = this.generateRecommendations(context);

    return {
      risks,
      suggestions,
      contextSummary,
      insights,
      recommendations,
    };
  }

  /**
   * Gerar insights baseados em padrões nos dados
   */
  private static generateInsights(context: UserContext): string[] {
    const insights: string[] = [];

    if (!context.portfolioStats) return insights;

    const stats = context.portfolioStats;

    // Insight 1: Performance Trend
    if (stats.totalTrades > 10) {
      const recentWinRate = context.recentTrades
        ? (context.recentTrades.filter((t) => Number(t.profitLoss) > 0).length / context.recentTrades.length) * 100
        : 0;

      if (recentWinRate > stats.winRate + 10) {
        insights.push('📈 Sua performance recente está melhorando! Continue com a estratégia atual.');
      } else if (recentWinRate < stats.winRate - 10) {
        insights.push('📉 Sua performance recente piorou. Revise sua estratégia.');
      }
    }

    // Insight 2: Risk/Reward Balance
    if (stats.sharpeRatio > 1.5) {
      insights.push('⚖️ Excelente relação risco/retorno. Sua estratégia está bem calibrada.');
    } else if (stats.sharpeRatio < 0.3) {
      insights.push('⚠️ Relação risco/retorno desfavorável. Aumente proteções.');
    }

    // Insight 3: Consistency
    if (stats.profitFactor > 2.0) {
      insights.push('✅ Sua estratégia é consistente. Ganhos superam perdas em 2x.');
    }

    // Insight 4: Diversification
    if (context.allocationBreakdown && context.allocationBreakdown.length > 3) {
      insights.push('🎯 Seu portfolio está bem diversificado.');
    }

    // Insight 5: Recovery
    if (stats.totalReturn > 0 && stats.maxDrawdown > 15) {
      const recoveryFactor = stats.totalReturn / (stats.maxDrawdown / 100);
      if (recoveryFactor > 2) {
        insights.push('💪 Excelente capacidade de recuperação após perdas.');
      }
    }

    return insights;
  }

  /**
   * Gerar recomendações acionáveis
   */
  private static generateRecommendations(context: UserContext): string[] {
    const recommendations: string[] = [];

    if (!context.portfolioStats) return recommendations;

    const stats = context.portfolioStats;

    // Recomendação 1: Aumentar/Diminuir tamanho de posição
    if (stats.winRate > 65 && stats.sharpeRatio > 1.0) {
      recommendations.push('Aumente o tamanho das posições em 10-20% (com cuidado).');
    } else if (stats.winRate < 45) {
      recommendations.push('Reduza o tamanho das posições até melhorar a taxa de acerto.');
    }

    // Recomendação 2: Stop Loss
    if (stats.maxDrawdown > 25) {
      recommendations.push('Implemente Stop Loss mais agressivo (ex: 5% abaixo da entrada).');
    }

    // Recomendação 3: Take Profit
    if (stats.totalTrades > 5 && stats.winRate > 55) {
      recommendations.push('Use Take Profit para proteger ganhos (ex: 10% acima da entrada).');
    }

    // Recomendação 4: Diversificação
    if (context.allocationBreakdown && context.allocationBreakdown.length < 2) {
      recommendations.push('Diversifique em mais ativos para reduzir risco concentrado.');
    }

    // Recomendação 5: Estratégia
    if (stats.totalTrades < 5) {
      recommendations.push('Execute mais backtests antes de operar com dinheiro real.');
    } else if (stats.profitFactor > 1.5) {
      recommendations.push('Considere adicionar mais estratégias com performance similar.');
    }

    // Recomendação 6: Indicadores
    if (stats.winRate < 50) {
      recommendations.push('Teste diferentes combinações de indicadores (RSI, MACD, Média Móvel).');
    }

    return recommendations;
  }

  /**
   * Análise de estratégia específica
   */
  static async analyzeStrategyPerformance(
    userId: number,
    strategyId: number
  ): Promise<{
    analysis: string;
    issues: string[];
    improvements: string[];
  }> {
    const analysis = await ContextualAIService.analyzeStrategy(userId, strategyId);

    // Detectar problemas comuns
    const issues: string[] = [];
    const improvements: string[] = [];

    // Aqui você pode adicionar lógica específica para detectar problemas
    // baseado no resultado da análise

    return {
      analysis,
      issues,
      improvements,
    };
  }

  /**
   * Análise de trade específico
   */
  static async analyzeTrade(
    userId: number,
    tradeId: number
  ): Promise<{
    analysis: string;
    lessons: string[];
  }> {
    const analysis = await ContextualAIService.analyzeTrade(userId, tradeId);

    const lessons: string[] = [];

    // Aqui você pode adicionar lógica para extrair lições do trade

    return {
      analysis,
      lessons,
    };
  }

  /**
   * Gerar recomendação de próxima ação
   */
  static getNextAction(context: UserContext): string {
    if (!context.portfolioStats) {
      return 'Comece criando sua primeira estratégia no Strategy Builder.';
    }

    const stats = context.portfolioStats;

    if (stats.totalTrades === 0) {
      return 'Teste suas estratégias com backtests antes de operar.';
    }

    if (stats.totalTrades < 10) {
      return 'Execute mais backtests para validar suas estratégias.';
    }

    if (stats.winRate < 50) {
      return 'Revise sua estratégia - taxa de acerto está abaixo de 50%.';
    }

    if (stats.maxDrawdown > 30) {
      return 'Implemente proteções mais agressivas (Stop Loss).';
    }

    if (stats.sharpeRatio > 1.0 && stats.profitFactor > 1.5) {
      return 'Sua estratégia está validada. Considere operar com dinheiro real (com cuidado).';
    }

    return 'Continue otimizando suas estratégias.';
  }
}
