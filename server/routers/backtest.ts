import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { PDFExportService, BacktestReportData } from "../backtest/pdfExportService";
import { getDb } from "../db";
import { BacktestEngine, type HistoricalCandle } from "../backtest/backtest-engine";
import { StrategyValidator } from "../strategy/validator";
import { getCandles, hasEnoughData } from "../market/candles-service";
import type { ExecutableStrategy } from "../../shared/strategy-types";

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

        // 2. Reconstruir ExecutableStrategy
        const blocks = strategy.blocks ? JSON.parse(strategy.blocks as any) : [];
        const connections = strategy.connections ? JSON.parse(strategy.connections as any) : [];
        
        const executableStrategy: ExecutableStrategy = {
          id: strategy.id.toString(),
          name: strategy.name,
          description: strategy.description,
          asset: strategy.asset,
          blocks,
          connections,
          userId: strategy.userId,
          status: strategy.status,
          createdAt: strategy.createdAt,
          updatedAt: strategy.updatedAt,
        };

        // 3. Validar estratégia
        const validation = StrategyValidator.validate(executableStrategy);

        if (!validation.isValid) {
          throw new Error(`Estratégia inválida: ${validation.errors.join(", ")}`);
        }

        // 3. Buscar dados históricos
        const hasData = await hasEnoughData(strategy.asset, 30);
        if (!hasData) {
          throw new Error(`Dados insuficientes para ${strategy.asset}. Execute sincronização primeiro.`);
        }

        const candles = await getCandles(strategy.asset, input.startDate, input.endDate);
        if (candles.length === 0) {
          throw new Error(`Nenhum candle encontrado para ${strategy.asset} no período`);
        }

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
