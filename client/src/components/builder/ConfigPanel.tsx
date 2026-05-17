import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBuilderStore } from '@/stores/builderStore';
import type { Node } from 'reactflow';

interface ConfigPanelProps {
  selectedNode: Node | null;
}

export default function ConfigPanel({ selectedNode }: ConfigPanelProps) {
  const { updateNode } = useBuilderStore();

  if (!selectedNode) {
    return (
      <div className="w-80 bg-slate-900/50 border-l border-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Selecione um bloco para configurar</p>
        </div>
      </div>
    );
  }

  const handleParamChange = (key: string, value: any) => {
    updateNode(selectedNode.id, {
      params: {
        ...(selectedNode.data?.params || {}),
        [key]: value,
      },
    });
  };

  return (
    <div className="w-80 bg-slate-900/50 border-l border-slate-800 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Block Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{selectedNode.data?.label}</h3>
          <p className="text-sm text-slate-400">ID: {selectedNode.id}</p>
        </div>

        {/* Parameters */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300">Configurações</h4>

          {selectedNode.data?.type === 'trigger' && (selectedNode.data?.subType === 'price_above' || selectedNode.data?.subType === 'price_below') && (
            <>
              <div>
                <Label className="text-slate-300 text-sm">Condição</Label>
                <select
                  value={selectedNode.data?.params?.condition || 'above'}
                  onChange={(e) => handleParamChange('condition', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded text-sm mt-2"
                >
                  <option value="above">Acima de</option>
                  <option value="below">Abaixo de</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Valor (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 100.50"
                  value={selectedNode.data?.params?.value || ''}
                  onChange={(e) => handleParamChange('value', parseFloat(e.target.value))}
                  className="bg-slate-950 border-slate-800 text-white mt-2"
                />
              </div>
            </>
          )}

          {selectedNode.data?.type === 'indicator' && selectedNode.data?.subType === 'rsi' && (
            <>
              <div>
                <Label className="text-slate-300 text-sm">Período</Label>
                <Input
                  type="number"
                  placeholder="Ex: 14"
                  value={selectedNode.data?.params?.period || 14}
                  onChange={(e) => handleParamChange('period', parseInt(e.target.value))}
                  className="bg-slate-950 border-slate-800 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Condição</Label>
                <select
                  value={selectedNode.data?.params?.condition || 'above'}
                  onChange={(e) => handleParamChange('condition', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-white rounded text-sm mt-2"
                >
                  <option value="above">Acima de</option>
                  <option value="below">Abaixo de</option>
                </select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Valor</Label>
                <Input
                  type="number"
                  placeholder="Ex: 70"
                  value={selectedNode.data?.params?.value || ''}
                  onChange={(e) => handleParamChange('value', parseFloat(e.target.value))}
                  className="bg-slate-950 border-slate-800 text-white mt-2"
                />
              </div>
            </>
          )}

          {selectedNode.data?.type === 'action' && selectedNode.data?.subType === 'buy' && (
            <>
              <div>
                <Label className="text-slate-300 text-sm">Valor da Ordem (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1000"
                  value={selectedNode.data?.params?.orderValue || ''}
                  onChange={(e) => handleParamChange('orderValue', parseFloat(e.target.value))}
                  className="bg-slate-950 border-slate-800 text-white mt-2"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Percentual do Capital (%)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 10"
                  value={selectedNode.data?.params?.percentCapital || ''}
                  onChange={(e) => handleParamChange('percentCapital', parseFloat(e.target.value))}
                  className="bg-slate-950 border-slate-800 text-white mt-2"
                />
              </div>
            </>
          )}

          {selectedNode.data?.type === 'risk' && selectedNode.data?.subType === 'stop_loss' && (
            <>
              <div>
                <Label className="text-slate-300 text-sm">Stop Loss (%)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 2"
                  value={selectedNode.data?.params?.percentage || ''}
                  onChange={(e) => handleParamChange('percentage', parseFloat(e.target.value))}
                  className="bg-slate-950 border-slate-800 text-white mt-2"
                />
              </div>
            </>
          )}

          {selectedNode.data?.type === 'risk' && selectedNode.data?.subType === 'take_profit' && (
            <>
              <div>
                <Label className="text-slate-300 text-sm">Take Profit (%)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 5"
                  value={selectedNode.data?.params?.percentage || ''}
                  onChange={(e) => handleParamChange('percentage', parseFloat(e.target.value))}
                  className="bg-slate-950 border-slate-800 text-white mt-2"
                />
              </div>
            </>
          )}

          {!selectedNode.data?.params || Object.keys(selectedNode.data?.params || {}).length === 0 && (
            <p className="text-sm text-slate-500 italic">Nenhuma configuração disponível para este bloco</p>
          )}
        </div>

        {/* Help */}
        <div className="p-3 rounded-lg bg-blue-600/10 border border-blue-600/20">
          <p className="text-xs text-blue-400 font-semibold mb-2">💡 Como usar este bloco:</p>
          <ul className="text-xs text-blue-400/80 space-y-1">
            <li>• Configure os parâmetros acima</li>
            <li>• Conecte a outros blocos</li>
            <li>• Use o preview para ver o fluxo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
