import { z } from 'zod';

// Auth Validators
export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  name: z.string().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const PasswordResetSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const UpdateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
});

// Strategy Validators
export const CreateStrategySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  asset: z.string().min(1, 'Ativo é obrigatório'),
  blocks: z.any().optional(),
  connections: z.any().optional(),
});

export const UpdateStrategySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  blocks: z.any().optional(),
  connections: z.any().optional(),
  maxDrawdown: z.number().optional(),
  maxLossPerTrade: z.number().optional(),
  riskPerTrade: z.number().optional(),
});

export const ToggleStrategyStatusSchema = z.object({
  status: z.enum(['draft', 'active', 'paused', 'archived']),
});

// Backtest Validators
export const RunBacktestSchema = z.object({
  strategyId: z.number(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  initialCapital: z.number().default(10000),
});

// Paper Trade Validators
export const ClosePaperTradeSchema = z.object({
  id: z.number(),
  exitPrice: z.number(),
});

export const CancelPaperTradeSchema = z.object({
  id: z.number(),
});

// Billing Validators
export const CreateCheckoutSessionSchema = z.object({
  planId: z.number(),
  billingCycle: z.enum(['monthly', 'annual']),
});

export const UpdatePaymentMethodSchema = z.object({
  stripePaymentMethodId: z.string(),
});

// Admin Validators
export const PromoteUserSchema = z.object({
  userId: z.number(),
});

// Type exports
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateStrategyInput = z.infer<typeof CreateStrategySchema>;
export type UpdateStrategyInput = z.infer<typeof UpdateStrategySchema>;
export type ToggleStrategyStatusInput = z.infer<typeof ToggleStrategyStatusSchema>;
export type RunBacktestInput = z.infer<typeof RunBacktestSchema>;
export type ClosePaperTradeInput = z.infer<typeof ClosePaperTradeSchema>;
export type CancelPaperTradeInput = z.infer<typeof CancelPaperTradeSchema>;
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof UpdatePaymentMethodSchema>;
export type PromoteUserInput = z.infer<typeof PromoteUserSchema>;
