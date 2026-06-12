/**
 * Automatic Insights Service
 * Fornece insights automáticos sobre portfolio, trades e estratégias
 */

import { getDb } from '../db';
import { portfolios, paperTrades, strategies, backtests } from '../../drizzle/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

export interface AutomaticInsight {
  type: 'portfolio' | 'trade' | 'strategy' | 'market' | 'risk';
  title: string;
  description: string;
  actionable: boolean;
  recommendation: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  generatedAt: Date;
}

export class AutomaticInsightsService {
  /**
   * Gerar insights automáticos para usuário
   */
  static async generateInsights(userId: number): Promise<AutomaticInsight[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const insights: AutomaticInsight[] = [];

      // 1. Insights de Portfolio
      const portfolioInsights = await this.generatePortfolioInsights(userId, db);
      insights.push(...portfolioInsights);

      // 2. Insights de Trades
      const tradeInsights = await this.generateTradeInsights(userId, db);
      insights.push(...tradeInsights);

      // 3. Insights de Estratégias
      const strategyInsights = await this.generateStrategyInsights(userId, db);
      insights.push(...strategyInsights);

      // 4. Insights de Risco
      const riskInsights = await this.generateRiskInsights(userId, db);
      insights.push(...riskInsights);

      // Ordenar por urgência
      return insights.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });
    } catch (error) {
      console.error('[AutomaticInsights] Erro ao gerar insights:', error);
      return [];
    }
  }

  /**
   * Gerar insights de portfolio
   */
  private static async generatePortfolioInsights(userId: number, db: any): Promise<AutomaticInsight[]> {
    const insights: AutomaticInsight[] = [];

    try {
      const portfolio = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .limit(1);

      if (!portfolio || portfolio.length === 0) {
        return insights;
      }

      const p = portfolio[0];
      const balance = Number(p.balance || 0);
      const initialBalance = Number(p.initialBalance || 0);

      // Insight 1: Performance geral
      if (initialBalance > 0) {
        const performance = ((balance - initialBalance) / initialBalance) * 100;

        if (performance > 20) {
          insights.push({
            type: 'portfolio',
            title: 'Excelente Performance',
            description: `Seu portfolio cresceu ${performance.toFixed(2)}%. Mantenha a estratégia atual.`,
            actionable: false,
            recommendation: 'Continue com a estratégia atual',
            urgency: 'low',
            generatedAt: new Date(),
          });
        } else if (performance < -10) {
          insights.push({
            type: 'portfolio',
            title: 'Portfolio em Queda',
            description: `Seu portfolio caiu ${Math.abs(performance).toFixed(2)}%. Revise suas estratégias.`,
            actionable: true,
            recommendation: 'Analise as estratégias com pior performance',
            urgency: 'high',
            generatedAt: new Date(),
          });
        }
      }

      // Insight 2: Exposição
      if (balance < initialBalance * 0.5) {
        insights.push({
          type: 'portfolio',
          title: 'Exposição Reduzida',
          description: 'Seu capital disponível está baixo. Considere fechar algumas posições.',
          actionable: true,
          recommendation: 'Feche trades com menor potencial',
          urgency: 'medium',
          generatedAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error('[AutomaticInsights] Erro ao gerar insights de portfolio:', error);
      return insights;
    }
  }

  /**
   * Gerar insights de trades
   */
  private static async generateTradeInsights(userId: number, db: any): Promise<AutomaticInsight[]> {
    const insights: AutomaticInsight[] = [];

    try {
      // Buscar trades recentes
      const recentTrades = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.userId, userId))
        .orderBy(desc(paperTrades.entryTime))
        .limit(50);

      if (recentTrades.length === 0) {
        return insights;
      }

      const closedTrades = recentTrades.filter((t: any) => t.status === 'closed');
      const openTrades = recentTrades.filter((t: any) => t.status === 'open');

      // Insight 1: Streak de perdas
      let lossStreak = 0;
      for (const trade of closedTrades) {
        if (Number(trade.profitLoss || 0) < 0) {
          lossStreak++;
        } else {
          break;
        }
      }

      if (lossStreak >= 3) {
        insights.push({
          type: 'trade',
          title: 'Streak de Perdas Detectado',
          description: `Você teve ${lossStreak} trades perdedores consecutivos. Revise sua estratégia.`,
          actionable: true,
          recommendation: 'Pause as operações e analise os últimos trades',
          urgency: 'high',
          generatedAt: new Date(),
        });
      }

      // Insight 2: Trades abertos por muito tempo
      const now = new Date();
      const oldOpenTrades = openTrades.filter((t: any) => {
        const entryTime = new Date(t.entryTime);
        const daysOpen = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60 * 24);
        return daysOpen > 7;
      });

      if (oldOpenTrades.length > 0) {
        insights.push({
          type: 'trade',
          title: 'Trades Abertos por Muito Tempo',
          description: `Você tem ${oldOpenTrades.length} trades abertos há mais de 7 dias.`,
          actionable: true,
          recommendation: 'Considere fechar ou revisar estes trades',
          urgency: 'medium',
          generatedAt: new Date(),
        });
      }

      // Insight 3: Win rate baixa
      if (closedTrades.length >= 10) {
        const winningTrades = closedTrades.filter((t: any) => Number(t.profitLoss || 0) > 0);
        const winRate = (winningTrades.length / closedTrades.length) * 100;

        if (winRate < 40) {
          insights.push({
            type: 'trade',
            title: 'Taxa de Acerto Baixa',
            description: `Sua taxa de acerto é ${winRate.toFixed(1)}%. Adicione filtros para melhorar.`,
            actionable: true,
            recommendation: 'Implemente filtros adicionais no seu trigger',
            urgency: 'high',
            generatedAt: new Date(),
          });
        }
      }

      return insights;
    } catch (error) {
      console.error('[AutomaticInsights] Erro ao gerar insights de trades:', error);
      return insights;
    }
  }

  /**
   * Gerar insights de estratégias
   */
  private static async generateStrategyInsights(userId: number, db: any): Promise<AutomaticInsight[]> {
    const insights: AutomaticInsight[] = [];

    try {
      const userStrategies = await db
        .select()
        .from(strategies)
        .where(eq(strategies.userId, userId))
        .limit(10);

      if (userStrategies.length === 0) {
        insights.push({
          type: 'strategy',
          title: 'Nenhuma Estratégia Criada',
          description: 'Você ainda não criou nenhuma estratégia. Comece criando uma!',
          actionable: true,
          recommendation: 'Crie sua primeira estratégia no Strategy Builder',
          urgency: 'medium',
          generatedAt: new Date(),
        });
        return insights;
      }

      // Insight 1: Estratégias inativas
      const inactiveStrategies = userStrategies.filter((s: any) => s.status !== 'active');

      if (inactiveStrategies.length > 0) {
        insights.push({
          type: 'strategy',
          title: 'Estratégias Inativas',
          description: `Você tem ${inactiveStrategies.length} estratégias inativas. Ative-as para começar a operar.`,
          actionable: true,
          recommendation: 'Ative suas estratégias no painel de estratégias',
          urgency: 'low',
          generatedAt: new Date(),
        });
      }

      // Insight 2: Estratégias sem backtest
      const strategiesWithoutBacktest = userStrategies.filter((s: any) => !s.lastBacktestAt);

      if (strategiesWithoutBacktest.length > 0) {
        insights.push({
          type: 'strategy',
          title: 'Estratégias Sem Backtest',
          description: `${strategiesWithoutBacktest.length} estratégias não foram testadas. Execute backtests antes de operar.`,
          actionable: true,
          recommendation: 'Execute backtests para validar suas estratégias',
          urgency: 'high',
          generatedAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error('[AutomaticInsights] Erro ao gerar insights de estratégias:', error);
      return insights;
    }
  }

  /**
   * Gerar insights de risco
   */
  private static async generateRiskInsights(userId: number, db: any): Promise<AutomaticInsight[]> {
    const insights: AutomaticInsight[] = [];

    try {
      const portfolio = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .limit(1);

      if (!portfolio || portfolio.length === 0) {
        return insights;
      }

      const p = portfolio[0];
      const balance = Number(p.balance || 0);
      const initialBalance = Number(p.initialBalance || 0);

      // Insight 1: Drawdown crítico
      if (initialBalance > 0) {
        const drawdown = ((initialBalance - balance) / initialBalance) * 100;

        if (drawdown > 30) {
          insights.push({
            type: 'risk',
            title: 'Drawdown Crítico',
            description: `Seu drawdown é ${drawdown.toFixed(2)}%. Reduza o risco imediatamente.`,
            actionable: true,
            recommendation: 'Feche posições e reduza o tamanho dos trades',
            urgency: 'critical',
            generatedAt: new Date(),
          });
        } else if (drawdown > 15) {
          insights.push({
            type: 'risk',
            title: 'Drawdown Elevado',
            description: `Seu drawdown é ${drawdown.toFixed(2)}%. Monitore de perto.`,
            actionable: true,
            recommendation: 'Reduza o tamanho dos trades',
            urgency: 'high',
            generatedAt: new Date(),
          });
        }
      }

      // Insight 2: Concentração de risco
      const openTrades = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')))
        .limit(100);

      if (openTrades.length > 10) {
        insights.push({
          type: 'risk',
          title: 'Muitas Posições Abertas',
          description: `Você tem ${openTrades.length} posições abertas. Risco de concentração elevado.`,
          actionable: true,
          recommendation: 'Feche algumas posições para reduzir risco',
          urgency: 'medium',
          generatedAt: new Date(),
        });
      }

      return insights;
    } catch (error) {
      console.error('[AutomaticInsights] Erro ao gerar insights de risco:', error);
      return insights;
    }
  }

  /**
   * Gerar relatório diário de insights
   */
  static async generateDailyReport(userId: number): Promise<string> {
    const insights = await this.generateInsights(userId);

    if (insights.length === 0) {
      return '📊 **Relatório Diário**\n\nNenhum insight gerado para hoje.';
    }

    let report = '📊 **Relatório Diário de Insights**\n\n';

    // Agrupar por urgência
    const critical = insights.filter((i) => i.urgency === 'critical');
    const high = insights.filter((i) => i.urgency === 'high');
    const medium = insights.filter((i) => i.urgency === 'medium');
    const low = insights.filter((i) => i.urgency === 'low');

    if (critical.length > 0) {
      report += '🚨 **Crítico**\n';
      critical.forEach((i) => {
        report += `- ${i.title}: ${i.description}\n`;
      });
      report += '\n';
    }

    if (high.length > 0) {
      report += '⚠️ **Alto**\n';
      high.forEach((i) => {
        report += `- ${i.title}: ${i.description}\n`;
      });
      report += '\n';
    }

    if (medium.length > 0) {
      report += '📌 **Médio**\n';
      medium.slice(0, 3).forEach((i) => {
        report += `- ${i.title}: ${i.description}\n`;
      });
      report += '\n';
    }

    report += `\n📈 Total de insights: ${insights.length}`;

    return report;
  }

  /**
   * Explicar drawdown
   */
  static async explainDrawdown(userId: number): Promise<string> {
    const db = await getDb();
    if (!db) return '';

    try {
      const portfolio = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .limit(1);

      if (!portfolio || portfolio.length === 0) {
        return 'Portfolio não encontrado.';
      }

      const p = portfolio[0];
      const balance = Number(p.currentBalance || 0);
      const initialBalance = Number(p.initialBalance || 0);

      if (initialBalance === 0) {
        return 'Saldo inicial não definido.';
      }

      const drawdown = ((initialBalance - balance) / initialBalance) * 100;

      // Buscar trades perdedores
      const losingTrades = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'closed')))
        .orderBy(desc(paperTrades.exitTime))
        .limit(10);

      const totalLoss = losingTrades
        .filter((t: any) => Number(t.profitLoss || 0) < 0)
        .reduce((sum: number, t: any) => sum + Number(t.profitLoss || 0), 0);

      const explanation = `
📉 **Explicação de Drawdown**

**Drawdown Atual:** ${drawdown.toFixed(2)}%

**Saldo Inicial:** R$ ${initialBalance.toFixed(2)}
**Saldo Atual:** R$ ${balance.toFixed(2)}
**Perda Total:** R$ ${(initialBalance - balance).toFixed(2)}

**Trades Perdedores Recentes:** ${losingTrades.length}
**Perda em Trades:** R$ ${totalLoss.toFixed(2)}

**Análise:**
${drawdown > 30 ? '🔴 Drawdown crítico - Reduza risco imediatamente' : drawdown > 15 ? '🟠 Drawdown elevado - Monitore de perto' : '🟢 Drawdown controlado'}

**Recomendação:**
${drawdown > 30 ? 'Feche posições e revise sua estratégia' : drawdown > 15 ? 'Reduza o tamanho dos trades' : 'Continue monitorando'}
      `;

      return explanation;
    } catch (error) {
      console.error('[AutomaticInsights] Erro ao explicar drawdown:', error);
      return 'Erro ao gerar explicação de drawdown.';
    }
  }
}
