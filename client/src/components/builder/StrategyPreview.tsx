import { Card } from '@/components/ui/card';
import { Node, Edge } from 'reactflow';
import { BLOCK_DESCRIPTIONS } from '@/types/builder';

interface StrategyPreviewProps {
  nodes: Node[];
  edges: Edge[];
  selectedAsset: string;
  strategyName: string;
}

export default function StrategyPreview({
  nodes,
  edges,
  selectedAsset,
  strategyName,
}: StrategyPreviewProps) {
  // Construir fluxo visual da estratégia
  const buildFlowDescription = (): string[] => {
    if (nodes.length === 0) return [];

    const descriptions: string[] = [];

    // Encontrar nós por tipo
    const triggers = nodes.filter((n) => n.data.type === 'trigger');
    const indicators = nodes.filter((n) => n.data.type === 'indicator');
    const actions = nodes.filter((n) => n.data.type === 'action');
    const risks = nodes.filter((n) => n.data.type === 'risk');

    // Descrever triggers
    if (triggers.length > 0) {
      descriptions.push(`📌 INÍCIO: ${triggers.map((t) => t.data.label).join(' + ')}`);
    }

    // Descrever indicadores
    if (indicators.length > 0) {
      descriptions.push(`📊 CONDIÇÕES: ${indicators.map((i) => i.data.label).join(' + ')}`);
    }

    // Descrever ações
    if (actions.length > 0) {
      descriptions.push(`🎯 AÇÃO: ${actions.map((a) => a.data.label).join(' ou ')}`);
    }

    // Descrever riscos
    if (risks.length > 0) {
      descriptions.push(`🛡️ PROTEÇÃO: ${risks.map((r) => r.data.label).join(' + ')}`);
    }

    return descriptions;
  };

  const flowDescription = buildFlowDescription();

  // Contar tipos de blocos
  const blockStats = {
    triggers: nodes.filter((n) => n.data.type === 'trigger').length,
    indicators: nodes.filter((n) => n.data.type === 'indicator').length,
    actions: nodes.filter((n) => n.data.type === 'action').length,
    risks: nodes.filter((n) => n.data.type === 'risk').length,
  };

  return (
    <div className="w-96 bg-slate-900/50 border-l border-slate-800 overflow-y-auto p-6 space-y-6">
      {/* Strategy Name */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">{strategyName}</h2>
        <p className="text-sm text-slate-400">Ativo: <span className="text-green-400 font-semibold">{selectedAsset}</span></p>
      </div>

      {/* Flow Description */}
      {flowDescription.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Fluxo da Estratégia</h3>
          <div className="space-y-2">
            {flowDescription.map((desc, idx) => (
              <div key={idx} className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
          <p className="text-sm text-slate-500 italic">Adicione blocos para ver o preview</p>
        </div>
      )}

      {/* Block Statistics */}
      {nodes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Composição</h3>
          <div className="grid grid-cols-2 gap-2">
            {blockStats.triggers > 0 && (
              <div className="p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                <p className="text-xs text-blue-400">Triggers</p>
                <p className="text-lg font-semibold text-blue-400">{blockStats.triggers}</p>
              </div>
            )}
            {blockStats.indicators > 0 && (
              <div className="p-3 bg-purple-600/10 border border-purple-600/30 rounded-lg">
                <p className="text-xs text-purple-400">Indicadores</p>
                <p className="text-lg font-semibold text-purple-400">{blockStats.indicators}</p>
              </div>
            )}
            {blockStats.actions > 0 && (
              <div className="p-3 bg-green-600/10 border border-green-600/30 rounded-lg">
                <p className="text-xs text-green-400">Ações</p>
                <p className="text-lg font-semibold text-green-400">{blockStats.actions}</p>
              </div>
            )}
            {blockStats.risks > 0 && (
              <div className="p-3 bg-amber-600/10 border border-amber-600/30 rounded-lg">
                <p className="text-xs text-amber-400">Proteções</p>
                <p className="text-lg font-semibold text-amber-400">{blockStats.risks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Info */}
      {edges.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Conexões</h3>
          <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <p className="text-sm text-slate-300">
              {edges.length} conexão{edges.length !== 1 ? 's' : ''} estabelecida{edges.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-3 rounded-lg bg-green-600/10 border border-green-600/20">
        <p className="text-xs text-green-400 mb-2">💡 Dicas:</p>
        <ul className="text-xs text-green-400/80 space-y-1">
          <li>• Comece com um Trigger</li>
          <li>• Adicione Indicadores para refinar</li>
          <li>• Termine com uma Ação</li>
          <li>• Use Proteções para limitar riscos</li>
        </ul>
      </div>
    </div>
  );
}
