/**
 * Connection Validator
 * Valida tipagem de conexões entre blocos
 * Garante que transições entre tipos de blocos sejam válidas
 */

import type {
  ExecutableStrategyV2,
  StrategyBlockV2,
  StrategyConnection,
  StrategyValidationError,
  BlockType,
  VALID_TRANSITIONS,
} from '../../shared/strategy-schema-v2';
import { VALID_TRANSITIONS as TRANSITIONS, STRATEGY_REQUIREMENTS } from '../../shared/strategy-schema-v2';

export class ConnectionValidator {
  /**
   * Valida todas as conexões de uma estratégia
   */
  static validateConnections(strategy: ExecutableStrategyV2): StrategyValidationError[] {
    const errors: StrategyValidationError[] = [];
    const blockMap = new Map<string, StrategyBlockV2>();

    // Construir mapa de blocos
    strategy.blocks.forEach((block) => {
      blockMap.set(block.id, block);
    });

    // Validar cada conexão
    strategy.connections.forEach((conn) => {
      const sourceBlock = blockMap.get(conn.source);
      const targetBlock = blockMap.get(conn.target);

      // Verificar se blocos existem
      if (!sourceBlock) {
        errors.push({
          code: 'INVALID_SOURCE_BLOCK',
          message: `Bloco de origem não encontrado: ${conn.source}`,
          connectionId: conn.id,
          severity: 'error',
        });
        return;
      }

      if (!targetBlock) {
        errors.push({
          code: 'INVALID_TARGET_BLOCK',
          message: `Bloco de destino não encontrado: ${conn.target}`,
          connectionId: conn.id,
          severity: 'error',
        });
        return;
      }

      // Validar transição de tipo
      const validTargets = TRANSITIONS[sourceBlock.type];
      if (!validTargets.includes(targetBlock.type)) {
        errors.push({
          code: 'INVALID_TRANSITION',
          message: `Transição inválida: ${sourceBlock.type} → ${targetBlock.type}. Permitido: ${sourceBlock.type} → ${validTargets.join(' | ')}`,
          connectionId: conn.id,
          severity: 'error',
        });
      }

      // Validações específicas por tipo
      this.validateSpecificTransitions(sourceBlock, targetBlock, conn, errors);
    });

    return errors;
  }

  /**
   * Valida transições específicas com regras de negócio
   */
  private static validateSpecificTransitions(
    sourceBlock: StrategyBlockV2,
    targetBlock: StrategyBlockV2,
    conn: StrategyConnection,
    errors: StrategyValidationError[]
  ): void {
    // Trigger só pode ter uma saída
    if (sourceBlock.type === 'trigger') {
      // Validação de múltiplas saídas é feita em validateStructure
    }

    // Operator AND/OR deve ter múltiplas entradas
    if (targetBlock.type === 'operator') {
      // Validação de múltiplas entradas é feita em validateStructure
    }

    // Action deve ter entrada de trigger/indicator/operator
    if (targetBlock.type === 'action') {
      if (sourceBlock.type === 'trigger') {
        // Direto do trigger é válido mas não recomendado
        errors.push({
          code: 'DIRECT_TRIGGER_TO_ACTION',
          message: 'Aviso: Ação direta de trigger sem indicadores. Considere adicionar indicadores para filtrar sinais.',
          connectionId: conn.id,
          severity: 'warning',
        });
      }
    }

    // Risk deve ter entrada de action
    if (targetBlock.type === 'risk') {
      if (sourceBlock.type !== 'action') {
        errors.push({
          code: 'INVALID_RISK_SOURCE',
          message: `Risk deve conectar de action, não de ${sourceBlock.type}`,
          connectionId: conn.id,
          severity: 'error',
        });
      }
    }
  }

  /**
   * Valida estrutura geral da estratégia
   */
  static validateStructure(strategy: ExecutableStrategyV2): StrategyValidationError[] {
    const errors: StrategyValidationError[] = [];

    // Verificar limites
    if (strategy.blocks.length > STRATEGY_REQUIREMENTS.maxBlocks) {
      errors.push({
        code: 'TOO_MANY_BLOCKS',
        message: `Estratégia possui ${strategy.blocks.length} blocos, máximo é ${STRATEGY_REQUIREMENTS.maxBlocks}`,
        severity: 'error',
      });
    }

    if (strategy.connections.length > STRATEGY_REQUIREMENTS.maxConnections) {
      errors.push({
        code: 'TOO_MANY_CONNECTIONS',
        message: `Estratégia possui ${strategy.connections.length} conexões, máximo é ${STRATEGY_REQUIREMENTS.maxConnections}`,
        severity: 'error',
      });
    }

    // Verificar requisitos mínimos
    const triggerCount = strategy.blocks.filter((b) => b.type === 'trigger').length;
    if (triggerCount < STRATEGY_REQUIREMENTS.minTriggers) {
      errors.push({
        code: 'NO_TRIGGERS',
        message: `Estratégia deve ter pelo menos ${STRATEGY_REQUIREMENTS.minTriggers} trigger(s)`,
        severity: 'error',
      });
    }

    const actionCount = strategy.blocks.filter((b) => b.type === 'action').length;
    if (actionCount < STRATEGY_REQUIREMENTS.minActions) {
      errors.push({
        code: 'NO_ACTIONS',
        message: `Estratégia deve ter pelo menos ${STRATEGY_REQUIREMENTS.minActions} action(s)`,
        severity: 'error',
      });
    }

    // Verificar blocos órfãos
    const connectedBlocks = new Set<string>();
    strategy.connections.forEach((conn) => {
      connectedBlocks.add(conn.source);
      connectedBlocks.add(conn.target);
    });

    strategy.blocks.forEach((block) => {
      if (!connectedBlocks.has(block.id)) {
        errors.push({
          code: 'ORPHANED_BLOCK',
          message: `Bloco órfão (desconectado): ${block.label} (${block.id})`,
          blockId: block.id,
          severity: 'warning',
        });
      }
    });

    // Verificar caminho trigger → action
    const hasValidPath = this.hasPathFromTriggerToAction(strategy);
    if (!hasValidPath) {
      errors.push({
        code: 'NO_TRIGGER_TO_ACTION_PATH',
        message: 'Estratégia não possui caminho válido de trigger para action',
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Verifica se existe caminho de trigger para action
   */
  private static hasPathFromTriggerToAction(strategy: ExecutableStrategyV2): boolean {
    const blockMap = new Map<string, StrategyBlockV2>();
    const adjacencyList = new Map<string, string[]>();

    strategy.blocks.forEach((block) => {
      blockMap.set(block.id, block);
      adjacencyList.set(block.id, []);
    });

    strategy.connections.forEach((conn) => {
      const targets = adjacencyList.get(conn.source) || [];
      targets.push(conn.target);
      adjacencyList.set(conn.source, targets);
    });

    // DFS de cada trigger para encontrar action
    const triggers = strategy.blocks.filter((b) => b.type === 'trigger');
    const actions = new Set(strategy.blocks.filter((b) => b.type === 'action').map((b) => b.id));

    for (const trigger of triggers) {
      if (this.dfsHasPath(trigger.id, actions, adjacencyList)) {
        return true;
      }
    }

    return false;
  }

  /**
   * DFS para encontrar caminho até um action
   */
  private static dfsHasPath(nodeId: string, targetSet: Set<string>, adjacencyList: Map<string, string[]>): boolean {
    if (targetSet.has(nodeId)) {
      return true;
    }

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (this.dfsHasPath(neighbor, targetSet, adjacencyList)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Valida parâmetros de blocos
   */
  static validateBlockParams(block: StrategyBlockV2): StrategyValidationError[] {
    const errors: StrategyValidationError[] = [];

    switch (block.type) {
      case 'trigger':
        errors.push(...this.validateTriggerParams(block as any));
        break;
      case 'indicator':
        errors.push(...this.validateIndicatorParams(block as any));
        break;
      case 'action':
        errors.push(...this.validateActionParams(block as any));
        break;
      case 'risk':
        errors.push(...this.validateRiskParams(block as any));
        break;
    }

    return errors;
  }

  private static validateTriggerParams(block: any): StrategyValidationError[] {
    const errors: StrategyValidationError[] = [];
    const { params } = block;

    if (!params || !params.type) {
      errors.push({
        code: 'MISSING_TRIGGER_TYPE',
        message: 'Trigger deve especificar tipo (price_above, price_below, ma_cross)',
        blockId: block.id,
        severity: 'error',
      });
    }

    return errors;
  }

  private static validateIndicatorParams(block: any): StrategyValidationError[] {
    const errors: StrategyValidationError[] = [];
    const { params } = block;

    if (!params || !params.type) {
      errors.push({
        code: 'MISSING_INDICATOR_TYPE',
        message: 'Indicator deve especificar tipo (rsi, ma, macd, volume)',
        blockId: block.id,
        severity: 'error',
      });
    }

    return errors;
  }

  private static validateActionParams(block: any): StrategyValidationError[] {
    const errors: StrategyValidationError[] = [];
    const { params } = block;

    if (!params || !params.type) {
      errors.push({
        code: 'MISSING_ACTION_TYPE',
        message: 'Action deve especificar tipo (buy, sell, close)',
        blockId: block.id,
        severity: 'error',
      });
    }

    return errors;
  }

  private static validateRiskParams(block: any): StrategyValidationError[] {
    const errors: StrategyValidationError[] = [];
    const { params } = block;

    if (!params || !params.type) {
      errors.push({
        code: 'MISSING_RISK_TYPE',
        message: 'Risk deve especificar tipo (stop_loss, take_profit, max_per_trade)',
        blockId: block.id,
        severity: 'error',
      });
    }

    return errors;
  }

  /**
   * Valida estratégia completa (todas as verificações)
   */
  static validate(strategy: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar conexões
    const connErrors = this.validateConnections(strategy);
    errors.push(...connErrors.map(e => e.message));

    // Validar estrutura
    const structErrors = this.validateStructure(strategy);
    errors.push(...structErrors.map(e => e.message));

    // Validar parâmetros de blocos
    for (const block of strategy.blocks) {
      const blockErrors = this.validateBlockParams(block);
      errors.push(...blockErrors.map(e => e.message));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
