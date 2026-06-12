/**
 * Hook para Validação em Tempo Real de Estratégias
 * Integra GraphValidator com feedback visual no frontend
 */

import { useEffect, useState, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import { trpc } from '@/lib/trpc';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  invalidNodeIds: string[];
  orphanedNodeIds: string[];
}

/**
 * Validação local rápida (sem servidor)
 */
function validateLocally(nodes: Node[], edges: Edge[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const invalidNodeIds: string[] = [];
  const orphanedNodeIds: string[] = [];

  // 1. Verificar se há pelo menos um bloco
  if (nodes.length === 0) {
    errors.push('Estratégia deve ter pelo menos um bloco');
    return { isValid: false, errors, warnings, invalidNodeIds, orphanedNodeIds };
  }

  // 2. Verificar se há trigger
  const hasTrigger = nodes.some(n => n.data?.type === 'trigger');
  if (!hasTrigger) {
    errors.push('Estratégia deve começar com um Trigger');
    invalidNodeIds.push(...nodes.filter(n => n.data?.type !== 'trigger').map(n => n.id));
  }

  // 3. Verificar se há ação
  const hasAction = nodes.some(n => n.data?.type === 'action');
  if (!hasAction) {
    errors.push('Estratégia deve ter pelo menos uma Ação (Compra/Venda)');
  }

  // 4. Detectar nós órfãos (sem conexões)
  const connectedNodeIds = new Set<string>();
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const orphans = nodes.filter(n => !connectedNodeIds.has(n.id));
  if (orphans.length > 0) {
    orphanedNodeIds.push(...orphans.map(n => n.id));
    warnings.push(`${orphans.length} bloco(s) desconectado(s): ${orphans.map(n => n.data?.label).join(', ')}`);
  }

  // 5. Validar parâmetros de blocos
  for (const node of nodes) {
    const params = node.data?.params || {};
    const type = node.data?.type;
    const subType = node.data?.subType;

    // Validar parâmetros obrigatórios
    if (type === 'trigger' && subType === 'price_above') {
      if (!params.value || params.value <= 0) {
        errors.push(`Trigger "Preço acima de X" (${node.data?.label}) precisa de um valor válido`);
        invalidNodeIds.push(node.id);
      }
    }

    if (type === 'indicator' && subType === 'rsi') {
      if (!params.period || params.period < 2) {
        errors.push(`Indicador RSI (${node.data?.label}) precisa de período válido (≥ 2)`);
        invalidNodeIds.push(node.id);
      }
      if (!params.value || params.value < 0 || params.value > 100) {
        errors.push(`Indicador RSI (${node.data?.label}) precisa de valor entre 0-100`);
        invalidNodeIds.push(node.id);
      }
    }

    if (type === 'risk' && (subType === 'stop_loss' || subType === 'take_profit')) {
      if (!params.percentage || params.percentage <= 0) {
        errors.push(`Proteção ${subType} (${node.data?.label}) precisa de percentual válido`);
        invalidNodeIds.push(node.id);
      }
    }
  }

  // 6. Validar fluxo lógico
  // Não deve haver conexão de ação para outro bloco
  const actionNodes = nodes.filter(n => n.data?.type === 'action');
  for (const actionNode of actionNodes) {
    const outgoingEdges = edges.filter(e => e.source === actionNode.id);
    if (outgoingEdges.length > 0) {
      warnings.push(`Ação "${actionNode.data?.label}" não deve ter conexões de saída`);
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    invalidNodeIds,
    orphanedNodeIds,
  };
}

/**
 * Hook para validação em tempo real
 */
export function useStrategyValidation(nodes: Node[], edges: Edge[]) {
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    invalidNodeIds: [],
    orphanedNodeIds: [],
  });

  const [isValidating, setIsValidating] = useState(false);

  // Validar localmente em tempo real
  const validateLocal = useCallback(() => {
    const result = validateLocally(nodes, edges);
    setValidation(result);
  }, [nodes, edges]);

  // Validar no servidor (mais completo)
  const validateRemote = useCallback(async (blocks: any[], connections: any[]) => {
    setIsValidating(true);
    try {
      // Aqui você chamaria um endpoint do servidor
      // const result = await trpc.strategies.validate.query({ blocks, connections });
      // setValidation(result);
    } catch (error) {
      console.error('Erro ao validar estratégia:', error);
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Validar sempre que nodes ou edges mudam
  useEffect(() => {
    validateLocal();
  }, [validateLocal]);

  return {
    validation,
    isValidating,
    validateLocal,
    validateRemote,
    canSave: validation.isValid,
    hasWarnings: validation.warnings.length > 0,
    hasErrors: validation.errors.length > 0,
  };
}

/**
 * Converter nodes e edges para formato de estratégia
 */
export function nodesToStrategyBlocks(nodes: Node[]) {
  return nodes.map(node => ({
    id: node.id,
    type: node.data?.type,
    subType: node.data?.subType,
    label: node.data?.label,
    params: node.data?.params || {},
    position: node.position,
  }));
}

/**
 * Converter edges para formato de estratégia
 */
export function edgesToStrategyConnections(edges: Edge[]) {
  return edges.map(edge => ({
    source: edge.source,
    target: edge.target,
  }));
}
