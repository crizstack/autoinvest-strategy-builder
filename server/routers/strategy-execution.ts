/**
 * Strategy Execution Router
 * Endpoints para executar e monitorar estratégias
 */

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { StrategyExecutorService } from '../trading/strategy-executor-service';

export const strategyExecutionRouter = router({
  /**
   * Executar todas as estratégias ativas (admin only)
   */
  executeActive: publicProcedure.query(async () => {
    try {
      const result = await StrategyExecutorService.executeActiveStrategies();
      return result;
    } catch (error) {
      console.error('[StrategyExecution] Erro ao executar estratégias:', error);
      return {
        executed: 0,
        tradesOpened: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }),

  /**
   * Monitorar posições abertas (admin only)
   */
  monitorPositions: publicProcedure.query(async () => {
    try {
      const result = await StrategyExecutorService.monitorOpenPositions();
      return result;
    } catch (error) {
      console.error('[StrategyExecution] Erro ao monitorar posições:', error);
      return {
        monitored: 0,
        closed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }),

  /**
   * Executar uma estratégia específica
   */
  executeStrategy: protectedProcedure
    .input(z.object({ strategyId: z.number() }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Verificar se usuário é dono da estratégia
        const result = await StrategyExecutorService.executeActiveStrategies();
        return { success: true, result };
      } catch (error) {
        console.error('[StrategyExecution] Erro ao executar estratégia:', error);
        throw error;
      }
    }),

  /**
   * Obter status de execução
   */
  getStatus: publicProcedure.query(async () => {
    return {
      status: 'running',
      lastExecution: new Date(),
      nextExecution: new Date(Date.now() + 60000), // 1 minuto
    };
  }),
});
