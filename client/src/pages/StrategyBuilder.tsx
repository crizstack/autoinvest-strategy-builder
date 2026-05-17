import { useState, useRef, useCallback } from 'react';
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
import { ArrowLeft, Save, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import BlockLibrary from '@/components/builder/BlockLibrary';
import BlockNode from '@/components/builder/BlockNode';
import ConfigPanel from '@/components/builder/ConfigPanel';
import StrategyPreview from '@/components/builder/StrategyPreview';
import TemplateModal from '@/components/builder/TemplateModal';
import TemplateGallery from '@/components/builder/TemplateGallery';
import { trpc } from '@/lib/trpc';
import type { BlockType } from '@/types/builder';
import { useBuilderStore } from '@/stores/builderStore';
import type { StrategyTemplate } from '@/data/strategyTemplates';

const nodeTypes = {
  block: BlockNode,
};

// Ativos B3 principais
const MAIN_ASSETS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'BBAS3', 'WEGE3', 'MGLU3'];

export default function StrategyBuilder() {
  const [, setLocation] = useLocation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [strategyName, setStrategyName] = useState('Nova Estratégia');
  const [strategyDescription, setStrategyDescription] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
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

  const handleImportTemplate = (template: StrategyTemplate) => {
    setStrategyName(template.name);
    setStrategyDescription(template.description);
    
    const templateNodes = template.blocks.map((block: any) => ({
      id: block.id,
      data: {
        label: block.label,
        type: block.type,
        subType: block.type,
        params: block.data || {},
      },
      position: block.position,
      type: 'block',
    }));
    
    setNodes(templateNodes);
    setEdges(template.connections);
    setShowTemplates(false);
    toast.success(`Template "${template.name}" importado com sucesso!`);
  };

  const validateStrategy = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!selectedAsset) {
      errors.push('Selecione um ativo para a estratégia');
    }

    if (nodes.length === 0) {
      errors.push('Adicione pelo menos um bloco');
    }

    const hasTrigger = nodes.some((n) => n.data.type === 'trigger');
    if (!hasTrigger) {
      errors.push('Estratégia deve ter um Trigger (início)');
    }

    const hasAction = nodes.some((n) => n.data.type === 'action');
    if (!hasAction) {
      errors.push('Estratégia deve ter uma Ação (compra/venda)');
    }

    // Validar que não há blocos isolados
    const connectedNodeIds = new Set<string>();
    edges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const isolatedNodes = nodes.filter((n) => !connectedNodeIds.has(n.id));
    if (isolatedNodes.length > 0) {
      errors.push(`${isolatedNodes.length} bloco(s) desconectado(s) - conecte todos os blocos`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const handleSave = async () => {
    const validation = validateStrategy();

    if (!validation.valid) {
      validation.errors.forEach((error) => {
        toast.error(error);
      });
      return;
    }

    setIsSaving(true);

    try {
      setStoreNodes(nodes);
      setStoreEdges(edges);

      await createStrategyMutation.mutateAsync({
        name: strategyName,
        asset: selectedAsset,
        description: strategyDescription,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const validation = validateStrategy();

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar - Block Library */}
      <BlockLibrary onDragStart={handleDragStart} />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-900/50 border-b border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation('/estrategias')}
                className="p-2 hover:bg-slate-800 rounded transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div className="flex-1">
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
              <Button
                onClick={() => setShowTemplates(!showTemplates)}
                variant="outline"
                className="flex items-center gap-2"
              >
                📋 Templates
              </Button>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !validation.valid}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {/* Asset Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-slate-300">Ativo:</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedAsset
                  ? 'bg-green-600/20 border-green-600/50 text-green-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <option value="">Selecione um ativo...</option>
              {MAIN_ASSETS.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
            {selectedAsset && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                {selectedAsset} selecionado
              </div>
            )}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex gap-4 overflow-hidden">
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
              <MiniMap
                nodeColor={(node) => {
                  switch (node.data?.type) {
                    case 'trigger':
                      return '#3b82f6';
                    case 'indicator':
                      return '#a855f7';
                    case 'action':
                      return '#10b981';
                    case 'risk':
                      return '#ef4444';
                    default:
                      return '#64748b';
                  }
                }}
                maskColor="rgba(0, 0, 0, 0.3)"
                style={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                }}
              />
            </ReactFlow>

            {/* Empty State with Guide */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center max-w-md">
                  <div className="mb-4 text-6xl">🏗️</div>
                  <h2 className="text-xl font-semibold text-white mb-2">Comece sua estratégia</h2>
                  <p className="text-slate-400 mb-4">
                    1. Selecione um ativo no topo
                  </p>
                  <p className="text-slate-400 mb-4">
                    2. Arraste um <span className="text-blue-400 font-semibold">Trigger</span> para iniciar
                  </p>
                  <p className="text-slate-400 mb-4">
                    3. Adicione <span className="text-purple-400 font-semibold">Indicadores</span> e <span className="text-green-400 font-semibold">Ações</span>
                  </p>
                  <p className="text-slate-500 text-sm italic">
                    Exemplo: Preço acima de X → Comprar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Config or Preview */}
          {showPreview ? (
            <StrategyPreview
              nodes={nodes}
              edges={edges}
              selectedAsset={selectedAsset}
              strategyName={strategyName}
            />
          ) : (
            <ConfigPanel selectedNode={selectedNode || null} />
          )}
        </div>

        {/* Validation Messages */}
        <div className="bg-slate-900/50 border-t border-slate-800 p-4">
          <div className="space-y-2">
            {/* Asset validation */}
            {!selectedAsset && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Selecione um ativo para continuar
              </div>
            )}

            {/* Trigger validation */}
            {selectedAsset && !nodes.some((n) => n.data.type === 'trigger') && nodes.length > 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Adicione um Trigger para iniciar a estratégia
              </div>
            )}

            {/* Action validation */}
            {selectedAsset && !nodes.some((n) => n.data.type === 'action') && nodes.length > 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                Adicione uma Ação (Comprar/Vender) para executar
              </div>
            )}

            {/* Isolated nodes validation */}
            {nodes.length > 0 && (() => {
              const connectedNodeIds = new Set<string>();
              edges.forEach((edge) => {
                connectedNodeIds.add(edge.source);
                connectedNodeIds.add(edge.target);
              });
              const isolatedNodes = nodes.filter((n) => !connectedNodeIds.has(n.id));
              return isolatedNodes.length > 0 ? (
                <div className="flex items-center gap-2 text-amber-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {isolatedNodes.length} bloco(s) desconectado(s) - conecte todos os blocos
                </div>
              ) : null;
            })()}

            {/* Success state */}
            {validation.valid && nodes.length > 0 && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Estratégia válida! Pronto para salvar
              </div>
            )}

            {/* Stats */}
            {nodes.length > 0 && (
              <div className="text-slate-400 text-xs mt-2">
                {nodes.length} bloco{nodes.length !== 1 ? 's' : ''} • {edges.length} conexão{edges.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Templates de Estratégias</h2>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-slate-400 hover:text-white"
                >
                  X
                </button>
              </div>
              <TemplateGallery onSelectTemplate={(template) => {
                setSelectedTemplate(template);
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Template Detail Modal */}
      <TemplateModal
        template={selectedTemplate}
        isOpen={selectedTemplate !== null}
        onClose={() => setSelectedTemplate(null)}
        onImport={handleImportTemplate}
      />
    </div>
  );
}
