/**
 * Validador de Grafo de Estratégia
 * Detecta ciclos, valida tipos de conexões e estrutura do grafo
 */

import type { ExecutableStrategy, StrategyBlock, StrategyConnection } from '../../shared/strategy-types';

export interface GraphValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cycles: string[][];
  orphanedNodes: string[];
  disconnectedComponents: string[][];
}

export class GraphValidator {
  /**
   * Valida o grafo completo da estratégia
   */
  static validate(strategy: ExecutableStrategy): GraphValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const cycles: string[][] = [];
    const orphanedNodes: string[] = [];
    const disconnectedComponents: string[][] = [];

    // Validar estrutura básica
    if (!strategy.blocks || strategy.blocks.length === 0) {
      errors.push('Estratégia deve ter pelo menos um bloco');
      return { isValid: false, errors, warnings, cycles, orphanedNodes, disconnectedComponents };
    }

    // Validar conexões
    const connectionErrors = this.validateConnections(strategy);
    errors.push(...connectionErrors);

    // Detectar ciclos
    const detectedCycles = this.detectCycles(strategy);
    cycles.push(...detectedCycles);
    if (detectedCycles.length > 0) {
      errors.push(`Detectados ${detectedCycles.length} ciclo(s) no grafo`);
    }

    // Validar tipos de conexões
    const typeErrors = this.validateConnectionTypes(strategy);
    errors.push(...typeErrors);

    // Detectar nós órfãos
    const orphans = this.findOrphanedNodes(strategy);
    orphanedNodes.push(...orphans);
    if (orphans.length > 0) {
      warnings.push(`${orphans.length} bloco(s) desconectado(s): ${orphans.join(', ')}`);
    }

    // Detectar componentes desconectados
    const components = this.findDisconnectedComponents(strategy);
    if (components.length > 1) {
      disconnectedComponents.push(...components);
      warnings.push(`Grafo tem ${components.length} componente(s) desconectado(s)`);
    }

    // Validar estrutura de fluxo
    const flowErrors = this.validateFlowStructure(strategy);
    errors.push(...flowErrors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cycles,
      orphanedNodes,
      disconnectedComponents,
    };
  }

  /**
   * Valida que todas as conexões referem-se a blocos existentes
   */
  private static validateConnections(strategy: ExecutableStrategy): string[] {
    const errors: string[] = [];
    const blockIds = new Set(strategy.blocks.map((b) => b.id));

    if (!strategy.connections) {
      return errors;
    }

    strategy.connections.forEach((conn) => {
      if (!blockIds.has(conn.source)) {
        errors.push(`Conexão refere-se a bloco inexistente: ${conn.source}`);
      }
      if (!blockIds.has(conn.target)) {
        errors.push(`Conexão refere-se a bloco inexistente: ${conn.target}`);
      }
    });

    return errors;
  }

  /**
   * Detecta ciclos no grafo usando DFS
   */
  private static detectCycles(strategy: ExecutableStrategy): string[][] {
    const cycles: string[][] = [];
    const blockIds = new Set(strategy.blocks.map((b) => b.id));
    const adjacencyList = this.buildAdjacencyList(strategy);

    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Ciclo detectado
          const cycleStart = path.indexOf(neighbor);
          const cycle = path.slice(cycleStart).concat([neighbor]);
          cycles.push(cycle);
        }
      }

      path.pop();
      recursionStack.delete(nodeId);
    };

    for (const blockId of blockIds) {
      if (!visited.has(blockId)) {
        dfs(blockId);
      }
    }

    return cycles;
  }

  /**
   * Valida que as conexões respeitam as regras de tipo
   * Ex: trigger → indicator/action, action → risk, etc
   */
  private static validateConnectionTypes(strategy: ExecutableStrategy): string[] {
    const errors: string[] = [];
    const blockMap = new Map(strategy.blocks.map((b) => [b.id, b]));

    if (!strategy.connections) {
      return errors;
    }

    strategy.connections.forEach((conn) => {
      const sourceBlock = blockMap.get(conn.source);
      const targetBlock = blockMap.get(conn.target);

      if (!sourceBlock || !targetBlock) {
        return; // Erro já reportado em validateConnections
      }

      // Validar transições permitidas
      const isValidTransition = this.isValidTransition(sourceBlock, targetBlock);
      if (!isValidTransition) {
        errors.push(
          `Conexão inválida: ${sourceBlock.type} (${sourceBlock.label}) → ${targetBlock.type} (${targetBlock.label})`
        );
      }
    });

    return errors;
  }

  /**
   * Define quais transições de tipo são válidas
   */
  private static isValidTransition(source: StrategyBlock, target: StrategyBlock): boolean {
    const validTransitions: Record<string, string[]> = {
      trigger: ['indicator', 'operator', 'action'],
      indicator: ['operator', 'action'],
      operator: ['indicator', 'operator', 'action'],
      action: ['risk'],
      risk: [], // Risk é terminal
    };

    const allowed = validTransitions[source.type] || [];
    return allowed.includes(target.type);
  }

  /**
   * Encontra nós que não têm conexões de entrada ou saída
   */
  private static findOrphanedNodes(strategy: ExecutableStrategy): string[] {
    const blockIds = new Set(strategy.blocks.map((b) => b.id));
    const connectedIds = new Set<string>();

    if (strategy.connections) {
      strategy.connections.forEach((conn) => {
        connectedIds.add(conn.source);
        connectedIds.add(conn.target);
      });
    }

    return Array.from(blockIds).filter((id) => !connectedIds.has(id));
  }

  /**
   * Encontra componentes desconectados do grafo
   */
  private static findDisconnectedComponents(strategy: ExecutableStrategy): string[][] {
    const blockIds = new Set(strategy.blocks.map((b) => b.id));
    const adjacencyList = this.buildUndirectedAdjacencyList(strategy);

    const visited = new Set<string>();
    const components: string[][] = [];

    const bfs = (startId: string): string[] => {
      const component: string[] = [];
      const queue = [startId];
      visited.add(startId);

      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        component.push(nodeId);

        const neighbors = adjacencyList.get(nodeId) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      return component;
    };

    for (const blockId of blockIds) {
      if (!visited.has(blockId)) {
        const component = bfs(blockId);
        components.push(component);
      }
    }

    return components;
  }

  /**
   * Valida a estrutura de fluxo (deve ter trigger e action)
   */
  private static validateFlowStructure(strategy: ExecutableStrategy): string[] {
    const errors: string[] = [];

    const hasTrigger = strategy.blocks.some((b) => b.type === 'trigger');
    if (!hasTrigger) {
      errors.push('Estratégia deve ter pelo menos um Trigger');
    }

    const hasAction = strategy.blocks.some((b) => b.type === 'action');
    if (!hasAction) {
      errors.push('Estratégia deve ter pelo menos uma Ação (compra/venda)');
    }

    // Validar que há caminho de trigger para action
    if (hasTrigger && hasAction) {
      const triggerIds = strategy.blocks.filter((b) => b.type === 'trigger').map((b) => b.id);
      const actionIds = strategy.blocks.filter((b) => b.type === 'action').map((b) => b.id);

      const hasPath = triggerIds.some((triggerId) =>
        this.hasPathToAny(strategy, triggerId, actionIds)
      );

      if (!hasPath) {
        errors.push('Não há caminho de Trigger para Ação');
      }
    }

    return errors;
  }

  /**
   * Verifica se há caminho entre um nó e qualquer um de um conjunto
   */
  private static hasPathToAny(
    strategy: ExecutableStrategy,
    startId: string,
    targetIds: string[]
  ): boolean {
    const visited = new Set<string>();
    const queue = [startId];
    visited.add(startId);

    while (queue.length > 0) {
      const nodeId = queue.shift()!;

      if (targetIds.includes(nodeId)) {
        return true;
      }

      const neighbors =
        strategy.connections
          ?.filter((c) => c.source === nodeId)
          .map((c) => c.target) || [];

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  /**
   * Constrói lista de adjacência direcionada
   */
  private static buildAdjacencyList(
    strategy: ExecutableStrategy
  ): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    strategy.blocks.forEach((block) => {
      adjacencyList.set(block.id, []);
    });

    if (strategy.connections) {
      strategy.connections.forEach((conn) => {
        const neighbors = adjacencyList.get(conn.source) || [];
        neighbors.push(conn.target);
        adjacencyList.set(conn.source, neighbors);
      });
    }

    return adjacencyList;
  }

  /**
   * Constrói lista de adjacência não-direcionada
   */
  private static buildUndirectedAdjacencyList(
    strategy: ExecutableStrategy
  ): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();

    strategy.blocks.forEach((block) => {
      adjacencyList.set(block.id, []);
    });

    if (strategy.connections) {
      strategy.connections.forEach((conn) => {
        const sourceNeighbors = adjacencyList.get(conn.source) || [];
        sourceNeighbors.push(conn.target);
        adjacencyList.set(conn.source, sourceNeighbors);

        const targetNeighbors = adjacencyList.get(conn.target) || [];
        targetNeighbors.push(conn.source);
        adjacencyList.set(conn.target, targetNeighbors);
      });
    }

    return adjacencyList;
  }
}
