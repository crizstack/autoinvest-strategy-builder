/**
 * Parser de Estratégia
 * Converte JSON da estratégia em grafo executável
 */

import type { ExecutableStrategy, ExecutionGraph, ExecutionNode, StrategyConnection } from '../../shared/strategy-types';

export class StrategyParser {
  /**
   * Constrói um grafo de execução a partir de uma estratégia
   */
  static buildExecutionGraph(strategy: ExecutableStrategy): ExecutionGraph {
    const nodes = new Map<string, ExecutionNode>();
    const errors: string[] = [];

    try {
      // 1. Criar nós de execução
      strategy.blocks.forEach((block) => {
        nodes.set(block.id, {
          blockId: block.id,
          block,
          dependencies: [],
          dependents: [],
          order: -1,
        });
      });

      // 2. Construir relações de dependência
      strategy.connections.forEach((conn) => {
        const sourceNode = nodes.get(conn.source);
        const targetNode = nodes.get(conn.target);

        if (sourceNode && targetNode) {
          targetNode.dependencies.push(conn.source);
          sourceNode.dependents.push(conn.target);
        }
      });

      // 3. Ordenação topológica
      const executionOrder = this.topologicalSort(nodes, strategy.connections);

      // 4. Atribuir ordem de execução
      executionOrder.forEach((blockId, index) => {
        const node = nodes.get(blockId);
        if (node) {
          node.order = index;
        }
      });

      // 5. Detectar ciclos
      if (this.hasCycle(nodes)) {
        errors.push('Estratégia contém ciclo (loop infinito)');
      }

      return {
        nodes,
        executionOrder,
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Erro ao construir grafo: ${error instanceof Error ? error.message : String(error)}`);
      return {
        nodes,
        executionOrder: [],
        isValid: false,
        errors,
      };
    }
  }

  /**
   * Ordenação topológica usando DFS (Kahn's algorithm)
   */
  private static topologicalSort(nodes: Map<string, ExecutionNode>, connections: StrategyConnection[]): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const visiting = new Set<string>();

    const visit = (nodeId: string): boolean => {
      if (visited.has(nodeId)) return true;
      if (visiting.has(nodeId)) return false; // Ciclo detectado

      visiting.add(nodeId);

      const node = nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visit(depId)) return false;
        }
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      result.push(nodeId);
      return true;
    };

    // Visitar todos os nós
    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (!visit(nodeId)) {
          return []; // Ciclo detectado
        }
      }
    }

    return result;
  }

  /**
   * Detecta ciclos no grafo
   */
  private static hasCycle(nodes: Map<string, ExecutionNode>): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            if (hasCycleDFS(depId)) return true;
          } else if (recursionStack.has(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Obtém a ordem de execução dos blocos
   */
  static getExecutionOrder(graph: ExecutionGraph): ExecutionNode[] {
    return graph.executionOrder
      .map((blockId) => graph.nodes.get(blockId))
      .filter((node): node is ExecutionNode => node !== undefined);
  }

  /**
   * Obtém blocos de um tipo específico
   */
  static getBlocksByType(graph: ExecutionGraph, type: string): ExecutionNode[] {
    return Array.from(graph.nodes.values()).filter((node) => node.block.type === type);
  }

  /**
   * Obtém o primeiro bloco (trigger)
   */
  static getStartBlocks(graph: ExecutionGraph): ExecutionNode[] {
    return Array.from(graph.nodes.values()).filter((node) => node.block.type === 'trigger');
  }

  /**
   * Obtém blocos de ação
   */
  static getActionBlocks(graph: ExecutionGraph): ExecutionNode[] {
    return Array.from(graph.nodes.values()).filter((node) => node.block.type === 'action');
  }

  /**
   * Obtém blocos de risco
   */
  static getRiskBlocks(graph: ExecutionGraph): ExecutionNode[] {
    return Array.from(graph.nodes.values()).filter((node) => node.block.type === 'risk');
  }

  /**
   * Obtém dependências de um bloco
   */
  static getDependencies(graph: ExecutionGraph, blockId: string): ExecutionNode[] {
    const node = graph.nodes.get(blockId);
    if (!node) return [];

    return node.dependencies
      .map((depId) => graph.nodes.get(depId))
      .filter((n): n is ExecutionNode => n !== undefined);
  }

  /**
   * Obtém dependentes de um bloco
   */
  static getDependents(graph: ExecutionGraph, blockId: string): ExecutionNode[] {
    const node = graph.nodes.get(blockId);
    if (!node) return [];

    return node.dependents
      .map((depId) => graph.nodes.get(depId))
      .filter((n): n is ExecutionNode => n !== undefined);
  }

  /**
   * Gera descrição textual da estratégia
   */
  static describeStrategy(graph: ExecutionGraph): string {
    const lines: string[] = [];

    const executionOrder = this.getExecutionOrder(graph);
    lines.push('Fluxo de Execução:');
    lines.push('');

    executionOrder.forEach((node, index) => {
      const indent = '  '.repeat(Math.max(0, node.block.type === 'trigger' ? 0 : 1));
      lines.push(`${index + 1}. ${indent}[${node.block.type.toUpperCase()}] ${node.block.label}`);
    });

    return lines.join('\n');
  }
}
