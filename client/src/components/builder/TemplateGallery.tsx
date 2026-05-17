import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download } from 'lucide-react';
import { strategyTemplates, StrategyTemplate } from '@/data/strategyTemplates';

interface TemplateGalleryProps {
  onSelectTemplate: (template: StrategyTemplate) => void;
}

const difficultyColors = {
  beginner: 'bg-green-600/20 border-green-600/50 text-green-300',
  intermediate: 'bg-yellow-600/20 border-yellow-600/50 text-yellow-300',
  advanced: 'bg-red-600/20 border-red-600/50 text-red-300',
};

const difficultyLabels = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export default function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Templates de Estratégias</h2>
        <p className="text-slate-400">
          Escolha um template pronto e customize conforme necessário
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategyTemplates.map((template) => (
          <Card
            key={template.id}
            className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{template.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{template.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{template.description}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 rounded bg-slate-800/50">
                <p className="text-xs text-slate-400">Dificuldade</p>
                <p
                  className={`text-xs font-semibold ${
                    difficultyColors[template.difficulty].split(' ')[2]
                  }`}
                >
                  {difficultyLabels[template.difficulty]}
                </p>
              </div>
              <div className="p-2 rounded bg-slate-800/50">
                <p className="text-xs text-slate-400">Taxa</p>
                <p className="text-xs font-semibold text-green-400">{template.winRate}%</p>
              </div>
              <div className="p-2 rounded bg-slate-800/50">
                <p className="text-xs text-slate-400">Blocos</p>
                <p className="text-xs font-semibold text-blue-400">{template.blocks.length}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-4">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-600"
              onClick={() => onSelectTemplate(template)}
            >
              <Download className="w-4 h-4 mr-2" />
              Usar Template
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
