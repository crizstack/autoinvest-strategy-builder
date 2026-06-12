/**
 * Risk Analyzer Service
 * Análise de risco contextual para trades e estratégias
 */

import { getDb } from '../db';
import { paperTrades, strategies, portfolios } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

export interface RiskAnalysis {
  tradeId?: number;
  strategyId?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  risks: string[];
  protections: string[];
  recommendations: string[];
  exposurePercent: number;
}

export class RiskAnalyzerService {
  /**
   * Analisar risco de um trade específico
   */
  static async analyzeTradeRisk(userId: number, tradeId: number): Promise<RiskAnalysis | null> {
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

      // Buscar portfolio para contexto
      const portfolio = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .limit(1);

      const portfolioBalance = portfolio[0] ? Number(portfolio[0].currentBalance || portfolio[0].initialBalance || 10000) : 10000;

      // Calcular exposição
      const tradeValue = Number(t.entryPrice) * t.quantity;
      const exposurePercent = (tradeValue / portfolioBalance) * 100;

      // Calcular risco potencial
      const stopLoss = t.stopLoss ? Number(t.stopLoss) : null;
      const potentialLoss = stopLoss ? ((Number(t.entryPrice) - stopLoss) / Number(t.entryPrice)) * 100 : null;

      // Gerar análise
      const analysis = this.generateRiskAnalysis(t, exposurePercent, potentialLoss);

      return analysis;
    } catch (error) {
      console.error('[RiskAnalyzer] Erro ao analisar risco:', error);
      return null;
    }
  }

  /**
   * Gerar análise de risco
   */
  private static generateRiskAnalysis(
    trade: any,
    exposurePercent: number,
    potentialLossPercent: number | null
  ): RiskAnalysis {
    const risks: string[] = [];
    const protections: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Avaliar exposição
    if (exposurePercent > 50) {
      risks.push(`Exposição muito alta: ${exposurePercent.toFixed(1)}% do portfolio`);
      riskScore += 30;
    } else if (exposurePercent > 20) {
      risks.push(`Exposição elevada: ${exposurePercent.toFixed(1)}% do portfolio`);
      riskScore += 15;
    }

    // Avaliar Stop Loss
    if (!trade.stopLoss) {
      risks.push('Sem Stop Loss - Risco de perda ilimitada');
      riskScore += 25;
      recommendations.push('Defina um Stop Loss para limitar perdas');
    } else {
      protections.push(`Stop Loss em R$ ${Number(trade.stopLoss).toFixed(2)}`);
      if (potentialLossPercent) {
        if (potentialLossPercent > 10) {
          risks.push(`Potencial de perda alto: ${potentialLossPercent.toFixed(1)}%`);
          riskScore += 15;
        } else {
          protections.push(`Perda máxima limitada a ${potentialLossPercent.toFixed(1)}%`);
        }
      }
    }

    // Avaliar Take Profit
    if (trade.takeProfit) {
      protections.push(`Take Profit em R$ ${Number(trade.takeProfit).toFixed(2)}`);
    } else {
      recommendations.push('Defina um Take Profit para proteger ganhos');
    }

    // Avaliar quantidade
    if (trade.quantity > 1000) {
      risks.push(`Quantidade muito grande: ${trade.quantity} unidades`);
      riskScore += 10;
    }

    // Determinar nível de risco
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 70) {
      riskLevel = 'critical';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
    } else if (riskScore >= 25) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return {
      tradeId: trade.id,
      riskLevel,
      riskScore,
      risks,
      protections,
      recommendations,
      exposurePercent,
    };
  }

  /**
   * Analisar risco de estratégia
   */
  static async analyzeStrategyRisk(userId: number, strategyId: number): Promise<RiskAnalysis | null> {
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

      // Buscar trades desta estratégia
      const trades = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.strategyId, strategyId), eq(paperTrades.userId, userId)))
        .limit(50);

      // Calcular exposição total
      const portfolio = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .limit(1);

      const portfolioBalance = portfolio[0] ? Number(portfolio[0].currentBalance || portfolio[0].initialBalance || 10000) : 10000;
      const totalExposure = trades.reduce((sum, t) => sum + Number(t.entryPrice) * t.quantity, 0);
      const exposurePercent = (totalExposure / portfolioBalance) * 100;

      // Calcular risco
      const risks: string[] = [];
      const protections: string[] = [];
      const recommendations: string[] = [];
      let riskScore = 0;

      // Verificar proteções
      const tradesWithoutSL = trades.filter((t) => !t.stopLoss).length;
      if (tradesWithoutSL > 0) {
        risks.push(`${tradesWithoutSL} trades sem Stop Loss`);
        riskScore += 20;
      }

      // Verificar concentração
      if (exposurePercent > 50) {
        risks.push(`Exposição total muito alta: ${exposurePercent.toFixed(1)}%`);
        riskScore += 30;
      }

      // Verificar performance
      if (trades.length > 5) {
        const closedTrades = trades.filter((t) => t.status === 'closed');
        const losingTrades = closedTrades.filter((t) => Number(t.profitLoss) <= 0);
        const lossRate = (losingTrades.length / closedTrades.length) * 100;

        if (lossRate > 70) {
          risks.push(`Taxa de perda alta: ${lossRate.toFixed(1)}%`);
          riskScore += 25;
        }
      }

      // Determinar nível
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 70) {
        riskLevel = 'critical';
      } else if (riskScore >= 50) {
        riskLevel = 'high';
      } else if (riskScore >= 25) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      return {
        strategyId,
        riskLevel,
        riskScore,
        risks,
        protections,
        recommendations,
        exposurePercent,
      };
    } catch (error) {
      console.error('[RiskAnalyzer] Erro ao analisar risco de estratégia:', error);
      return null;
    }
  }

  /**
   * Detectar estratégias perigosas
   */
  static async detectDangerousStrategies(userId: number): Promise<string[]> {
    const db = await getDb();
    if (!db) return [];

    try {
      const strategies_list = await db
        .select()
        .from(strategies)
        .where(eq(strategies.userId, userId))
        .limit(20);

      const warnings: string[] = [];

      for (const strategy of strategies_list) {
        // Buscar trades
        const trades = await db
          .select()
          .from(paperTrades)
          .where(eq(paperTrades.strategyId, strategy.id))
          .limit(50);

        if (trades.length === 0) continue;

        // Verificar padrões perigosos
        const closedTrades = trades.filter((t) => t.status === 'closed');
        if (closedTrades.length > 5) {
          const totalLoss = closedTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0);
          const lossRate = (closedTrades.filter((t) => Number(t.profitLoss) <= 0).length / closedTrades.length) * 100;

          // Alerta 1: Muitas perdas consecutivas
          if (lossRate > 80) {
            warnings.push(`⚠️ ${strategy.name}: Taxa de perda muito alta (${lossRate.toFixed(1)}%) - Revise a lógica`);
          }

          // Alerta 2: Perda total
          if (totalLoss < -1000) {
            warnings.push(`⚠️ ${strategy.name}: Perda acumulada de R$ ${Math.abs(totalLoss).toFixed(2)} - Desative imediatamente`);
          }
        }

        // Alerta 3: Sem proteção
        const tradesWithoutSL = trades.filter((t) => !t.stopLoss).length;
        if (tradesWithoutSL > trades.length * 0.5) {
          warnings.push(`⚠️ ${strategy.name}: Mais de 50% dos trades sem Stop Loss - Adicione proteção`);
        }
      }

      return warnings;
    } catch (error) {
      console.error('[RiskAnalyzer] Erro ao detectar estratégias perigosas:', error);
      return [];
    }
  }

  /**
   * Calcular Value at Risk (VaR)
   */
  static async calculateVaR(userId: number, confidence: number = 0.95): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    try {
      const trades = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'closed')))
        .limit(100);

      if (trades.length < 10) {
        return 0; // Dados insuficientes
      }

      // Calcular retornos
      const returns = trades.map((t) => {
        const entryPrice = Number(t.entryPrice);
        const exitPrice = Number(t.exitPrice || entryPrice);
        return ((exitPrice - entryPrice) / entryPrice) * 100;
      });

      // Ordenar retornos
      returns.sort((a, b) => a - b);

      // Calcular VaR
      const index = Math.floor(returns.length * (1 - confidence));
      return returns[index] || 0;
    } catch (error) {
      console.error('[RiskAnalyzer] Erro ao calcular VaR:', error);
      return 0;
    }
  }
}
