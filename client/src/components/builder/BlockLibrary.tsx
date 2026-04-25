import { Card } from '@/components/ui/card';
import { BLOCK_TEMPLATES, BLOCK_COLORS } from '@/types/builder';
import type { BlockType } from '@/types/builder';

interface BlockLibraryProps {
  onDragStart: (blockType: BlockType, blockId: string, label: string) => void;
}

export default function BlockLibrary({ onDragStart }: BlockLibraryProps) {
  const categories: Array<{ type: BlockType; title: string }> = [
    { type: 'trigger', title: '🔔 Triggers' },
    { type: 'indicator', title: '📊 Indicadores' },
    { type: 'operator', title: '⚙️ Operadores' },
    { type: 'action', title: '🎯 Ações' },
    { type: 'risk', title: '🛡️ Risco' },
  ];

  return (
    <div className="w-64 bg-slate-900/50 border-r border-slate-800 overflow-y-auto">
      <div className="p-4 space-y-6">
        {categories.map(({ type, title }) => (
          <div key={type}>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 px-2">{title}</h3>
            <div className="space-y-2">
              {BLOCK_TEMPLATES[type].map((block) => {
                const color = BLOCK_COLORS[type];
                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => onDragStart(type, block.id, block.label)}
                    className="p-3 rounded-lg cursor-move transition-all hover:scale-105"
                    style={{
                      backgroundColor: `${color}15`,
                      borderLeft: `3px solid ${color}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{block.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{block.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
