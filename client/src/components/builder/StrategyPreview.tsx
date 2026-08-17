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
    <div className="w-96 bg-[#0B110B]/50 border-l border-[#235317]/30 overflow-y-auto p-6 space-y-6">
      {/* Strategy Name */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">{strategyName}</h2>
        <p className="text-sm text-[#B8C2B8]">Ativo: <span className="text-[#76E821] font-semibold">{selectedAsset}</span></p>
      </div>

      {/* Flow Description */}
      {flowDescription.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#B8C2B8]">Fluxo da Estratégia</h3>
          <div className="space-y-2">
            {flowDescription.map((desc, idx) => (
              <div key={idx} className="p-3 bg-[#050805]/50 rounded-lg border border-[#235317]/30">
                <p className="text-sm text-[#B8C2B8]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-[#050805]/50 rounded-lg border border-[#235317]/25">
          <p className="text-sm text-[#6B756B] italic">Adicione blocos para ver o preview</p>
        </div>
      )}

      {/* Block Statistics */}
      {nodes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#B8C2B8]">Composição</h3>
          <div className="grid grid-cols-2 gap-2">
            {blockStats.triggers > 0 && (
              <div className="p-3 bg-[#38A636]/10 border border-[#38A636]/30 rounded-lg">
                <p className="text-xs text-[#76E821]">Triggers</p>
                <p className="text-lg font-semibold text-[#76E821]">{blockStats.triggers}</p>
              </div>
            )}
            {blockStats.indicators > 0 && (
              <div className="p-3 bg-[#235317]/10 border border-[#38A636]/30 rounded-lg">
                <p className="text-xs text-[#76E821]">Indicadores</p>
                <p className="text-lg font-semibold text-[#76E821]">{blockStats.indicators}</p>
              </div>
            )}
            {blockStats.actions > 0 && (
              <div className="p-3 bg-[#38A636]/10 border border-[#38A636]/30 rounded-lg">
                <p className="text-xs text-[#76E821]">Ações</p>
                <p className="text-lg font-semibold text-[#76E821]">{blockStats.actions}</p>
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
          <h3 className="text-sm font-semibold text-[#B8C2B8]">Conexões</h3>
          <div className="p-3 bg-[#050805]/50 rounded-lg border border-[#235317]/30">
            <p className="text-sm text-[#B8C2B8]">
              {edges.length} conexão{edges.length !== 1 ? 's' : ''} estabelecida{edges.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="p-3 rounded-lg bg-[#38A636]/10 border border-[#38A636]/20">
        <p className="text-xs text-[#76E821] mb-2">💡 Dicas:</p>
        <ul className="text-xs text-[#76E821]/80 space-y-1">
          <li>• Comece com um Trigger</li>
          <li>• Adicione Indicadores para refinar</li>
          <li>• Termine com uma Ação</li>
          <li>• Use Proteções para limitar riscos</li>
        </ul>
      </div>
    </div>
  );
}
