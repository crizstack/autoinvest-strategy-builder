/**
 * Trade Explainer Service
 * Explica trades específicos com contexto de estratégia e indicadores
 */

import { getDb } from '../db';
import { paperTrades, strategies, backtests } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

export interface TradeExplanation {
  trade: {
    id: number;
    asset: string;
    type: 'buy' | 'sell';
    quantity: number;
    entryPrice: number;
    exitPrice?: number;
    status: 'open' | 'closed';
    pnl?: number;
    pnlPercent?: number;
  };
  strategy?: {
    name: string;
    asset: string;
    blocks?: any[];
  };
  explanation: {
    why: string; // Por que o trade foi aberto?
    when: string; // Quando foi aberto?
    howMuchRisk: string; // Qual era o risco?
    whatHappened: string; // O que aconteceu?
    lessons: string[]; // Lições aprendidas
  };
}

export class TradeExplainerService {
  /**
   * Explicar um trade específico
   */
  static async explainTrade(userId: number, tradeId: number): Promise<TradeExplanation | null> {
    const db = await getDb();
    if (!db) return null;

    try {
      // Buscar trade
      const trade = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.id, tradeId), eq(paperTrades.userId, userId)))
        .limit(1);

      if (!trade || trade.length === 0) {
        return null;
      }

      const t = trade[0];

      // Buscar estratégia associada
      let strategy = null;
      if (t.strategyId) {
        const strategyResult = await db
          .select()
          .from(strategies)
          .where(eq(strategies.id, t.strategyId))
          .limit(1);
        strategy = strategyResult[0] || null;
      }

      // Gerar explicação com IA
      const explanation = await this.generateExplanation(t, strategy);

      return {
        trade: {
          id: t.id,
          asset: t.asset,
          type: t.type as 'buy' | 'sell',
          quantity: t.quantity,
          entryPrice: Number(t.entryPrice),
          exitPrice: t.exitPrice ? Number(t.exitPrice) : undefined,
          status: t.status as 'open' | 'closed',
          pnl: t.profitLoss ? Number(t.profitLoss) : undefined,
          pnlPercent: t.profitLossPercent ? Number(t.profitLossPercent) : undefined,
        },
        strategy: strategy
          ? {
              name: strategy.name || 'Sem nome',
              asset: strategy.asset || 'N/A',
              blocks: strategy.blocks ? JSON.parse(strategy.blocks as any) : [],
            }
          : undefined,
        explanation,
      };
    } catch (error) {
      console.error('[TradeExplainer] Erro ao explicar trade:', error);
      return null;
    }
  }

  /**
   * Gerar explicação com IA
   */
  private static async generateExplanation(
    trade: any,
    strategy: any
  ): Promise<TradeExplanation['explanation']> {
    const tradeInfo = `
Trade: ${trade.type.toUpperCase()} ${trade.quantity} ${trade.asset} @ R$ ${Number(trade.entryPrice).toFixed(2)}
Status: ${trade.status === 'open' ? 'Aberto' : 'Fechado'}
${trade.status === 'closed' ? `PnL: R$ ${Number(trade.profitLoss).toFixed(2)} (${Number(trade.profitLossPercent).toFixed(2)}%)` : ''}
Entrada: ${new Date(trade.entryTime).toLocaleString()}
${trade.exitTime ? `Saída: ${new Date(trade.exitTime).toLocaleString()}` : ''}
Stop Loss: ${trade.stopLoss ? `R$ ${Number(trade.stopLoss).toFixed(2)}` : 'Não definido'}
Take Profit: ${trade.takeProfit ? `R$ ${Number(trade.takeProfit).toFixed(2)}` : 'Não definido'}
    `;

    const strategyInfo = strategy
      ? `
Estratégia: ${strategy.name}
Ativo: ${strategy.asset}
Blocos: ${strategy.blocks ? JSON.parse(strategy.blocks).length : 0}
      `
      : 'Sem estratégia associada';

    const prompt = `
Você é um analista de trading experiente. Analise este trade e forneça uma explicação clara e educativa:

${tradeInfo}

${strategyInfo}

Forneça uma resposta em JSON com os seguintes campos:
{
  "why": "Por que este trade foi aberto? (1-2 linhas)",
  "when": "Quando foi aberto e por quanto tempo? (1-2 linhas)",
  "howMuchRisk": "Qual era o risco? (1-2 linhas)",
  "whatHappened": "O que aconteceu? Resultado? (1-2 linhas)",
  "lessons": ["Lição 1", "Lição 2", "Lição 3"]
}

IMPORTANTE:
- Respostas CURTAS e EDUCATIVAS
- Foque em aprendizado
- Explique o "porquê" não apenas o "o quê"
- Nunca dê recomendação financeira
    `;

    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content:
              'Você é um assistente de análise de trading educativo. Forneça respostas em JSON válido.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'trade_explanation',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                why: { type: 'string' },
                when: { type: 'string' },
                howMuchRisk: { type: 'string' },
                whatHappened: { type: 'string' },
                lessons: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['why', 'when', 'howMuchRisk', 'whatHappened', 'lessons'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content === 'string') {
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('[TradeExplainer] Erro ao chamar IA:', error);
    }

    // Fallback se IA falhar
    return {
      why: 'Trade aberto pela estratégia',
      when: `${new Date(trade.entryTime).toLocaleString()}`,
      howMuchRisk: `Stop Loss: ${trade.stopLoss ? `R$ ${Number(trade.stopLoss).toFixed(2)}` : 'Não definido'}`,
      whatHappened: trade.status === 'closed' ? `Fechado com PnL: R$ ${Number(trade.profitLoss).toFixed(2)}` : 'Ainda aberto',
      lessons: ['Revise a estratégia', 'Analise o padrão', 'Melhore o filtro de entrada'],
    };
  }

  /**
   * Explicar múltiplos trades
   */
  static async explainMultipleTrades(userId: number, tradeIds: number[]): Promise<TradeExplanation[]> {
    const explanations = await Promise.all(tradeIds.map((id) => this.explainTrade(userId, id)));
    return explanations.filter((e) => e !== null) as TradeExplanation[];
  }

  /**
   * Analisar padrão de trades
   */
  static async analyzeTradePattern(userId: number, limit: number = 10): Promise<string> {
    const db = await getDb();
    if (!db) return '';

    try {
      const trades = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'closed')))
        .limit(limit);

      if (trades.length === 0) {
        return 'Sem trades fechados para análise.';
      }

      // Calcular estatísticas
      const winningTrades = trades.filter((t) => Number(t.profitLoss) > 0);
      const losingTrades = trades.filter((t) => Number(t.profitLoss) <= 0);
      const avgWin = winningTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0) / (winningTrades.length || 1);
      const avgLoss = losingTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0) / (losingTrades.length || 1);
      const winRate = (winningTrades.length / trades.length) * 100;

      // Agrupar por ativo
      const byAsset: Record<string, number> = {};
      trades.forEach((t) => {
        byAsset[t.asset] = (byAsset[t.asset] || 0) + 1;
      });

      const topAsset = Object.entries(byAsset).sort(([, a], [, b]) => b - a)[0];

      const analysis = `
📊 **Padrão de Trades (últimos ${trades.length})**

• Taxa de Acerto: ${winRate.toFixed(1)}%
• Ganho Médio: R$ ${avgWin.toFixed(2)}
• Perda Média: R$ ${avgLoss.toFixed(2)}
• Ativo Mais Operado: ${topAsset[0]} (${topAsset[1]} trades)

💡 **Insights:**
${winRate > 60 ? '✅ Taxa de acerto acima de 60% - Estratégia bem calibrada' : winRate > 50 ? '✓ Taxa de acerto positiva' : '⚠️ Taxa de acerto abaixo de 50% - Revise a estratégia'}
${Math.abs(avgWin) > Math.abs(avgLoss) * 1.5 ? '✅ Ganhos superam perdas significativamente' : '⚠️ Relação ganho/perda desfavorável'}
      `;

      return analysis;
    } catch (error) {
      console.error('[TradeExplainer] Erro ao analisar padrão:', error);
      return 'Erro ao analisar padrão de trades.';
    }
  }

  /**
   * Detectar trades perigosos
   */
  static async detectDangerousTrades(userId: number): Promise<string[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const trades = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')))
        .limit(20);

      const warnings: string[] = [];

      for (const trade of trades) {
        const entryPrice = Number(trade.entryPrice);
        // Para trades abertos, usar preço de entrada como referência
        const loss = trade.status === 'open' ? 0 : ((Number(trade.exitPrice || entryPrice) - entryPrice) / entryPrice) * 100;

        // Alerta 1: Perda muito grande
        if (loss < -20) {
          warnings.push(`⚠️ ${trade.asset}: Perda de ${Math.abs(loss).toFixed(1)}% - Considere revisar`);
        }

        // Alerta 2: Sem proteção
        if (!trade.stopLoss) {
          warnings.push(`⚠️ ${trade.asset}: Sem Stop Loss - Adicione proteção`);
        }

        // Alerta 3: Posição muito grande
        if (trade.quantity > 1000) {
          warnings.push(`⚠️ ${trade.asset}: Posição muito grande (${trade.quantity} unidades) - Considere reduzir`);
        }
      }

      return warnings;
    } catch (error) {
      console.error('[TradeExplainer] Erro ao detectar trades perigosos:', error);
      return [];
    }
  }
}
