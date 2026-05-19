import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { PDFExportService, BacktestReportData } from "../backtest/pdfExportService";

export const backtestRouter = router({
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
