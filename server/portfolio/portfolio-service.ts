import { getDb } from '../db';
import { portfolios, portfolioSnapshots, portfolioAllocations, paperTrades, assets } from '../../drizzle/schema';
import { eq, and, sum, desc } from 'drizzle-orm';

export interface PortfolioStats {
  totalBalance: number;
  initialBalance: number;
  totalReturn: number;
  totalReturnPercent: number;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  openPositions: number;
  totalOpenValue: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
}

export interface AllocationBreakdown {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  profitLoss: number;
  profitLossPercent: number;
  percentageOfPortfolio: number;
}

export class PortfolioService {
  /**
   * Obter ou criar portfolio do usuário
   */
  static async getOrCreatePortfolio(userId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    let portfolio = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .limit(1);

    if (!portfolio || portfolio.length === 0) {
      const initialBalance = '10000.00';
      await db.insert(portfolios).values({
        userId,
        initialBalance,
        currentBalance: initialBalance,
        totalReturn: '0.00',
        totalTrades: 0,
        winningTrades: 0,
        winRate: '0.00',
      });

      portfolio = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .limit(1);
    }

    return portfolio[0];
  }

  /**
   * Calcular estatísticas completas do portfolio
   */
  static async calculatePortfolioStats(userId: number): Promise<PortfolioStats> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const portfolio = await this.getOrCreatePortfolio(userId);
    const initialBalance = Number(portfolio.initialBalance);

    // Buscar todos os trades do usuário
    const allTrades = await db
      .select()
      .from(paperTrades)
      .where(eq(paperTrades.userId, userId));

    const closedTrades = allTrades.filter((t) => t.status === 'closed');
    const openTrades = allTrades.filter((t) => t.status === 'open');

    // Calcular lucro/prejuízo total
    const totalPnL = closedTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0);
    const currentBalance = initialBalance + totalPnL;

    // Calcular valor total de posições abertas
    const totalOpenValue = openTrades.reduce((sum, t) => {
      const value = Number(t.quantity) * Number(t.entryPrice);
      return sum + value;
    }, 0);

    // Calcular PnL de posições abertas
    const openPnL = openTrades.reduce((sum, t) => {
      // Usar preço de entrada como aproximação (em produção, buscar preço atual)
      return sum + 0;
    }, 0);

    // Calcular taxa de acerto
    const winningTrades = closedTrades.filter((t) => Number(t.profitLoss || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;

    // Calcular profit factor
    const totalWins = closedTrades
      .filter((t) => Number(t.profitLoss || 0) > 0)
      .reduce((sum, t) => sum + Number(t.profitLoss || 0), 0);
    const totalLosses = Math.abs(
      closedTrades
        .filter((t) => Number(t.profitLoss || 0) < 0)
        .reduce((sum, t) => sum + Number(t.profitLoss || 0), 0)
    );
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    // Calcular drawdown máximo (simplificado)
    let maxDrawdown = 0;
    let runningMax = initialBalance;
    for (const trade of closedTrades) {
      const balance = initialBalance + closedTrades.slice(0, closedTrades.indexOf(trade) + 1).reduce((sum, t) => sum + Number(t.profitLoss || 0), 0);
      if (balance > runningMax) runningMax = balance;
      const drawdown = ((runningMax - balance) / runningMax) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    // Calcular Sharpe Ratio (simplificado)
    const returns = closedTrades.map((t) => Number(t.profitLossPercent || 0) / 100);
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0; // 252 dias de trading

    const totalReturn = currentBalance - initialBalance;
    const totalReturnPercent = (totalReturn / initialBalance) * 100;

    return {
      totalBalance: currentBalance,
      initialBalance,
      totalReturn,
      totalReturnPercent,
      totalTrades: allTrades.length,
      winningTrades,
      winRate,
      openPositions: openTrades.length,
      totalOpenValue,
      maxDrawdown,
      sharpeRatio,
      profitFactor,
    };
  }

  /**
   * Obter alocação por ativo
   */
  static async getAllocationBreakdown(userId: number): Promise<AllocationBreakdown[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const stats = await this.calculatePortfolioStats(userId);

    // Buscar posições abertas agrupadas por ativo
    const openTrades = await db
      .select()
      .from(paperTrades)
      .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')));

    // Agrupar por ativo
    const assetMap = new Map<string, { quantity: number; totalCost: number; trades: typeof openTrades }>();

    for (const trade of openTrades) {
      const key = trade.asset;
      if (!assetMap.has(key)) {
        assetMap.set(key, { quantity: 0, totalCost: 0, trades: [] });
      }
      const entry = assetMap.get(key)!;
      entry.quantity += trade.quantity;
      entry.totalCost += Number(trade.quantity) * Number(trade.entryPrice);
      entry.trades.push(trade);
    }

    // Converter para array e calcular métricas
    const allocations: AllocationBreakdown[] = [];

    for (const [symbol, data] of assetMap.entries()) {
      const averagePrice = data.quantity > 0 ? data.totalCost / data.quantity : 0;
      const currentPrice = averagePrice; // Em produção, buscar preço atual da API
      const totalValue = data.quantity * currentPrice;
      const profitLoss = totalValue - data.totalCost;
      const profitLossPercent = data.totalCost > 0 ? (profitLoss / data.totalCost) * 100 : 0;
      const percentageOfPortfolio = stats.totalBalance > 0 ? (totalValue / stats.totalBalance) * 100 : 0;

      allocations.push({
        symbol,
        quantity: data.quantity,
        averagePrice,
        currentPrice,
        totalValue,
        profitLoss,
        profitLossPercent,
        percentageOfPortfolio,
      });
    }

    return allocations.sort((a, b) => b.percentageOfPortfolio - a.percentageOfPortfolio);
  }

  /**
   * Criar snapshot do portfolio
   */
  static async createSnapshot(userId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const portfolio = await this.getOrCreatePortfolio(userId);
    const stats = await this.calculatePortfolioStats(userId);

    const today = new Date();
    const snapshotDate = today.toISOString().split('T')[0];

    await db.insert(portfolioSnapshots).values({
      portfolioId: portfolio.id,
      userId,
      balance: stats.totalBalance.toString(),
      totalReturn: stats.totalReturn.toString(),
      totalTrades: stats.totalTrades,
      winningTrades: stats.winningTrades,
      winRate: stats.winRate.toString(),
      maxDrawdown: stats.maxDrawdown.toString(),
      sharpeRatio: stats.sharpeRatio.toString(),
      profitFactor: stats.profitFactor.toString(),
      openPositionsCount: stats.openPositions,
      totalOpenValue: stats.totalOpenValue.toString(),
      snapshotDate: snapshotDate as any,
    });
  }

  /**
   * Obter histórico de snapshots
   */
  static async getSnapshotHistory(userId: number, days: number = 30) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const portfolio = await this.getOrCreatePortfolio(userId);

    const snapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.portfolioId, portfolio.id))
      .orderBy(desc(portfolioSnapshots.snapshotDate))
      .limit(days);

    return snapshots.reverse();
  }

  /**
   * Atualizar portfolio após trade
   */
  static async updatePortfolioAfterTrade(userId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const portfolio = await this.getOrCreatePortfolio(userId);
    const stats = await this.calculatePortfolioStats(userId);

    await db
      .update(portfolios)
      .set({
        currentBalance: stats.totalBalance.toString(),
        totalReturn: stats.totalReturn.toString(),
        totalTrades: stats.totalTrades,
        winningTrades: stats.winningTrades,
        winRate: stats.winRate.toString(),
      })
      .where(eq(portfolios.userId, userId));

    // Criar snapshot diário
    await this.createSnapshot(userId);
  }

  /**
   * Resetar portfolio
   */
  static async resetPortfolio(userId: number) {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const initialBalance = '10000.00';

    await db
      .update(portfolios)
      .set({
        currentBalance: initialBalance,
        totalReturn: '0.00',
        totalTrades: 0,
        winningTrades: 0,
        winRate: '0.00',
      })
      .where(eq(portfolios.userId, userId));
  }
}
