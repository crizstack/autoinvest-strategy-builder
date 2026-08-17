import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, TrendingUp } from 'lucide-react';
import { StrategyTemplate } from '@/data/strategyTemplates';

interface TemplateModalProps {
  template: StrategyTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onImport: (template: StrategyTemplate) => void;
}

const difficultyColors = {
  beginner: 'text-[#76E821]',
  intermediate: 'text-yellow-400',
  advanced: 'text-red-400',
};

const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export default function TemplateModal({
  template,
  isOpen,
  onClose,
  onImport,
}: TemplateModalProps) {
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="p-8 bg-[#0B110B] border-[#235317]/30 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{template.icon}</span>
              <h2 className="text-3xl font-bold text-white">{template.name}</h2>
            </div>
            <p className="text-[#B8C2B8]">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#B8C2B8] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-[#141C14]/50 border border-[#235317]/45">
            <p className="text-xs text-[#B8C2B8] mb-1">Dificuldade</p>
            <p className={`font-semibold ${difficultyColors[template.difficulty]}`}>
              {difficultyLabels[template.difficulty]}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-[#141C14]/50 border border-[#235317]/45">
            <p className="text-xs text-[#B8C2B8] mb-1">Taxa de Acerto</p>
            <p className="text-[#76E821] font-semibold">{template.winRate}%</p>
          </div>
          <div className="p-4 rounded-lg bg-[#141C14]/50 border border-[#235317]/45">
            <p className="text-xs text-[#B8C2B8] mb-1">Blocos</p>
            <p className="text-[#76E821] font-semibold">{template.blocks.length}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <p className="text-sm text-[#B8C2B8] mb-2">Tags</p>
          <div className="flex flex-wrap gap-2">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-[#38A636]/20 border border-[#38A636]/50 text-[#76E821] text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="mb-6">
          <p className="text-sm text-[#B8C2B8] mb-2">Estrutura</p>
          <div className="p-4 rounded-lg bg-[#141C14]/50 border border-[#235317]/45">
            <div className="space-y-2">
              {template.blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center gap-2 text-sm text-[#B8C2B8]"
                >
                  <span className="w-2 h-2 rounded-full bg-[#76E821]"></span>
                  <span className="font-mono">{block.label}</span>
                  {block.data && Object.keys(block.data).length > 0 && (
                    <span className="text-xs text-[#6B756B]">
                      ({Object.keys(block.data).length} config)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 rounded-lg bg-[#38A636]/10 border border-[#38A636]/30 mb-6">
          <p className="text-sm text-[#76E821]">
            💡 Este template é um ponto de partida. Você pode editar todos os blocos e
            parâmetros após importar.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#235317]/45"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-[#38A636] hover:bg-[#4CB22F]"
            onClick={() => {
              onImport(template);
              onClose();
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Usar Template
          </Button>
        </div>
      </Card>
    </div>
  );
}
