import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { generateAIResponse, formatAIResponse, generateContextualAnalysis } from '../ai-assistant';
import type { Message } from '@/types/ai';

export const aiRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        context: z.object({
          page: z.string(),
          userRole: z.string().optional(),
          currentPlan: z.string().optional(),
          strategyName: z.string().optional(),
          selectedAsset: z.string().optional(),
        }).optional(),
        conversationHistory: z.array(
          z.object({
            id: z.string(),
            role: z.enum(['user', 'assistant']),
            content: z.string(),
            timestamp: z.date(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Gerar resposta da IA
        const response = await generateAIResponse(input.message, undefined, {
          context: input.context,
          conversationHistory: input.conversationHistory as Message[] | undefined,
        });

        // Formatar resposta com disclaimer se necessário
        const formattedResponse = formatAIResponse(
          response,
          input.message.toLowerCase().includes('investir') ||
          input.message.toLowerCase().includes('comprar') ||
          input.message.toLowerCase().includes('vender')
        );

        return formattedResponse;
      } catch (error) {
        console.error('Erro no chat IA:', error);
        throw new Error('Falha ao gerar resposta. Tente novamente.');
      }
    }),

  /**
   * Chat contextual com acesso a dados do usuário
   */
  chatContextual: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        context: z.object({
          page: z.string(),
          userRole: z.string().optional(),
          currentPlan: z.string().optional(),
          strategyName: z.string().optional(),
          selectedAsset: z.string().optional(),
        }).optional(),
        conversationHistory: z.array(
          z.object({
            id: z.string(),
            role: z.enum(['user', 'assistant']),
            content: z.string(),
            timestamp: z.date(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Gerar resposta com contexto do usuário
        const response = await generateAIResponse(input.message, ctx.user.id, {
          context: input.context,
          conversationHistory: input.conversationHistory as Message[] | undefined,
        });

        const formattedResponse = formatAIResponse(
          response,
          input.message.toLowerCase().includes('investir') ||
          input.message.toLowerCase().includes('comprar') ||
          input.message.toLowerCase().includes('vender')
        );

        return formattedResponse;
      } catch (error) {
        console.error('Erro no chat contextual IA:', error);
        throw new Error('Falha ao gerar resposta. Tente novamente.');
      }
    }),

  /**
   * Análise contextual completa do portfolio
   */
  getAnalysis: protectedProcedure.query(async ({ ctx }) => {
    try {
      const analysis = await generateContextualAnalysis(ctx.user.id);
      return analysis;
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      return {
        risks: [],
        suggestions: [],
        insights: [],
        recommendations: [],
        nextAction: 'Comece criando sua primeira estratégia.',
      };
    }
  }),

  getSuggestions: publicProcedure
    .input(
      z.object({
        page: z.string(),
      })
    )
    .query(({ input }) => {
      const suggestions: Record<string, Array<{ id: string; text: string; icon: string }>> = {
        builder: [
          { id: '1', text: 'Como criar estratégia RSI?', icon: '🎯' },
          { id: '2', text: 'O que é um Trigger?', icon: '🔔' },
          { id: '3', text: 'Como conectar blocos?', icon: '🔗' },
        ],
        market: [
          { id: '1', text: 'Como ler um gráfico?', icon: '📊' },
          { id: '2', text: 'O que é RSI?', icon: '📈' },
          { id: '3', text: 'Como identificar tendências?', icon: '🎯' },
        ],
        backtest: [
          { id: '1', text: 'Como interpretar resultados?', icon: '📊' },
          { id: '2', text: 'O que é Sharpe Ratio?', icon: '📈' },
          { id: '3', text: 'Como otimizar estratégia?', icon: '⚙️' },
        ],
        trades: [
          { id: '1', text: 'Como melhorar taxa de acerto?', icon: '📈' },
          { id: '2', text: 'Como gerenciar risco?', icon: '🛡️' },
          { id: '3', text: 'O que é Stop Loss?', icon: '🛑' },
        ],
        strategies: [
          { id: '1', text: 'Que estratégia criar?', icon: '🎯' },
          { id: '2', text: 'Como comparar estratégias?', icon: '⚖️' },
          { id: '3', text: 'Como testar estratégia?', icon: '✅' },
        ],
        billing: [
          { id: '1', text: 'Qual plano escolher?', icon: '💳' },
          { id: '2', text: 'Qual a diferença dos planos?', icon: '📋' },
          { id: '3', text: 'Como fazer upgrade?', icon: '⬆️' },
        ],
        settings: [
          { id: '1', text: 'Como configurar perfil?', icon: '👤' },
          { id: '2', text: 'Como mudar senha?', icon: '🔐' },
          { id: '3', text: 'Como exportar dados?', icon: '💾' },
        ],
        dashboard: [
          { id: '1', text: 'Como começar?', icon: '🚀' },
          { id: '2', text: 'Como criar estratégia?', icon: '🎯' },
          { id: '3', text: 'O que é paper trading?', icon: '📝' },
        ],
      };

      return suggestions[input.page] || suggestions.dashboard;
    }),
});
