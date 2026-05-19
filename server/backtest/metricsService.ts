/**
 * Serviço de cálculo de métricas de backtest
 * Calcula Sharpe Ratio, Profit Factor, Drawdown, Win Rate, etc.
 */

export interface Trade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  result: number;
}

export interface EquityCurvePoint {
  date: string;
  value: number;
}

export interface BacktestMetrics {
  totalProfit: number;
  totalLoss: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  sharpeRatio: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  recoveryFactor: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgWin: number;
  avgLoss: number;
  profitLossRatio: number;
  expectancy: number;
}

export class MetricsService {
  /**
   * Calcula Sharpe Ratio
   * Mede o retorno ajustado pelo risco
   * Fórmula: (Retorno Médio - Taxa Livre de Risco) / Desvio Padrão
   */
  static calculateSharpeRatio(
    equityCurve: EquityCurvePoint[],
    riskFreeRate = 0.05 // 5% ao ano
  ): number {
    if (equityCurve.length < 2) return 0;

    // Calcular retornos diários
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn =
        (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value;
      returns.push(dailyReturn);
    }

    // Média de retornos
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Desvio padrão
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Sharpe Ratio (anualizado)
    const dailyRiskFreeRate = riskFreeRate / 252; // 252 dias úteis
    const sharpe = ((avgReturn - dailyRiskFreeRate) / stdDev) * Math.sqrt(252);

    return Math.round(sharpe * 100) / 100;
  }

  /**
   * Calcula Profit Factor
   * Razão entre lucros e perdas
   * Fórmula: Lucro Total / Perda Total
   */
  static calculateProfitFactor(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    const totalProfit = trades
      .filter((t) => t.result > 0)
      .reduce((sum, t) => sum + t.result, 0);

    const totalLoss = Math.abs(
      trades.filter((t) => t.result < 0).reduce((sum, t) => sum + t.result, 0)
    );

    if (totalLoss === 0) return totalProfit > 0 ? Infinity : 0;

    return Math.round((totalProfit / totalLoss) * 100) / 100;
  }

  /**
   * Calcula Drawdown Máximo
   * Maior queda do pico até o vale
   */
  static calculateMaxDrawdown(equityCurve: EquityCurvePoint[]): {
    maxDrawdown: number;
    maxDrawdownPercent: number;
  } {
    if (equityCurve.length < 2) return { maxDrawdown: 0, maxDrawdownPercent: 0 };

    let maxValue = equityCurve[0].value;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    for (let i = 1; i < equityCurve.length; i++) {
      if (equityCurve[i].value > maxValue) {
        maxValue = equityCurve[i].value;
      }

      const drawdown = maxValue - equityCurve[i].value;
      const drawdownPercent = (drawdown / maxValue) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
      }
    }

    return {
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
    };
  }

  /**
   * Calcula Win Rate
   * Percentual de trades vencedores
   */
  static calculateWinRate(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    const winningTrades = trades.filter((t) => t.result > 0).length;
    return Math.round((winningTrades / trades.length) * 100);
  }

  /**
   * Calcula Recovery Factor
   * Razão entre lucro total e drawdown máximo
   */
  static calculateRecoveryFactor(
    totalProfit: number,
    maxDrawdown: number
  ): number {
    if (maxDrawdown === 0) return totalProfit > 0 ? Infinity : 0;
    return Math.round((totalProfit / maxDrawdown) * 100) / 100;
  }

  /**
   * Calcula sequências de ganhos/perdas
   */
  static calculateConsecutiveStreaks(trades: Trade[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  } {
    if (trades.length === 0) return { maxConsecutiveWins: 0, maxConsecutiveLosses: 0 };

    let maxWins = 0;
    let maxLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    for (const trade of trades) {
      if (trade.result > 0) {
        currentWins++;
        currentLosses = 0;
        maxWins = Math.max(maxWins, currentWins);
      } else if (trade.result < 0) {
        currentLosses++;
        currentWins = 0;
        maxLosses = Math.max(maxLosses, currentLosses);
      }
    }

    return { maxConsecutiveWins: maxWins, maxConsecutiveLosses: maxLosses };
  }

  /**
   * Calcula expectativa matemática
   * Ganho médio por trade
   */
  static calculateExpectancy(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    const totalResult = trades.reduce((sum, t) => sum + t.result, 0);
    return Math.round((totalResult / trades.length) * 100) / 100;
  }

  /**
   * Calcula todas as métricas
   */
  static calculateAllMetrics(
    trades: Trade[],
    equityCurve: EquityCurvePoint[]
  ): BacktestMetrics {
    const totalProfit = trades.filter((t) => t.result > 0).reduce((sum, t) => sum + t.result, 0);
    const totalLoss = Math.abs(
      trades.filter((t) => t.result < 0).reduce((sum, t) => sum + t.result, 0)
    );
    const winningTrades = trades.filter((t) => t.result > 0).length;
    const losingTrades = trades.filter((t) => t.result < 0).length;

    const { maxDrawdown, maxDrawdownPercent } = this.calculateMaxDrawdown(equityCurve);
    const { maxConsecutiveWins, maxConsecutiveLosses } = this.calculateConsecutiveStreaks(trades);

    const avgWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

    return {
      totalProfit,
      totalLoss,
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
      winRate: this.calculateWinRate(trades),
      sharpeRatio: this.calculateSharpeRatio(equityCurve),
      profitFactor: this.calculateProfitFactor(trades),
      maxDrawdown,
      maxDrawdownPercent,
      recoveryFactor: this.calculateRecoveryFactor(totalProfit, maxDrawdown),
      maxConsecutiveWins,
      maxConsecutiveLosses,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitLossRatio: avgLoss > 0 ? Math.round((avgWin / avgLoss) * 100) / 100 : 0,
      expectancy: this.calculateExpectancy(trades),
    };
  }

  /**
   * Compara duas estratégias
   */
  static compareStrategies(
    strategy1Metrics: BacktestMetrics,
    strategy2Metrics: BacktestMetrics
  ): {
    better: 'strategy1' | 'strategy2' | 'tie';
    metrics: {
      name: string;
      strategy1: number | string;
      strategy2: number | string;
      difference: number | string;
      winner: 'strategy1' | 'strategy2' | 'tie';
    }[];
  } {
    const comparisons = [
      {
        name: 'Lucro Total',
        strategy1: strategy1Metrics.totalProfit,
        strategy2: strategy2Metrics.totalProfit,
      },
      {
        name: 'Sharpe Ratio',
        strategy1: strategy1Metrics.sharpeRatio,
        strategy2: strategy2Metrics.sharpeRatio,
      },
      {
        name: 'Profit Factor',
        strategy1: strategy1Metrics.profitFactor,
        strategy2: strategy2Metrics.profitFactor,
      },
      {
        name: 'Win Rate',
        strategy1: strategy1Metrics.winRate,
        strategy2: strategy2Metrics.winRate,
      },
      {
        name: 'Drawdown Máx',
        strategy1: strategy1Metrics.maxDrawdownPercent,
        strategy2: strategy2Metrics.maxDrawdownPercent,
      },
    ];

    const metrics = comparisons.map((comp) => {
      const diff = comp.strategy1 - comp.strategy2;
      let winner: 'strategy1' | 'strategy2' | 'tie' = 'tie';

      // Para drawdown, menor é melhor
      if (comp.name === 'Drawdown Máx') {
        winner = diff < 0 ? 'strategy1' : diff > 0 ? 'strategy2' : 'tie';
      } else {
        winner = diff > 0 ? 'strategy1' : diff < 0 ? 'strategy2' : 'tie';
      }

      return {
        name: comp.name,
        strategy1: comp.strategy1,
        strategy2: comp.strategy2,
        difference: Math.abs(diff),
        winner,
      };
    });

    // Contar vitórias
    const strategy1Wins = metrics.filter((m) => m.winner === 'strategy1').length;
    const strategy2Wins = metrics.filter((m) => m.winner === 'strategy2').length;

    const better: 'strategy1' | 'strategy2' | 'tie' =
      strategy1Wins > strategy2Wins ? 'strategy1' : strategy2Wins > strategy1Wins ? 'strategy2' : 'tie';

    return { better, metrics };
  }
}
