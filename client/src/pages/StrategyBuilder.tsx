import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Plus, Trash2, Save, X, ChevronDown, Play, Zap, Target, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface Block {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'risk';
  title: string;
  config: Record<string, any>;
}

interface Connection {
  from: string;
  to: string;
}

const BLOCK_TEMPLATES = {
  trigger: [
    { id: 'ma_cross', title: 'Cruzamento de Médias', icon: '📊' },
    { id: 'rsi_level', title: 'RSI em Nível', icon: '📈' },
    { id: 'macd_signal', title: 'MACD Signal', icon: '📉' },
    { id: 'price_level', title: 'Preço em Nível', icon: '💰' },
  ],
  condition: [
    { id: 'and_gate', title: 'E (AND)', icon: '🔗' },
    { id: 'or_gate', title: 'OU (OR)', icon: '🔀' },
    { id: 'comparison', title: 'Comparação', icon: '⚖️' },
  ],
  action: [
    { id: 'buy_market', title: 'Compra a Mercado', icon: '🟢' },
    { id: 'sell_market', title: 'Venda a Mercado', icon: '🔴' },
    { id: 'buy_limit', title: 'Compra Limitada', icon: '🟡' },
    { id: 'sell_limit', title: 'Venda Limitada', icon: '🟠' },
  ],
  risk: [
    { id: 'stop_loss', title: 'Stop Loss', icon: '🛑' },
    { id: 'take_profit', title: 'Take Profit', icon: '✅' },
    { id: 'trailing_stop', title: 'Trailing Stop', icon: '📍' },
  ],
};

export default function StrategyBuilder() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<'trigger' | 'condition' | 'action' | 'risk' | null>(null);
  const [strategyName, setStrategyName] = useState('Nova Estratégia');

  const addBlock = (type: 'trigger' | 'condition' | 'action' | 'risk', template: any) => {
    const newBlock: Block = {
      id: `${type}_${Date.now()}`,
      type,
      title: template.title,
      config: {},
    };
    setBlocks([...blocks, newBlock]);
    setShowBlockMenu(null);
    toast.success(`${template.title} adicionado!`);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
    setSelectedBlock(null);
  };

  const handleSaveStrategy = () => {
    if (blocks.length === 0) {
      toast.error('Adicione pelo menos um bloco à estratégia');
      return;
    }
    toast.success('Estratégia salva com sucesso!');
    setLocation('/estrategias');
  };

  const blockTypeColors = {
    trigger: 'from-blue-600/20 to-blue-600/5 border-blue-600/30',
    condition: 'from-purple-600/20 to-purple-600/5 border-purple-600/30',
    action: 'from-green-600/20 to-green-600/5 border-green-600/30',
    risk: 'from-red-600/20 to-red-600/5 border-red-600/30',
  };

  const blockTypeIcons = {
    trigger: <Zap className="w-5 h-5 text-blue-400" />,
    condition: <ChevronDown className="w-5 h-5 text-purple-400" />,
    action: <Play className="w-5 h-5 text-green-400" />,
    risk: <AlertTriangle className="w-5 h-5 text-red-400" />,
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-2 font-semibold"
            />
            <span className="text-sm text-slate-400">{blocks.length} blocos</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-700"
              onClick={() => setLocation('/estrategias')}
            >
              Cancelar
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              onClick={handleSaveStrategy}
            >
              <Save className="w-5 h-5" />
              Salvar Estratégia
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 overflow-auto relative">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(0, 102, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 102, 255, 0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
          </div>

          {/* Blocks */}
          <div className="relative z-10 space-y-4">
            {blocks.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
                  <p className="text-slate-400 mb-4">Adicione blocos para construir sua estratégia</p>
                  <p className="text-sm text-slate-500">Use o painel à direita para adicionar blocos</p>
                </div>
              </div>
            ) : (
              blocks.map((block, index) => (
                <div key={block.id} className="flex items-center gap-4">
                  {/* Block */}
                  <Card
                    className={`flex-1 p-4 bg-gradient-to-br ${blockTypeColors[block.type]} border cursor-pointer transition-all ${
                      selectedBlock === block.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedBlock(block.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {blockTypeIcons[block.type]}
                        <div>
                          <p className="font-semibold text-white">{block.title}</p>
                          <p className="text-xs text-slate-400 capitalize">{block.type}</p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(block.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>

                  {/* Arrow */}
                  {index < blocks.length - 1 && (
                    <div className="text-slate-500 text-2xl">↓</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm overflow-auto">
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-6">Adicionar Blocos</h3>

            {/* Block Categories */}
            {Object.entries(BLOCK_TEMPLATES).map(([category, templates]) => (
              <div key={category}>
                <button
                  onClick={() => setShowBlockMenu(showBlockMenu === category ? null : (category as any))}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors mb-2"
                >
                  <span className="font-medium text-white capitalize">{category}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      showBlockMenu === category ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showBlockMenu === category && (
                  <div className="space-y-2 mb-4 pl-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => addBlock(category as any, template)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left"
                      >
                        <span className="text-lg">{template.icon}</span>
                        <span className="text-sm text-slate-300">{template.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Block Details */}
            {selectedBlock && (
              <div className="mt-8 pt-6 border-t border-slate-800">
                <h4 className="font-semibold text-white mb-4">Configuração do Bloco</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Parâmetro 1</label>
                    <input
                      type="text"
                      placeholder="Valor"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-2">Parâmetro 2</label>
                    <input
                      type="text"
                      placeholder="Valor"
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="mt-8 p-4 rounded-lg bg-blue-600/10 border border-blue-600/30">
              <p className="text-xs text-blue-400">
                💡 Dica: Comece com um Trigger, adicione Condições, defina Ações e configure Riscos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
