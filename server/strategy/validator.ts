/**
 * Validador de Estratégia
 * Valida a estrutura e parâmetros de uma estratégia
 */

import type { ExecutableStrategy, StrategyValidation, ValidationError } from '../../shared/strategy-types';

export class StrategyValidator {
  /**
   * Valida uma estratégia completa
   */
  static validate(strategy: ExecutableStrategy): StrategyValidation {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Validações básicas
    if (!strategy.asset || strategy.asset.trim().length === 0) {
      errors.push({
        message: 'Ativo (asset) é obrigatório',
        severity: 'error',
      });
    }

    if (!strategy.blocks || strategy.blocks.length === 0) {
      errors.push({
        message: 'Estratégia deve ter pelo menos um bloco',
        severity: 'error',
      });
    }

    if (!strategy.connections) {
      strategy.connections = [];
    }

    // Validar blocos individuais
    strategy.blocks.forEach((block) => {
      const blockErrors = this.validateBlock(block);
      errors.push(...blockErrors);
    });

    // Validar estrutura de blocos
    const structureErrors = this.validateStructure(strategy);
    errors.push(...structureErrors);

    // Validar conexões
    const connectionErrors = this.validateConnections(strategy);
    errors.push(...connectionErrors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida um bloco individual
   */
  private static validateBlock(block: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!block.id) {
      errors.push({
        message: 'Bloco deve ter um ID único',
        severity: 'error',
      });
    }

    if (!block.type || !['trigger', 'indicator', 'operator', 'action', 'risk'].includes(block.type)) {
      errors.push({
        blockId: block.id,
        message: `Tipo de bloco inválido: ${block.type}`,
        severity: 'error',
      });
    }

    if (!block.subType) {
      errors.push({
        blockId: block.id,
        message: 'SubType é obrigatório',
        severity: 'error',
      });
    }

    // Validar parâmetros específicos por tipo
    if (block.type === 'trigger') {
      const triggerErrors = this.validateTriggerParams(block);
      errors.push(...triggerErrors);
    } else if (block.type === 'indicator') {
      const indicatorErrors = this.validateIndicatorParams(block);
      errors.push(...indicatorErrors);
    } else if (block.type === 'action') {
      const actionErrors = this.validateActionParams(block);
      errors.push(...actionErrors);
    } else if (block.type === 'risk') {
      const riskErrors = this.validateRiskParams(block);
      errors.push(...riskErrors);
    }

    return errors;
  }

  /**
   * Valida parâmetros de trigger
   */
  private static validateTriggerParams(block: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (block.subType === 'price_above' || block.subType === 'price_below') {
      if (typeof block.params.value !== 'number' || block.params.value <= 0) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: valor deve ser um número positivo`,
          severity: 'error',
        });
      }
    } else if (block.subType === 'ma_cross') {
      if (typeof block.params.fastPeriod !== 'number' || block.params.fastPeriod <= 0) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: fastPeriod deve ser um número positivo`,
          severity: 'error',
        });
      }
      if (typeof block.params.slowPeriod !== 'number' || block.params.slowPeriod <= 0) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: slowPeriod deve ser um número positivo`,
          severity: 'error',
        });
      }
      if (block.params.fastPeriod >= block.params.slowPeriod) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: fastPeriod deve ser menor que slowPeriod`,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  /**
   * Valida parâmetros de indicador
   */
  private static validateIndicatorParams(block: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (block.subType === 'rsi') {
      if (typeof block.params.period !== 'number' || block.params.period <= 0) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: period deve ser um número positivo`,
          severity: 'error',
        });
      }
      if (typeof block.params.value !== 'number' || block.params.value < 0 || block.params.value > 100) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: value deve estar entre 0 e 100`,
          severity: 'error',
        });
      }
    } else if (block.subType === 'ma') {
      if (typeof block.params.period !== 'number' || block.params.period <= 0) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: period deve ser um número positivo`,
          severity: 'error',
        });
      }
      if (!['sma', 'ema'].includes(block.params.type)) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: type deve ser 'sma' ou 'ema'`,
          severity: 'error',
        });
      }
    } else if (block.subType === 'macd') {
      if (typeof block.params.fastPeriod !== 'number' || block.params.fastPeriod <= 0) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: fastPeriod deve ser um número positivo`,
          severity: 'error',
        });
      }
      if (typeof block.params.slowPeriod !== 'number' || block.params.slowPeriod <= 0) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: slowPeriod deve ser um número positivo`,
          severity: 'error',
        });
      }
      if (block.params.fastPeriod >= block.params.slowPeriod) {
        errors.push({
          blockId: block.id,
          message: `${block.label}: fastPeriod deve ser menor que slowPeriod`,
          severity: 'error',
        });
      }
    }

    return errors;
  }

  /**
   * Valida parâmetros de ação
   */
  private static validateActionParams(block: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!['market', 'limit'].includes(block.params.orderType)) {
      errors.push({
        blockId: block.id,
        message: `${block.label}: orderType deve ser 'market' ou 'limit'`,
        severity: 'error',
      });
    }

    if (block.params.quantity && (typeof block.params.quantity !== 'number' || block.params.quantity <= 0)) {
      errors.push({
        blockId: block.id,
        message: `${block.label}: quantity deve ser um número positivo`,
        severity: 'error',
      });
    }

    if (block.params.percentCapital && (typeof block.params.percentCapital !== 'number' || block.params.percentCapital <= 0 || block.params.percentCapital > 100)) {
      errors.push({
        blockId: block.id,
        message: `${block.label}: percentCapital deve estar entre 0 e 100`,
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Valida parâmetros de risco
   */
  private static validateRiskParams(block: any): ValidationError[] {
    const errors: ValidationError[] = [];

    if (typeof block.params.percentage !== 'number' || block.params.percentage <= 0 || block.params.percentage > 100) {
      errors.push({
        blockId: block.id,
        message: `${block.label}: percentage deve estar entre 0 e 100`,
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Valida estrutura de blocos
   */
  private static validateStructure(strategy: ExecutableStrategy): ValidationError[] {
    const errors: ValidationError[] = [];

    // Deve ter pelo menos um trigger
    const hasTrigger = strategy.blocks.some((b) => b.type === 'trigger');
    if (!hasTrigger) {
      errors.push({
        message: 'Estratégia deve ter pelo menos um Trigger (início)',
        severity: 'error',
      });
    }

    // Deve ter pelo menos uma ação
    const hasAction = strategy.blocks.some((b) => b.type === 'action');
    if (!hasAction) {
      errors.push({
        message: 'Estratégia deve ter pelo menos uma Ação (compra/venda)',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Valida conexões
   */
  private static validateConnections(strategy: ExecutableStrategy): ValidationError[] {
    const errors: ValidationError[] = [];

    const blockIds = new Set(strategy.blocks.map((b) => b.id));
    const connectedIds = new Set<string>();

    // Verificar se todas as conexões apontam para blocos existentes
    strategy.connections.forEach((conn) => {
      if (!blockIds.has(conn.source)) {
        errors.push({
          message: `Conexão referencia bloco inexistente: ${conn.source}`,
          severity: 'error',
        });
      }
      if (!blockIds.has(conn.target)) {
        errors.push({
          message: `Conexão referencia bloco inexistente: ${conn.target}`,
          severity: 'error',
        });
      }
      connectedIds.add(conn.source);
      connectedIds.add(conn.target);
    });

    // Detectar blocos desconectados
    const isolatedBlocks = strategy.blocks.filter((b) => !connectedIds.has(b.id));
    if (isolatedBlocks.length > 0) {
      errors.push({
        message: `${isolatedBlocks.length} bloco(s) desconectado(s): ${isolatedBlocks.map((b) => b.label).join(', ')}`,
        severity: 'error',
      });
    }

    return errors;
  }
}
