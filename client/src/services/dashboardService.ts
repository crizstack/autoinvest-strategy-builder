/**
 * Dashboard Service
 * Busca dados reais do backend para o dashboard
 */

import { trpc } from '@/lib/trpc';

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

/**
 * Buscar métricas principais do dashboard
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Buscar portfolio
    const portfolio = await trpc.portfolio.getPortfolio.query();

    // Buscar estatísticas de paper trading
    const tradeStats = await trpc.paperTrading.getTradeStats.query();

    // Buscar estratégias ativas
    const strategies = await trpc.strategies.list.query();
    const activeStrategies = strategies.filter((s) => s.status === 'active').length;

    return {
      balance: Number(portfolio?.currentBalance) || 10000,
      initialBalance: Number(portfolio?.initialBalance) || 10000,
      totalReturn: Number(portfolio?.totalReturn) || 0,
      activeStrategies,
      winRate: tradeStats.winRate || 0,
      totalTrades: tradeStats.totalTrades || 0,
      profitFactor: tradeStats.profitFactor || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar métricas do dashboard:', error);
    throw error;
  }
}

/**
 * Buscar histórico de saldo
 */
export async function getBalanceHistory(): Promise<BalancePoint[]> {
  try {
    // Buscar todos os trades fechados
    const trades = await trpc.paperTrading.getClosedTrades.query({ limit: 1000 });

    // Ordenar por data
    const sortedTrades = trades.sort((a, b) => new Date(a.exitTime!).getTime() - new Date(b.exitTime!).getTime());

    // Calcular saldo em cada ponto
    const portfolio = await trpc.portfolio.getPortfolio.query();
    const initialBalance = Number(portfolio?.initialBalance) || 10000;

    let runningBalance = initialBalance;
    const points: BalancePoint[] = [
      {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
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
        date: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        balance: initialBalance,
      }));
    }

    return points.slice(-8); // Últimos 8 pontos
  } catch (error) {
    console.error('Erro ao buscar histórico de saldo:', error);
    throw error;
  }
}

/**
 * Buscar dados de ganhos vs perdas por semana
 */
export async function getProfitabilityByWeek(): Promise<ProfitabilityData[]> {
  try {
    const trades = await trpc.paperTrading.getClosedTrades.query({ limit: 1000 });

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
  } catch (error) {
    console.error('Erro ao buscar dados de rentabilidade:', error);
    throw error;
  }
}

/**
 * Buscar top estratégias
 */
export async function getTopStrategies(): Promise<StrategyPerformance[]> {
  try {
    const strategies = await trpc.strategies.list.query();
    const trades = await trpc.paperTrading.getClosedTrades.query({ limit: 1000 });

    // Agrupar trades por estratégia
    const strategyStats: { [key: number]: { profit: number; trades: number; wins: number } } = {};

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

        const initialBalance = 10000;
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
  } catch (error) {
    console.error('Erro ao buscar top estratégias:', error);
    throw error;
  }
}

/**
 * Buscar dados de mercado hoje
 */
export async function getMarketToday(): Promise<any[]> {
  try {
    const watchlist = await trpc.watchlist.getWatchlist.query();

    return watchlist.slice(0, 5).map((item) => ({
      symbol: item.asset,
      price: item.currentPrice || 0,
      change: item.change || 0,
    }));
  } catch (error) {
    console.error('Erro ao buscar dados de mercado:', error);
    return [];
  }
}
