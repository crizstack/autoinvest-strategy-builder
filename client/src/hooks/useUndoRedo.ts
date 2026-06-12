/**
 * Hook para Undo/Redo
 * Gerencia histórico de mudanças na estratégia
 */

import { useState, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
  description: string;
}

/**
 * Hook para gerenciar undo/redo
 */
export function useUndoRedo(initialNodes: Node[], initialEdges: Edge[]) {
  const [history, setHistory] = useState<HistoryState[]>([
    {
      nodes: initialNodes,
      edges: initialEdges,
      timestamp: Date.now(),
      description: 'Inicial',
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Adicionar estado ao histórico
  const addToHistory = useCallback(
    (nodes: Node[], edges: Edge[], description: string) => {
      // Remover histórico futuro se estamos em um ponto anterior
      const newHistory = history.slice(0, currentIndex + 1);

      // Adicionar novo estado
      newHistory.push({
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy
        edges: JSON.parse(JSON.stringify(edges)),
        timestamp: Date.now(),
        description,
      });

      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    },
    [history, currentIndex]
  );

  // Desfazer
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Refazer
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, history.length]);

  // Obter estado atual
  const getCurrentState = useCallback(() => {
    return history[currentIndex];
  }, [history, currentIndex]);

  // Verificar se pode desfazer/refazer
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Obter histórico para exibição
  const getHistory = useCallback(() => {
    return history.map((state, idx) => ({
      ...state,
      isCurrent: idx === currentIndex,
    }));
  }, [history, currentIndex]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    addToHistory,
    getCurrentState,
    getHistory,
    historyLength: history.length,
    currentIndex,
  };
}

/**
 * Hook para auto-save
 */
export function useAutoSave(
  nodes: Node[],
  edges: Edge[],
  onSave: (nodes: Node[], edges: Edge[]) => Promise<void>,
  intervalMs: number = 30000 // 30 segundos
) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save
  const autoSave = useCallback(async () => {
    if (hasUnsavedChanges) {
      setIsSaving(true);
      try {
        await onSave(nodes, edges);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Erro ao auto-salvar:', error);
      } finally {
        setIsSaving(false);
      }
    }
  }, [nodes, edges, onSave, hasUnsavedChanges]);

  // Setup auto-save interval
  // useEffect(() => {
  //   const interval = setInterval(autoSave, intervalMs);
  //   return () => clearInterval(interval);
  // }, [autoSave, intervalMs]);

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    autoSave,
  };
}

/**
 * Descrever mudança para histórico
 */
export function describeChange(
  previousNodes: Node[],
  previousEdges: Edge[],
  currentNodes: Node[],
  currentEdges: Edge[]
): string {
  const nodeCountDiff = currentNodes.length - previousNodes.length;
  const edgeCountDiff = currentEdges.length - previousEdges.length;

  if (nodeCountDiff > 0) {
    return `Adicionou ${nodeCountDiff} bloco(s)`;
  } else if (nodeCountDiff < 0) {
    return `Removeu ${Math.abs(nodeCountDiff)} bloco(s)`;
  } else if (edgeCountDiff > 0) {
    return `Adicionou ${edgeCountDiff} conexão(ões)`;
  } else if (edgeCountDiff < 0) {
    return `Removeu ${Math.abs(edgeCountDiff)} conexão(ões)`;
  } else {
    // Detectar mudança de parâmetro
    for (let i = 0; i < currentNodes.length; i++) {
      const prev = previousNodes[i];
      const curr = currentNodes[i];
      if (prev && curr && JSON.stringify(prev.data) !== JSON.stringify(curr.data)) {
        return `Modificou parâmetro de "${curr.data?.label}"`;
      }
    }
  }

  return 'Mudança';
}
