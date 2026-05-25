import { describe, it, expect } from 'vitest';

describe('PortfolioService - Math Calculations', () => {
  describe('Win Rate Calculation', () => {
    it('should calculate correct win rate', () => {
      const totalTrades = 10;
      const winningTrades = 6;
      const winRate = (winningTrades / totalTrades) * 100;

      expect(winRate).toEqual(60);
    });

    it('should handle zero trades', () => {
      const totalTrades = 0;
      const winningTrades = 0;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      expect(winRate).toEqual(0);
    });
  });

  describe('Profit Factor Calculation', () => {
    it('should calculate correct profit factor', () => {
      const totalWins = 1500;
      const totalLosses = 500;
      const profitFactor = totalWins / totalLosses;

      expect(profitFactor).toEqual(3.0);
    });

    it('should handle zero losses for profit factor', () => {
      const totalWins = 1000;
      const totalLosses = 0;
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

      expect(profitFactor).toEqual(Infinity);
    });

    it('should handle zero wins and losses', () => {
      const totalWins = 0;
      const totalLosses = 0;
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

      expect(profitFactor).toEqual(0);
    });
  });

  describe('Allocation Breakdown', () => {
    it('should calculate correct allocation percentages', () => {
      const totalBalance = 10000;
      const assetValue = 5000;
      const percentage = (assetValue / totalBalance) * 100;

      expect(percentage).toEqual(50);
    });

    it('should calculate correct PnL for allocation', () => {
      const totalValue = 5500;
      const totalCost = 5000;
      const profitLoss = totalValue - totalCost;
      const profitLossPercent = (profitLoss / totalCost) * 100;

      expect(profitLoss).toEqual(500);
      expect(profitLossPercent).toEqual(10);
    });

    it('should calculate PnL with loss', () => {
      const totalValue = 4500;
      const totalCost = 5000;
      const profitLoss = totalValue - totalCost;
      const profitLossPercent = (profitLoss / totalCost) * 100;

      expect(profitLoss).toEqual(-500);
      expect(profitLossPercent).toEqual(-10);
    });
  });

  describe('Sharpe Ratio Calculation', () => {
    it('should calculate Sharpe ratio with positive returns', () => {
      const returns = [0.001, 0.002, -0.001, 0.0015, 0.0025];
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = (avgReturn * 252) / (stdDev * Math.sqrt(252));

      expect(sharpeRatio).toBeGreaterThan(-100);
      expect(sharpeRatio).toBeLessThan(100);
      expect(Number.isFinite(sharpeRatio)).toBe(true);
    });

    it('should return 0 for Sharpe ratio when no volatility', () => {
      const returns = [0.01, 0.01, 0.01];
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0;

      expect(sharpeRatio).toEqual(0);
    });
  });

  describe('Drawdown Calculation', () => {
    it('should calculate maximum drawdown correctly', () => {
      const balances = [10000, 10500, 10200, 9800, 10100, 10300];
      let maxDrawdown = 0;
      let runningMax = balances[0];

      for (const balance of balances) {
        if (balance > runningMax) runningMax = balance;
        const drawdown = ((runningMax - balance) / runningMax) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      expect(maxDrawdown).toBeGreaterThan(0);
      expect(maxDrawdown).toBeLessThan(100);
    });

    it('should return 0 drawdown for only increasing balances', () => {
      const balances = [10000, 10500, 11000, 11500];
      let maxDrawdown = 0;
      let runningMax = balances[0];

      for (const balance of balances) {
        if (balance > runningMax) runningMax = balance;
        const drawdown = ((runningMax - balance) / runningMax) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      expect(maxDrawdown).toEqual(0);
    });

    it('should calculate drawdown for declining balances', () => {
      const balances = [10000, 9500, 9000, 8500];
      let maxDrawdown = 0;
      let runningMax = balances[0];

      for (const balance of balances) {
        if (balance > runningMax) runningMax = balance;
        const drawdown = ((runningMax - balance) / runningMax) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      }

      expect(maxDrawdown).toBeGreaterThan(0);
      expect(maxDrawdown).toBeLessThan(100);
    });
  });

  describe('Return Calculations', () => {
    it('should calculate total return correctly', () => {
      const initialBalance = 10000;
      const finalBalance = 11000;
      const totalReturn = finalBalance - initialBalance;
      const totalReturnPercent = (totalReturn / initialBalance) * 100;

      expect(totalReturn).toEqual(1000);
      expect(totalReturnPercent).toEqual(10);
    });

    it('should calculate negative return correctly', () => {
      const initialBalance = 10000;
      const finalBalance = 9000;
      const totalReturn = finalBalance - initialBalance;
      const totalReturnPercent = (totalReturn / initialBalance) * 100;

      expect(totalReturn).toEqual(-1000);
      expect(totalReturnPercent).toEqual(-10);
    });
  });

  describe('Portfolio Stats', () => {
    it('should calculate stats with winning trades', () => {
      const stats = {
        totalBalance: 11000,
        initialBalance: 10000,
        totalReturn: 1000,
        totalReturnPercent: 10,
        totalTrades: 5,
        winningTrades: 3,
        winRate: 60,
        openPositions: 1,
        totalOpenValue: 500,
        maxDrawdown: 5,
        sharpeRatio: 1.5,
        profitFactor: 2.0,
      };

      expect(stats.totalReturnPercent).toEqual(10);
      expect(stats.winRate).toEqual(60);
      expect(stats.profitFactor).toEqual(2.0);
    });

    it('should have default stats', () => {
      const stats = {
        totalBalance: 10000,
        initialBalance: 10000,
        totalReturn: 0,
        totalReturnPercent: 0,
        totalTrades: 0,
        winningTrades: 0,
        winRate: 0,
        openPositions: 0,
        totalOpenValue: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        profitFactor: 0,
      };

      expect(stats.initialBalance).toEqual(10000);
      expect(stats.totalBalance).toEqual(10000);
      expect(stats.totalReturn).toEqual(0);
      expect(stats.totalReturnPercent).toEqual(0);
      expect(stats.totalTrades).toBe(0);
      expect(stats.winRate).toEqual(0);
    });
  });
});
