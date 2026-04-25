import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { AuthService } from '../services/AuthService';
import { RegisterSchema, LoginSchema, PasswordResetRequestSchema, PasswordResetSchema, UpdateProfileSchema } from '../../shared/validators';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';

export const authRouter = router({
  /**
   * Register a new user
   */
  register: publicProcedure
    .input(RegisterSchema)
    .mutation(async ({ input }) => {
      try {
        const user = await AuthService.register(input.email, input.password, input.name);
        return {
          success: true,
          message: 'Usuário registrado com sucesso',
          email: user.email,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao registrar usuário',
        });
      }
    }),

  /**
   * Login user
   */
  login: publicProcedure
    .input(LoginSchema)
    .mutation(async ({ input }) => {
      try {
        const user = await AuthService.login(input.email, input.password);
        return {
          success: true,
          message: 'Login realizado com sucesso',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao fazer login',
        });
      }
    }),

  /**
   * Request password reset
   */
  requestPasswordReset: publicProcedure
    .input(PasswordResetRequestSchema)
    .mutation(async ({ input }) => {
      try {
        const user = await AuthService.getUserByEmail(input.email);
        
        if (!user) {
          // Don't reveal if email exists (security)
          return {
            success: true,
            message: 'Se o email existe, você receberá um link de reset',
          };
        }

        // Generate reset token
        const token = AuthService.generatePasswordResetToken(input.email);

        // TODO: Send email with reset link
        // In production, send email with token to user
        console.log(`Password reset token for ${input.email}: ${token}`);

        return {
          success: true,
          message: 'Se o email existe, você receberá um link de reset',
          // For development only, remove in production
          token: process.env.NODE_ENV === 'development' ? token : undefined,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao solicitar reset de senha',
        });
      }
    }),

  /**
   * Reset password
   */
  resetPassword: publicProcedure
    .input(PasswordResetSchema)
    .mutation(async ({ input }) => {
      try {
        // Verify token (this is a simplified implementation)
        // In production, use a proper token service
        const decoded = Buffer.from(input.token, 'base64').toString('utf-8');
        const [email] = decoded.split(':');

        // Verify token validity
        const isValidToken = AuthService.verifyPasswordResetToken(input.token, email);
        if (!isValidToken) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Token de reset inválido ou expirado',
          });
        }

        // Get user
        const user = await AuthService.getUserByEmail(email);
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Usuário não encontrado',
          });
        }

        // Update password
        await AuthService.updatePassword(user.id, input.newPassword);

        return {
          success: true,
          message: 'Senha alterada com sucesso',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao resetar senha',
        });
      }
    }),

  /**
   * Get current user
   */
  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role,
      planId: ctx.user.planId,
      subscriptionStatus: ctx.user.subscriptionStatus,
    };
  }),

  /**
   * Update profile
   */
  updateProfile: protectedProcedure
    .input(UpdateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        const updateData: Record<string, any> = {};
        if (input.name) updateData.name = input.name;
        if (input.email) updateData.email = input.email;

        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: 'Perfil atualizado com sucesso',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar perfil',
        });
      }
    }),

  /**
   * Logout
   */
  logout: protectedProcedure.mutation(({ ctx }) => {
    // JWT logout is handled by clearing the cookie on the client
    // This endpoint can be used for server-side cleanup if needed
    return {
      success: true,
      message: 'Logout realizado com sucesso',
    };
  }),
});
