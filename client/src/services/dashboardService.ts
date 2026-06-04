/**
 * Dashboard Service
 * Tipos e interfaces para o dashboard
 * NOTA: Chamadas de tRPC devem ser feitas em componentes React com hooks
 */

export interface DashboardMetrics {
  balance: number;
  initialBalance: number;
  totalReturn: number;
  activeStrategies: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}

export interface BalancePoint {
  date: string;
  balance: number;
}

export interface ProfitabilityData {
  week: string;
  profit: number;
  loss: number;
}

export interface StrategyPerformance {
  id: number;
  name: string;
  return: number;
  trades: number;
  winRate: number;
}

export interface TradeData {
  id: number;
  strategyId: number;
  asset: string;
  type: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  entryTime: Date;
  exitPrice?: number;
  exitTime?: Date;
  status: 'open' | 'closed' | 'canceled';
  profitLoss?: number;
  profitLossPercent?: number;
}

export interface PortfolioData {
  id: number;
  userId: number;
  initialBalance: string | null;
  currentBalance: string | null;
  totalReturn: string | null;
  totalTrades: number | null;
  winningTrades: number | null;
  winRate: string | null;
  openPositions: unknown;
  updatedAt: Date;
}

export interface StrategyData {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  asset: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  blocks: unknown;
  connections: unknown;
  maxDrawdown: string | null;
  maxLossPerTrade: string | null;
  riskPerTrade: string | null;
  paperTradingActive: boolean;
  liveExecutionActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Calcular histórico de saldo a partir de trades
 */
export function calculateBalanceHistory(
  trades: TradeData[],
  initialBalance: number
): BalancePoint[] {
  // Ordenar por data
  const sortedTrades = trades
    .filter((t) => t.exitTime)
    .sort(
      (a, b) =>
        new Date(a.exitTime!).getTime() - new Date(b.exitTime!).getTime()
    );

  let runningBalance = initialBalance;
  const points: BalancePoint[] = [
    {
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
        'pt-BR'
      ),
      balance: initialBalance,
    },
  ];

  for (const trade of sortedTrades) {
    if (trade.profitLoss) {
      runningBalance += trade.profitLoss;
      points.push({
        date: new Date(trade.exitTime!).toLocaleDateString('pt-BR'),
        balance: runningBalance,
      });
    }
  }

  // Se não há trades, retornar apenas o ponto inicial
  if (points.length === 1) {
    return Array.from({ length: 8 }, (_, i) => ({
      date: new Date(
        Date.now() - (7 - i) * 24 * 60 * 60 * 1000
      ).toLocaleDateString('pt-BR'),
      balance: initialBalance,
    }));
  }

  return points.slice(-8); // Últimos 8 pontos
}

/**
 * Calcular dados de ganhos vs perdas por semana
 */
export function calculateProfitabilityByWeek(
  trades: TradeData[]
): ProfitabilityData[] {
  // Agrupar por semana
  const weeklyData: { [key: string]: { profit: number; loss: number } } = {};

  for (const trade of trades) {
    if (!trade.exitTime) continue;

    const date = new Date(trade.exitTime);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toLocaleDateString('pt-BR');

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { profit: 0, loss: 0 };
    }

    if (trade.profitLoss) {
      if (trade.profitLoss > 0) {
        weeklyData[weekKey].profit += trade.profitLoss;
      } else {
        weeklyData[weekKey].loss += trade.profitLoss;
      }
    }
  }

  // Converter para array
  return Object.entries(weeklyData)
    .map(([week, data], index) => ({
      week: `Sem ${index + 1}`,
      profit: Math.round(data.profit),
      loss: Math.round(data.loss),
    }))
    .slice(-4); // Últimas 4 semanas
}

/**
 * Calcular performance das estratégias
 */
export function calculateStrategyPerformance(
  strategies: StrategyData[],
  trades: TradeData[],
  initialBalance: number = 10000
): StrategyPerformance[] {
  // Agrupar trades por estratégia
  const strategyStats: {
    [key: number]: { profit: number; trades: number; wins: number };
  } = {};

  for (const trade of trades) {
    if (!strategyStats[trade.strategyId]) {
      strategyStats[trade.strategyId] = { profit: 0, trades: 0, wins: 0 };
    }

    strategyStats[trade.strategyId].trades += 1;
    if (trade.profitLoss && trade.profitLoss > 0) {
      strategyStats[trade.strategyId].wins += 1;
    }
    if (trade.profitLoss) {
      strategyStats[trade.strategyId].profit += trade.profitLoss;
    }
  }

  // Mapear estratégias com stats
  const result = strategies
    .map((strategy) => {
      const stats = strategyStats[strategy.id];
      if (!stats || stats.trades === 0) {
        return {
          id: strategy.id,
          name: strategy.name,
          return: 0,
          trades: 0,
          winRate: 0,
        };
      }

      const returnPercent = (stats.profit / initialBalance) * 100;
      const winRate = (stats.wins / stats.trades) * 100;

      return {
        id: strategy.id,
        name: strategy.name,
        return: Math.round(returnPercent * 10) / 10,
        trades: stats.trades,
        winRate: Math.round(winRate),
      };
    })
    .sort((a, b) => b.return - a.return)
    .slice(0, 3); // Top 3

  return result;
}
