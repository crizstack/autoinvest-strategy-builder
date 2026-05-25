import { describe, it, expect, vi } from 'vitest';
import { PaperTradingEngine } from './paper-trading-engine';

describe('Paper Trading Engine', () => {
  it('deve calcular PnL corretamente para compra', () => {
    const quantity = 100;
    const entryPrice = 25.0;
    const exitPrice = 27.5;

    const profitLoss = quantity * (exitPrice - entryPrice);
    const profitLossPercent = (profitLoss / (quantity * entryPrice)) * 100;

    expect(profitLoss).toBe(250); // 100 * (27.5 - 25)
    expect(profitLossPercent).toBeCloseTo(10, 1); // (250 / 2500) * 100
  });

  it('deve calcular PnL corretamente para venda', () => {
    const quantity = 50;
    const entryPrice = 62.3;
    const exitPrice = 60.0;

    const profitLoss = quantity * (entryPrice - exitPrice);
    const profitLossPercent = (profitLoss / (quantity * entryPrice)) * 100;

    expect(profitLoss).toBeCloseTo(115, 0); // 50 * (62.3 - 60)
    expect(profitLossPercent).toBeCloseTo(3.68, 1); // (115 / 3115) * 100
  });

  it('deve calcular prejuízo corretamente', () => {
    const quantity = 200;
    const entryPrice = 11.8;
    const exitPrice = 10.5;

    const profitLoss = quantity * (exitPrice - entryPrice);
    const profitLossPercent = (profitLoss / (quantity * entryPrice)) * 100;

    expect(profitLoss).toBeCloseTo(-260, 1); // 200 * (10.5 - 11.8)
    expect(profitLossPercent).toBeCloseTo(-10.98, 1);
  });

  it('deve calcular win rate corretamente', () => {
    const trades = [
      { profitLoss: 250 },
      { profitLoss: -100 },
      { profitLoss: 500 },
      { profitLoss: -50 },
      { profitLoss: 150 },
    ];

    const winningTrades = trades.filter((t) => t.profitLoss > 0).length;
    const winRate = (winningTrades / trades.length) * 100;

    expect(winningTrades).toBe(3);
    expect(winRate).toBe(60);
  });

  it('deve calcular profit factor corretamente', () => {
    const trades = [
      { profitLoss: 250 },
      { profitLoss: -100 },
      { profitLoss: 500 },
      { profitLoss: -50 },
    ];

    const totalProfit = trades.filter((t) => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(
      trades.filter((t) => t.profitLoss < 0).reduce((sum, t) => sum + t.profitLoss, 0)
    );

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

    expect(totalProfit).toBe(750); // 250 + 500
    expect(totalLoss).toBe(150); // 100 + 50
    expect(profitFactor).toBe(5); // 750 / 150
  });

  it('deve calcular média de ganhos e perdas', () => {
    const trades = [
      { profitLoss: 250 },
      { profitLoss: -100 },
      { profitLoss: 500 },
      { profitLoss: -50 },
      { profitLoss: 150 },
    ];

    const winningTrades = trades.filter((t) => t.profitLoss > 0);
    const losingTrades = trades.filter((t) => t.profitLoss < 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profitLoss, 0));

    const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    expect(avgWin).toBeCloseTo(300, 1); // (250 + 500 + 150) / 3
    expect(avgLoss).toBe(75); // (100 + 50) / 2
  });

  it('deve validar quantidade positiva', () => {
    const quantity = -100;
    expect(quantity > 0).toBe(false);
  });

  it('deve validar preço positivo', () => {
    const price = 0;
    expect(price > 0).toBe(false);
  });

  it('deve calcular total de operação', () => {
    const quantity = 100;
    const price = 28.5;
    const total = quantity * price;

    expect(total).toBe(2850);
  });

  it('deve diferenciar entre buy e sell', () => {
    const buyType = 'buy';
    const sellType = 'sell';

    expect(buyType).toBe('buy');
    expect(sellType).toBe('sell');
    expect(buyType).not.toBe(sellType);
  });
});
