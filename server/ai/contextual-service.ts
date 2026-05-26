import { getDb } from '../db';
import { strategies, paperTrades, portfolios, backtests } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { PortfolioService } from '../portfolio/portfolio-service';

/**
 * Serviço de IA Contextual
 * Busca dados reais do sistema para análise inteligente
 */

export interface UserContext {
  userId: number;
  portfolio?: any;
  portfolioStats?: any;
  recentTrades?: any[];
  activeStrategies?: any[];
  backtestResults?: any[];
  allocationBreakdown?: any[];
}

export class ContextualAIService {
  /**
   * Buscar contexto completo do usuário
   */
  static async getUserContext(userId: number): Promise<UserContext> {
    const db = await getDb();
    if (!db) {
      return { userId };
    }

    try {
      // Buscar portfolio
      const portfolio = await PortfolioService.getOrCreatePortfolio(userId);
      const portfolioStats = await PortfolioService.calculatePortfolioStats(userId);
      const allocationBreakdown = await PortfolioService.getAllocationBreakdown(userId);

      // Buscar trades recentes
      const recentTrades = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.userId, userId))
        .orderBy((t) => t.entryTime)
        .limit(10);

      // Buscar estratégias ativas
      const activeStrategies = await db
        .select()
        .from(strategies)
        .where(eq(strategies.userId, userId))
        .limit(5);

      // Buscar backtests recentes
      const backtestResults = await db
        .select()
        .from(backtests)
        .where(eq(backtests.userId, userId))
        .orderBy((b) => b.createdAt)
        .limit(5);

      return {
        userId,
        portfolio,
        portfolioStats,
        recentTrades: recentTrades || [],
        activeStrategies: activeStrategies || [],
        backtestResults: backtestResults || [],
        allocationBreakdown: allocationBreakdown || [],
      };
    } catch (error) {
      console.error('[ContextualAI] Error getting user context:', error);
      return { userId };
    }
  }

  /**
   * Gerar resumo contextual para a IA
   */
  static generateContextSummary(context: UserContext): string {
    let summary = '';

    // Portfolio
    if (context.portfolioStats) {
      summary += `\n[PORTFOLIO DO USUÁRIO]\n`;
      summary += `- Saldo: R$ ${context.portfolioStats.totalBalance.toFixed(2)}\n`;
      summary += `- Retorno Total: ${context.portfolioStats.totalReturnPercent.toFixed(2)}%\n`;
      summary += `- Taxa de Acerto: ${context.portfolioStats.winRate.toFixed(1)}%\n`;
      summary += `- Sharpe Ratio: ${context.portfolioStats.sharpeRatio.toFixed(2)}\n`;
      summary += `- Drawdown Máximo: ${context.portfolioStats.maxDrawdown.toFixed(2)}%\n`;
      summary += `- Posições Abertas: ${context.portfolioStats.openPositions}\n`;
    }

    // Trades recentes
    if (context.recentTrades && context.recentTrades.length > 0) {
      summary += `\n[TRADES RECENTES]\n`;
      const closedTrades = context.recentTrades.filter((t) => t.status === 'closed');
      const openTrades = context.recentTrades.filter((t) => t.status === 'open');

      if (closedTrades.length > 0) {
        const winningTrades = closedTrades.filter((t) => Number(t.profitLoss) > 0).length;
        const avgPnL = closedTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0) / closedTrades.length;
        summary += `- Trades Fechados: ${closedTrades.length}\n`;
        summary += `- Taxa de Acerto: ${((winningTrades / closedTrades.length) * 100).toFixed(1)}%\n`;
        summary += `- PnL Médio: R$ ${avgPnL.toFixed(2)}\n`;
      }

      if (openTrades.length > 0) {
        summary += `- Posições Abertas: ${openTrades.length}\n`;
      }
    }

    // Estratégias ativas
    if (context.activeStrategies && context.activeStrategies.length > 0) {
      summary += `\n[ESTRATÉGIAS ATIVAS]\n`;
      summary += `- Total: ${context.activeStrategies.length}\n`;
      const activeCount = context.activeStrategies.filter((s: any) => s.status === 'active').length;
      summary += `- Ativas: ${activeCount}\n`;
    }

    // Alocação por ativo
    if (context.allocationBreakdown && context.allocationBreakdown.length > 0) {
      summary += `\n[ALOCAÇÃO POR ATIVO]\n`;
      for (const allocation of context.allocationBreakdown.slice(0, 3)) {
        summary += `- ${allocation.symbol}: ${allocation.percentageOfPortfolio.toFixed(1)}% (PnL: ${allocation.profitLossPercent.toFixed(1)}%)\n`;
      }
    }

    return summary;
  }

  /**
   * Detectar problemas e riscos no portfolio
   */
  static detectRisks(context: UserContext): string[] {
    const risks: string[] = [];

    if (!context.portfolioStats) return risks;

    const stats = context.portfolioStats;

    // Drawdown elevado
    if (stats.maxDrawdown > 30) {
      risks.push(`⚠️ Seu drawdown está muito elevado (${stats.maxDrawdown.toFixed(1)}%). Considere aumentar proteções.`);
    } else if (stats.maxDrawdown > 20) {
      risks.push(`⚠️ Seu drawdown está elevado (${stats.maxDrawdown.toFixed(1)}%). Revise sua gestão de risco.`);
    }

    // Taxa de acerto baixa
    if (stats.winRate < 40) {
      risks.push(`⚠️ Sua taxa de acerto está baixa (${stats.winRate.toFixed(1)}%). Revise sua estratégia.`);
    }

    // Sharpe ratio baixo
    if (stats.sharpeRatio < 0.5 && stats.totalTrades > 5) {
      risks.push(`⚠️ Seu Sharpe Ratio está baixo (${stats.sharpeRatio.toFixed(2)}). Retorno não compensa o risco.`);
    }

    // Profit factor baixo
    if (stats.profitFactor < 1.2 && stats.totalTrades > 5) {
      risks.push(`⚠️ Seu Profit Factor está baixo (${stats.profitFactor.toFixed(2)}). Ganhos não superam perdas.`);
    }

    // Muitas posições abertas
    if (stats.openPositions > 5) {
      risks.push(`⚠️ Você tem ${stats.openPositions} posições abertas. Considere consolidar.`);
    }

    // Sem diversificação
    if (context.allocationBreakdown && context.allocationBreakdown.length > 0) {
      const topAllocation = context.allocationBreakdown[0]?.percentageOfPortfolio || 0;
      if (topAllocation > 60) {
        risks.push(`⚠️ Seu portfolio está muito concentrado (${topAllocation.toFixed(1)}% em um ativo). Diversifique.`);
      }
    }

    return risks;
  }

  /**
   * Gerar sugestões de melhoria baseadas em dados
   */
  static generateSuggestions(context: UserContext): string[] {
    const suggestions: string[] = [];

    if (!context.portfolioStats) return suggestions;

    const stats = context.portfolioStats;

    // Sugestões baseadas em performance
    if (stats.totalTrades < 5) {
      suggestions.push('💡 Você ainda não tem dados suficientes. Execute mais backtests para validar suas estratégias.');
    }

    if (stats.winRate > 60 && stats.sharpeRatio > 1.0) {
      suggestions.push('✅ Sua estratégia está performando bem. Considere aumentar o tamanho das posições.');
    }

    if (stats.totalReturnPercent > 20) {
      suggestions.push('🎯 Excelente retorno! Considere usar Take Profit para proteger ganhos.');
    }

    if (stats.totalReturnPercent < 0) {
      suggestions.push('📊 Seu portfolio está em prejuízo. Revise suas estratégias e considere usar Stop Loss.');
    }

    // Sugestões baseadas em alocação
    if (context.allocationBreakdown && context.allocationBreakdown.length === 0) {
      suggestions.push('🚀 Você ainda não tem posições abertas. Teste suas estratégias com paper trading.');
    }

    // Sugestões baseadas em estratégias
    if (context.activeStrategies && context.activeStrategies.length === 0) {
      suggestions.push('🎯 Crie sua primeira estratégia no Strategy Builder.');
    }

    return suggestions;
  }

  /**
   * Analisar estratégia específica
   */
  static async analyzeStrategy(userId: number, strategyId: number): Promise<string> {
    const db = await getDb();
    if (!db) return 'Banco de dados indisponível.';

    try {
      const strategy = await db
        .select()
        .from(strategies)
        .where(eq(strategies.id, strategyId))
        .limit(1);

      if (!strategy || strategy.length === 0) {
        return 'Estratégia não encontrada.';
      }

      const s = strategy[0];
      let analysis = `\n[ANÁLISE DE ESTRATÉGIA: ${s.name}]\n`;
      analysis += `- Ativo: ${s.asset}\n`;
      analysis += `- Status: ${s.status === 'active' ? 'Ativa' : 'Inativa'}\n`;

      // Buscar backtests desta estratégia
      const backtestResults = await db
        .select()
        .from(backtests)
        .where(eq(backtests.strategyId, strategyId))
        .limit(1);

      if (backtestResults && backtestResults.length > 0) {
        const bt = backtestResults[0];
        analysis += `\n[ÚLTIMO BACKTEST]\n`;
        analysis += `- Retorno: ${bt.totalReturnPercent?.toFixed(2)}%\n`;
        analysis += `- Win Rate: ${bt.winRate?.toFixed(1)}%\n`;
        analysis += `- Sharpe Ratio: ${bt.sharpeRatio?.toFixed(2)}\n`;
        analysis += `- Drawdown: ${bt.maxDrawdown?.toFixed(2)}%\n`;
      }

      return analysis;
    } catch (error) {
      console.error('[ContextualAI] Error analyzing strategy:', error);
      return 'Erro ao analisar estratégia.';
    }
  }

  /**
   * Analisar trade específico
   */
  static async analyzeTrade(userId: number, tradeId: number): Promise<string> {
    const db = await getDb();
    if (!db) return 'Banco de dados indisponível.';

    try {
      const trade = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.id, tradeId))
        .limit(1);

      if (!trade || trade.length === 0) {
        return 'Trade não encontrado.';
      }

      const t = trade[0];
      let analysis = `\n[ANÁLISE DE TRADE]\n`;
      analysis += `- Ativo: ${t.asset}\n`;
      analysis += `- Tipo: ${t.type === 'buy' ? 'Compra' : 'Venda'}\n`;
      analysis += `- Quantidade: ${t.quantity}\n`;
      analysis += `- Preço de Entrada: R$ ${Number(t.entryPrice).toFixed(2)}\n`;

      if (t.status === 'closed' && t.exitPrice) {
        analysis += `- Preço de Saída: R$ ${Number(t.exitPrice).toFixed(2)}\n`;
        analysis += `- PnL: R$ ${Number(t.profitLoss).toFixed(2)}\n`;
        analysis += `- PnL %: ${Number(t.profitLossPercent).toFixed(2)}%\n`;
      } else {
        analysis += `- Status: Aberto\n`;
      }

      return analysis;
    } catch (error) {
      console.error('[ContextualAI] Error analyzing trade:', error);
      return 'Erro ao analisar trade.';
    }
  }
}
