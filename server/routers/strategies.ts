import { router, protectedProcedure } from '../_core/trpc';
import { CreateStrategySchema, UpdateStrategySchema, ToggleStrategyStatusSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import { strategies } from '../../drizzle/schema';
import { z } from 'zod';
import { InputNormalizer } from '../strategy/input-normalizer';
import { ConnectionValidator } from '../strategy/connection-validator';

export const strategiesRouter = router({
  /**
   * List strategies for current user
   */
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          console.warn('[Strategies] Database not available');
          return [];
        }

        let whereCondition: any = eq(strategies.userId, ctx.user.id);
        
        if (input?.status) {
          whereCondition = and(whereCondition, eq(strategies.status, input.status));
        }

        const result = await db
          .select()
          .from(strategies)
          .where(whereCondition)
          .limit(input?.limit || 20)
          .offset(input?.offset || 0);

        return result;
      } catch (error) {
        console.error('[Strategies] Error listing strategies:', error);
        return [];
      }
    }),

  /**
   * Create a new strategy
   */
  create: protectedProcedure
    .input(CreateStrategySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) {
          console.warn('[Strategies] Database not available');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database not available',
          });
        }

        // Check plan limits
        // TODO: Implement plan limit check

        // Normalizar entrada do Builder
        const normalizedStrategy = InputNormalizer.normalizeBuilderInput(
          {
            name: input.name,
            description: input.description,
            asset: input.asset,
            nodes: input.blocks?.map((b: any) => ({
              id: b.id,
              data: {
                type: b.type,
                subType: b.subType || b.type,
                label: b.label,
                params: b.params,
              },
              position: b.position,
            })) || [],
            edges: input.connections?.map((c: any) => ({
              source: c.source,
              target: c.target,
            })) || [],
          },
          ctx.user.id
        );

        // Validar estratégia
        const validation = ConnectionValidator.validate(normalizedStrategy);
        if (!validation.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Estratégia inválida: ${validation.errors.join(', ')}`,
          });
        }

        const newStrategy = {
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          asset: input.asset,
          status: 'draft' as const,
          blocks: JSON.stringify(normalizedStrategy.blocks),
          connections: JSON.stringify(normalizedStrategy.connections),
        };

        const result = await db.insert(strategies).values(newStrategy);

        return {
          success: true,
          message: 'Estratégia criada com sucesso',
          strategyId: result.insertId,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar estratégia',
        });
      }
    }),

  /**
   * Get strategy by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const result = await db
          .select()
          .from(strategies)
          .where(and(
            eq(strategies.id, input.id),
            eq(strategies.userId, ctx.user.id)
          ))
          .limit(1);

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Estratégia não encontrada',
          });
        }

        return result[0];
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao obter estratégia',
        });
      }
    }),

  /**
   * Update strategy
   */
  update: protectedProcedure
    .input(z.object({ id: z.number() }).merge(UpdateStrategySchema))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const strategy = await db
          .select()
          .from(strategies)
          .where(and(
            eq(strategies.id, input.id),
            eq(strategies.userId, ctx.user.id)
          ))
          .limit(1);

        if (strategy.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Estratégia não encontrada',
          });
        }

        const updateData: Record<string, any> = {};
        if (input.name) updateData.name = input.name;
        if (input.description) updateData.description = input.description;
        if (input.blocks) updateData.blocks = JSON.stringify(input.blocks);
        if (input.connections) updateData.connections = JSON.stringify(input.connections);
        if (input.maxDrawdown) updateData.maxDrawdown = input.maxDrawdown;
        if (input.maxLossPerTrade) updateData.maxLossPerTrade = input.maxLossPerTrade;
        if (input.riskPerTrade) updateData.riskPerTrade = input.riskPerTrade;

        await db
          .update(strategies)
          .set(updateData)
          .where(eq(strategies.id, input.id));

        return {
          success: true,
          message: 'Estratégia atualizada com sucesso',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar estratégia',
        });
      }
    }),

  /**
   * Delete strategy
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const strategy = await db
          .select()
          .from(strategies)
          .where(and(
            eq(strategies.id, input.id),
            eq(strategies.userId, ctx.user.id)
          ))
          .limit(1);

        if (strategy.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Estratégia não encontrada',
          });
        }

        await db
          .delete(strategies)
          .where(eq(strategies.id, input.id));

        return {
          success: true,
          message: 'Estratégia deletada com sucesso',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao deletar estratégia',
        });
      }
    }),

  /**
   * Toggle strategy status
   */
  toggleStatus: protectedProcedure
    .input(z.object({ id: z.number() }).merge(ToggleStrategyStatusSchema))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const strategy = await db
          .select()
          .from(strategies)
          .where(and(
            eq(strategies.id, input.id),
            eq(strategies.userId, ctx.user.id)
          ))
          .limit(1);

        if (strategy.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Estratégia não encontrada',
          });
        }

        await db
          .update(strategies)
          .set({ status: input.status })
          .where(eq(strategies.id, input.id));

        return {
          success: true,
          message: `Estratégia ${input.status === 'active' ? 'ativada' : 'pausada'} com sucesso`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar status da estratégia',
        });
      }
    }),

  /**
   * Start paper trading
   */
  startPaperTrading: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const strategy = await db
          .select()
          .from(strategies)
          .where(and(
            eq(strategies.id, input.id),
            eq(strategies.userId, ctx.user.id)
          ))
          .limit(1);

        if (strategy.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Estratégia não encontrada',
          });
        }

        await db
          .update(strategies)
          .set({ paperTradingActive: true })
          .where(eq(strategies.id, input.id));

        return {
          success: true,
          message: 'Paper trading iniciado com sucesso',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao iniciar paper trading',
        });
      }
    }),

  /**
   * Stop paper trading
   */
  stopPaperTrading: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Verify ownership
        const strategy = await db
          .select()
          .from(strategies)
          .where(and(
            eq(strategies.id, input.id),
            eq(strategies.userId, ctx.user.id)
          ))
          .limit(1);

        if (strategy.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Estratégia não encontrada',
          });
        }

        await db
          .update(strategies)
          .set({ paperTradingActive: false })
          .where(eq(strategies.id, input.id));

        return {
          success: true,
          message: 'Paper trading parado com sucesso',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao parar paper trading',
        });
      }
    }),
});
