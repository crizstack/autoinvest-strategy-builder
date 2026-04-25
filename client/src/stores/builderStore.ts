import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';

export interface BuilderState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  strategyName: string;
  strategyDescription: string;

  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  setStrategyName: (name: string) => void;
  setStrategyDescription: (description: string) => void;
  addNode: (node: Node) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, data: any) => void;
  addEdge: (edge: Edge) => void;
  removeEdge: (sourceId: string, targetId: string) => void;
  reset: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  strategyName: 'Nova Estratégia',
  strategyDescription: '',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setStrategyName: (name) => set({ strategyName: name }),
  setStrategyDescription: (description) => set({ strategyDescription: description }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  updateNode: (id, data) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
    })),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),

  removeEdge: (sourceId, targetId) =>
    set((state) => ({
      edges: state.edges.filter((e) => !(e.source === sourceId && e.target === targetId)),
    })),

  reset: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      strategyName: 'Nova Estratégia',
      strategyDescription: '',
    }),
}));
