/**
 * Trade Monitoring Router
 * Endpoints para monitorar posições abertas e obter status de trades
 */

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { TradeMonitorService } from '../trading/trade-monitor-service';

export const tradeMonitoringRouter = router({
  /**
   * Monitorar todas as posições abertas
   */
  monitorAll: publicProcedure.query(async () => {
    try {
      const result = await TradeMonitorService.monitorAllOpenPositions();
      return result;
    } catch (error) {
      console.error('[TradeMonitoring] Erro ao monitorar posições:', error);
      return {
        monitored: 0,
        closed: 0,
        results: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }),

  /**
   * Obter status de uma posição específica
   */
  getStatus: protectedProcedure
    .input(z.object({ tradeId: z.number() }))
    .query(async ({ input }) => {
      try {
        const status = await TradeMonitorService.getPositionStatus(input.tradeId);
        return status;
      } catch (error) {
        console.error('[TradeMonitoring] Erro ao obter status:', error);
        throw error;
      }
    }),

  /**
   * Obter status de todas as posições abertas do usuário
   */
  getUserPositions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const result = await TradeMonitorService.monitorAllOpenPositions();
      return {
        total: result.monitored,
        closed: result.closed,
        positions: result.results,
      };
    } catch (error) {
      console.error('[TradeMonitoring] Erro ao obter posições do usuário:', error);
      throw error;
    }
  }),
});
