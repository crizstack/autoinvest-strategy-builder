import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { PDFExportService, BacktestReportData } from "../backtest/pdfExportService";
import { getDb } from "../db";
import { BacktestEngine, type HistoricalCandle } from "../backtest/backtest-engine";
import { StrategyValidator } from "../strategy/validator";
import type { ExecutableStrategy } from "../../shared/strategy-types";

function generateMockCandles(asset: string, startDate: Date, endDate: Date): HistoricalCandle[] {
  const candles: HistoricalCandle[] = [];
  let currentDate = new Date(startDate);
  let price = 100;

  while (currentDate <= endDate) {
    const change = (Math.random() - 0.5) * 2;
    price += change;

    candles.push({
      timestamp: new Date(currentDate),
      open: price,
      high: price + Math.abs(change),
      low: price - Math.abs(change),
      close: price,
      volume: 1000000 + Math.random() * 500000,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return candles;
}

export const backtestRouter = router({
  /**
   * Executar backtest de uma estratégia
   */
  run: protectedProcedure
    .input(
      z.object({
        strategyId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
        initialCapital: z.number().default(10000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Buscar estratégia
        const db = await getDb();
        if (!db) {
          throw new Error('Banco de dados não disponível');
        }

        const strategy = await db.query.strategies.findFirst({
          where: (strategies, { eq, and }) =>
            and(eq(strategies.id, input.strategyId), eq(strategies.userId, ctx.user.id)),
        });

        if (!strategy) {
          throw new Error("Estratégia não encontrada");
        }

        // 2. Validar estratégia
        const executableStrategy: ExecutableStrategy = JSON.parse(strategy.blocks);
        const validation = StrategyValidator.validate(executableStrategy);

        if (!validation.isValid) {
          throw new Error(`Estratégia inválida: ${validation.errors.join(", ")}`);
        }

        // 3. Buscar dados históricos
        const candles = generateMockCandles(strategy.asset, input.startDate, input.endDate);

        // 4. Executar backtest
        const result = await BacktestEngine.runBacktest(executableStrategy, candles, input.initialCapital);

        return {
          success: true,
          result,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Erro ao executar backtest",
        };
      }
    }),

  exportReportPDF: protectedProcedure
    .input(
      z.object({
        strategyName: z.string().min(1, "Strategy name is required"),
        asset: z.string().min(1, "Asset is required"),
        period: z.string().min(1, "Period is required"),
        startDate: z.date(),
        endDate: z.date(),
        metrics: z.object({
          totalReturn: z.number(),
          sharpeRatio: z.number(),
          profitFactor: z.number(),
          maxDrawdown: z.number(),
          winRate: z.number(),
          totalTrades: z.number(),
          winningTrades: z.number(),
          losingTrades: z.number(),
          averageWin: z.number(),
          averageLoss: z.number(),
          recoveryFactor: z.number(),
        }),
        trades: z.array(
          z.object({
            date: z.date(),
            symbol: z.string(),
            type: z.enum(["BUY", "SELL"]),
            price: z.number(),
            quantity: z.number(),
            profit: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const reportData: BacktestReportData = {
          strategyName: input.strategyName,
          asset: input.asset,
          period: input.period,
          startDate: input.startDate,
          endDate: input.endDate,
          metrics: input.metrics,
          trades: input.trades,
        };

        const pdfBuffer = await PDFExportService.exportToBuffer(reportData);
        const fileName = PDFExportService.getFileName(input.strategyName);

        return {
          success: true,
          fileName,
          buffer: pdfBuffer.toString("base64"),
          size: pdfBuffer.length,
        };
      } catch (error) {
        console.error("Error exporting PDF:", error);
        throw new Error("Failed to export PDF report");
      }
    }),
});
