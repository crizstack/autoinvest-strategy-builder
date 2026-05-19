/**
 * Serviço de geração de explicações de trades
 * Cria explicações claras e educativas sobre cada operação
 */

import {
  TradeExplanation,
  IndicatorSignal,
  IndicatorType,
  TradeContext,
} from '../../shared/types/tradeLog';

export class TradeExplanationService {
  /**
   * Gera explicação de entrada baseada em indicadores
   */
  static generateEntryExplanation(
    indicators: IndicatorSignal[],
    context: TradeContext
  ): { reason: string; confidence: number } {
    if (indicators.length === 0) {
      return {
        reason: 'Entrada manual do usuário',
        confidence: 50,
      };
    }

    const explanations = indicators.map((ind) => this.getIndicatorExplanation(ind, 'entry'));
    const reason =
      indicators.length === 1
        ? explanations[0]
        : `Múltiplos sinais: ${explanations.join(', ')}`;

    // Calcular confiança baseada em força dos sinais
    const avgStrength = this.calculateSignalStrength(indicators);
    const confidence = Math.round(avgStrength * 100);

    return { reason, confidence };
  }

  /**
   * Gera explicação de saída baseada em indicadores
   */
  static generateExitExplanation(
    indicators: IndicatorSignal[],
    exitType: 'profit_target' | 'stop_loss' | 'signal' | 'manual' | 'timeout'
  ): { reason: string; type: string } {
    const typeExplanations: Record<string, string> = {
      profit_target: 'Meta de lucro atingida',
      stop_loss: 'Stop loss acionado para proteção',
      signal: 'Sinal de saída gerado pelos indicadores',
      manual: 'Saída manual do usuário',
      timeout: 'Posição fechada por timeout',
    };

    let reason = typeExplanations[exitType];

    if (exitType === 'signal' && indicators.length > 0) {
      const explanations = indicators.map((ind) => this.getIndicatorExplanation(ind, 'exit'));
      reason += `: ${explanations.join(', ')}`;
    }

    return { reason, type: exitType };
  }

  /**
   * Gera explicação específica de um indicador
   */
  private static getIndicatorExplanation(indicator: IndicatorSignal, action: 'entry' | 'exit'): string {
    const actionText = action === 'entry' ? 'Compra' : 'Venda';
    const strengthText = {
      weak: 'fraco',
      medium: 'moderado',
      strong: 'forte',
    }[indicator.strength];

    const explanations: Record<IndicatorType, (cond: string, strength: string) => string> = {
      RSI: (cond, strength) =>
        `${actionText} porque RSI ${cond} (sinal ${strength})`,
      MACD: (cond, strength) =>
        `${actionText} porque MACD ${cond} (sinal ${strength})`,
      'Bollinger Bands': (cond, strength) =>
        `${actionText} porque preço tocou banda de Bollinger ${cond} (sinal ${strength})`,
      'Moving Average': (cond, strength) =>
        `${actionText} porque preço cruzou média móvel ${cond} (sinal ${strength})`,
      Stochastic: (cond, strength) =>
        `${actionText} porque Stochastic ${cond} (sinal ${strength})`,
      ADX: (cond, strength) =>
        `${actionText} porque ADX ${cond} indicando tendência ${strength}`,
      CCI: (cond, strength) =>
        `${actionText} porque CCI ${cond} (sinal ${strength})`,
      ATR: (cond, strength) =>
        `${actionText} porque ATR ${cond} (volatilidade ${strength})`,
      Volume: (cond, strength) =>
        `${actionText} porque volume ${cond} (confirmação ${strength})`,
      'Price Action': (cond, strength) =>
        `${actionText} porque padrão de preço ${cond} (sinal ${strength})`,
      'Support/Resistance': (cond, strength) =>
        `${actionText} porque preço atingiu nível de ${cond} (sinal ${strength})`,
      Fibonacci: (cond, strength) =>
        `${actionText} porque preço atingiu nível Fibonacci ${cond} (sinal ${strength})`,
      Multiple: (cond, strength) =>
        `${actionText} porque múltiplos indicadores confirmam ${cond} (sinal ${strength})`,
    };

    const generator = explanations[indicator.name];
    return generator ? generator(indicator.condition, strengthText) : `${actionText} via ${indicator.name}`;
  }

  /**
   * Calcula força média dos sinais
   */
  private static calculateSignalStrength(indicators: IndicatorSignal[]): number {
    const strengthValues = { weak: 0.33, medium: 0.66, strong: 1.0 };
    const total = indicators.reduce((sum, ind) => sum + strengthValues[ind.strength], 0);
    return total / indicators.length;
  }

  /**
   * Gera contexto de mercado em texto
   */
  static generateMarketContext(context: TradeContext): string {
    const parts: string[] = [];

    // Tendência
    const trendText = {
      uptrend: 'mercado em alta',
      downtrend: 'mercado em baixa',
      sideways: 'mercado lateral',
    }[context.trend];
    parts.push(trendText);

    // Condição
    const conditionText = {
      trending: 'com tendência clara',
      ranging: 'em consolidação',
      volatile: 'com alta volatilidade',
    }[context.marketCondition];
    parts.push(conditionText);

    // Spread
    if (context.spread > 0.02) {
      parts.push('spread elevado');
    }

    // Volatilidade
    if (context.volatility > 0.02) {
      parts.push('volatilidade acima da média');
    }

    return `${parts.join(', ')}.`;
  }

  /**
   * Gera explicação completa de um trade
   */
  static generateFullExplanation(
    entryIndicators: IndicatorSignal[],
    exitIndicators: IndicatorSignal[],
    exitType: 'profit_target' | 'stop_loss' | 'signal' | 'manual' | 'timeout',
    context: TradeContext,
    riskReward: number,
    notes?: string
  ): TradeExplanation {
    const { reason: entryReason, confidence: entryConfidence } = this.generateEntryExplanation(
      entryIndicators,
      context
    );

    const { reason: exitReason } = this.generateExitExplanation(exitIndicators, exitType);

    const marketContext = this.generateMarketContext(context);

    return {
      entryReason,
      entryIndicators,
      entryConfidence,
      exitReason,
      exitIndicators,
      exitType,
      marketContext,
      riskReward: Math.round(riskReward * 100) / 100,
      notes: notes || '',
    };
  }

  /**
   * Gera sugestão de melhoria baseada no trade
   */
  static generateImprovement(
    explanation: TradeExplanation,
    result: number
  ): string | null {
    // Se foi lucro, não sugerir melhoria
    if (result > 0) return null;

    // Se foi stop loss, sugerir ajuste
    if (explanation.exitType === 'stop_loss') {
      return `Considere ajustar o stop loss para melhor razão risco/recompensa (atual: ${explanation.riskReward}:1)`;
    }

    // Se foi saída por sinal fraco, sugerir esperar confirmação
    if (explanation.entryConfidence < 50) {
      return 'Considere aguardar confirmação mais forte dos indicadores antes de entrar';
    }

    // Se foi saída manual, sugerir usar sinais automáticos
    if (explanation.exitType === 'manual') {
      return 'Considere usar sinais automáticos de saída para melhor consistência';
    }

    return null;
  }

  /**
   * Formata explicação para exibição
   */
  static formatExplanation(explanation: TradeExplanation): string {
    const lines: string[] = [];

    lines.push(`📊 **Entrada**: ${explanation.entryReason}`);
    lines.push(`   Confiança: ${explanation.entryConfidence}%`);

    if (explanation.entryIndicators.length > 0) {
      lines.push(`   Indicadores: ${explanation.entryIndicators.map((i) => i.name).join(', ')}`);
    }

    lines.push('');
    lines.push(`📊 **Saída**: ${explanation.exitReason}`);
    lines.push(`   Tipo: ${explanation.exitType}`);

    if (explanation.exitIndicators.length > 0) {
      lines.push(`   Indicadores: ${explanation.exitIndicators.map((i) => i.name).join(', ')}`);
    }

    lines.push('');
    lines.push(`📈 **Contexto**: ${explanation.marketContext}`);
    lines.push(`   Risco/Recompensa: ${explanation.riskReward}:1`);

    if (explanation.notes) {
      lines.push('');
      lines.push(`📝 **Notas**: ${explanation.notes}`);
    }

    return lines.join('\n');
  }
}
