import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  Connection,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import BlockLibrary from '@/components/builder/BlockLibrary';
import BlockNode from '@/components/builder/BlockNode';
import ConfigPanel from '@/components/builder/ConfigPanel';
import { trpc } from '@/lib/trpc';
import type { BlockType } from '@/types/builder';
import { useBuilderStore } from '@/stores/builderStore';

const nodeTypes = {
  block: BlockNode,
};

export default function StrategyBuilder() {
  const [, setLocation] = useLocation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [strategyName, setStrategyName] = useState('Nova Estratégia');
  const [strategyDescription, setStrategyDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const reactFlowWrapper = useRef(null);
  const { setNodes: setStoreNodes, setEdges: setStoreEdges } = useBuilderStore();

  const createStrategyMutation = trpc.strategies.create.useMutation<any>({
    onSuccess: () => {
      toast.success('Estratégia salva com sucesso!');
      setTimeout(() => {
        setLocation('/estrategias');
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao salvar estratégia');
    },
  });

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  const handleDragStart = (blockType: BlockType, blockId: string, label: string) => {
    const dragData = { blockType, blockId, label };
    // @ts-ignore
    window.dragData = dragData;
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();

    if (!reactFlowWrapper.current) return;

    // @ts-ignore
    const dragData = window.dragData;
    if (!dragData) return;

    const { blockType, blockId, label } = dragData;
    const rect = (reactFlowWrapper.current as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left - 100;
    const y = event.clientY - rect.top - 30;

    const newNode: Node = {
      id: `${blockType}-${Date.now()}`,
      data: {
        label,
        type: blockType,
        subType: blockId,
        params: {},
      },
      position: { x, y },
      type: 'block',
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const validateStrategy = () => {
    if (nodes.length === 0) {
      toast.error('Adicione pelo menos um bloco');
      return false;
    }

    const hasTrigger = nodes.some((n) => n.data.type === 'trigger');
    const hasAction = nodes.some((n) => n.data.type === 'action');

    if (!hasTrigger) {
      toast.error('Estratégia deve ter um Trigger');
      return false;
    }

    if (!hasAction) {
      toast.error('Estratégia deve ter uma Ação');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateStrategy()) return;

    setIsSaving(true);

    try {
      // Store strategy in Zustand
      setStoreNodes(nodes);
      setStoreEdges(edges);
      
      await createStrategyMutation.mutateAsync({
        name: strategyName,
        asset: 'PETR4',
        description: strategyDescription,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar - Block Library */}
      <BlockLibrary onDragStart={handleDragStart} />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900/50 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/estrategias')}
              className="p-2 hover:bg-slate-800 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <Input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white font-semibold text-lg mb-1"
                placeholder="Nome da estratégia"
              />
              <Input
                type="text"
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-400 text-sm"
                placeholder="Descrição (opcional)"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-400">
              {nodes.length} bloco{nodes.length !== 1 ? 's' : ''} • {edges.length} conexão{edges.length !== 1 ? 's' : ''}
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Estratégia'}
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex gap-4">
          {/* React Flow Canvas */}
          <div
            ref={reactFlowWrapper}
            className="flex-1 relative"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              fitView
            >
              <Background color="#334155" gap={16} />
              <Controls />
              <MiniMap />
            </ReactFlow>

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-slate-400 text-lg mb-2">Arraste blocos do painel esquerdo</p>
                  <p className="text-slate-500 text-sm">para começar a construir sua estratégia</p>
                </div>
              </div>
            )}
          </div>

          {/* Config Panel */}
          <ConfigPanel selectedNode={selectedNode || null} />
        </div>

        {/* Validation Messages */}
        {nodes.length > 0 && (
          <div className="bg-slate-900/50 border-t border-slate-800 p-4 space-y-2">
            {!nodes.some((n) => n.data.type === 'trigger') && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Adicione um Trigger para iniciar a estratégia
              </div>
            )}
            {!nodes.some((n) => n.data.type === 'action') && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Adicione uma Ação para executar a estratégia
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
