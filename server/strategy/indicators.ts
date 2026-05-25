/**
 * Calculadores de Indicadores Técnicos
 * Implementa cálculos de RSI, MACD, Média Móvel, Volume
 */

export class IndicatorCalculator {
  /**
   * Calcula RSI (Relative Strength Index)
   * @param prices Array de preços de fechamento
   * @param period Período (padrão 14)
   * @returns Valor do RSI (0-100)
   */
  static calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) {
      throw new Error(`RSI requer pelo menos ${period + 1} preços`);
    }

    // Calcular mudanças
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    // Separar ganhos e perdas
    const gains = changes.map((c) => (c > 0 ? c : 0));
    const losses = changes.map((c) => (c < 0 ? -c : 0));

    // Calcular médias
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    // Calcular RSI usando suavização
    for (let i = period; i < changes.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }

    if (avgLoss === 0) {
      return avgGain === 0 ? 50 : 100;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return Math.round(rsi * 100) / 100;
  }

  /**
   * Calcula Média Móvel Simples (SMA)
   * @param prices Array de preços
   * @param period Período
   * @returns Valor da SMA
   */
  static calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) {
      throw new Error(`SMA requer pelo menos ${period} preços`);
    }

    const recentPrices = prices.slice(-period);
    const sum = recentPrices.reduce((a, b) => a + b, 0);
    const sma = sum / period;

    return Math.round(sma * 10000) / 10000;
  }

  /**
   * Calcula Média Móvel Exponencial (EMA)
   * @param prices Array de preços
   * @param period Período
   * @returns Valor da EMA
   */
  static calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) {
      throw new Error(`EMA requer pelo menos ${period} preços`);
    }

    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier);
    }

    return Math.round(ema * 10000) / 10000;
  }

  /**
   * Calcula MACD (Moving Average Convergence Divergence)
   * @param prices Array de preços
   * @param fastPeriod Período rápido (padrão 12)
   * @param slowPeriod Período lento (padrão 26)
   * @param signalPeriod Período de sinal (padrão 9)
   * @returns { macd, signal, histogram }
   */
  static calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): { macd: number; signal: number; histogram: number } {
    if (prices.length < slowPeriod + signalPeriod) {
      throw new Error(`MACD requer pelo menos ${slowPeriod + signalPeriod} preços`);
    }

    // Calcular EMAs
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);

    // MACD = Fast EMA - Slow EMA
    const macd = fastEMA - slowEMA;

    // Calcular Signal (EMA do MACD)
    const macdValues: number[] = [];
    for (let i = slowPeriod - 1; i < prices.length; i++) {
      const fast = this.calculateEMA(prices.slice(0, i + 1), fastPeriod);
      const slow = this.calculateEMA(prices.slice(0, i + 1), slowPeriod);
      macdValues.push(fast - slow);
    }

    const signal = this.calculateEMA(macdValues, signalPeriod);
    const histogram = macd - signal;

    return {
      macd: Math.round(macd * 10000) / 10000,
      signal: Math.round(signal * 10000) / 10000,
      histogram: Math.round(histogram * 10000) / 10000,
    };
  }

  /**
   * Calcula Volume Médio
   * @param volumes Array de volumes
   * @param period Período
   * @returns Volume médio
   */
  static calculateAverageVolume(volumes: number[], period: number): number {
    if (volumes.length < period) {
      throw new Error(`Average Volume requer pelo menos ${period} volumes`);
    }

    const recentVolumes = volumes.slice(-period);
    const sum = recentVolumes.reduce((a, b) => a + b, 0);
    const avgVolume = sum / period;

    return Math.round(avgVolume);
  }

  /**
   * Avalia condição de preço
   * @param currentPrice Preço atual
   * @param targetPrice Preço alvo
   * @param condition 'above' ou 'below'
   * @returns true se condição é atendida
   */
  static evaluatePriceCondition(currentPrice: number, targetPrice: number, condition: 'above' | 'below'): boolean {
    if (condition === 'above') {
      return currentPrice > targetPrice;
    } else {
      return currentPrice < targetPrice;
    }
  }

  /**
   * Avalia condição de indicador
   * @param indicatorValue Valor do indicador
   * @param targetValue Valor alvo
   * @param condition 'above' ou 'below'
   * @returns true se condição é atendida
   */
  static evaluateIndicatorCondition(
    indicatorValue: number,
    targetValue: number,
    condition: 'above' | 'below'
  ): boolean {
    if (condition === 'above') {
      return indicatorValue > targetValue;
    } else {
      return indicatorValue < targetValue;
    }
  }

  /**
   * Avalia cruzamento de médias
   * @param fastMA Média rápida
   * @param slowMA Média lenta
   * @param previousFastMA Média rápida anterior
   * @param previousSlowMA Média lenta anterior
   * @param direction 'up' ou 'down'
   * @returns true se cruzamento ocorreu na direção esperada
   */
  static evaluateMAcross(
    fastMA: number,
    slowMA: number,
    previousFastMA: number,
    previousSlowMA: number,
    direction: 'up' | 'down'
  ): boolean {
    const currentCross = fastMA > slowMA;
    const previousCross = previousFastMA > previousSlowMA;

    if (direction === 'up') {
      return !previousCross && currentCross; // Cruzamento para cima
    } else {
      return previousCross && !currentCross; // Cruzamento para baixo
    }
  }

  /**
   * Avalia condição MACD
   * @param macd Valor do MACD
   * @param signal Valor do sinal
   * @param previousMACD MACD anterior
   * @param previousSignal Sinal anterior
   * @param condition 'above_signal' ou 'below_signal'
   * @returns true se condição é atendida
   */
  static evaluateMACDCondition(
    macd: number,
    signal: number,
    previousMACD: number,
    previousSignal: number,
    condition: 'above_signal' | 'below_signal'
  ): boolean {
    if (condition === 'above_signal') {
      return macd > signal;
    } else {
      return macd < signal;
    }
  }

  /**
   * Avalia condição de volume
   * @param currentVolume Volume atual
   * @param averageVolume Volume médio
   * @param condition 'above' ou 'below'
   * @returns true se condição é atendida
   */
  static evaluateVolumeCondition(
    currentVolume: number,
    averageVolume: number,
    condition: 'above' | 'below'
  ): boolean {
    if (condition === 'above') {
      return currentVolume > averageVolume;
    } else {
      return currentVolume < averageVolume;
    }
  }
}
