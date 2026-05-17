import { Handle, Position } from 'reactflow';
import { Trash2 } from 'lucide-react';
import { BLOCK_COLORS, BLOCK_DESCRIPTIONS } from '@/types/builder';
import { useBuilderStore } from '@/stores/builderStore';

export interface BlockNodeData {
  label: string;
  type: 'trigger' | 'indicator' | 'operator' | 'action' | 'risk';
  subType: string;
  params?: Record<string, any>;
}

export default function BlockNode({ data, id, isConnecting, selected }: any) {
  const { removeNode } = useBuilderStore();
  const blockType = data.type as keyof typeof BLOCK_COLORS;
  const color = BLOCK_COLORS[blockType] || '#6b7280';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const getBlockIcon = () => {
    const icons: Record<string, string> = {
      trigger: '🔔',
      indicator: '📊',
      operator: '⚙️',
      action: '🎯',
      risk: '🛡️',
    };
    return icons[data.type] || '📦';
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
        selected
          ? 'shadow-lg shadow-white/30 bg-opacity-100'
          : 'hover:border-opacity-100'
      }`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: selected ? color : `${color}50`,
        boxShadow: selected ? `0 0 20px ${color}40` : 'none',
      }}
    >
      {/* Top Handle */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: color,
            width: '10px',
            height: '10px',
            border: `2px solid ${color}`,
          }}
        />
      )}

      {/* Block Content */}
      <div className="flex items-center gap-3 min-w-max">
        <span className="text-lg">{getBlockIcon()}</span>

        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{data.label}</p>
          <p className="text-xs text-slate-400 max-w-xs">
            {BLOCK_DESCRIPTIONS[data.subType as keyof typeof BLOCK_DESCRIPTIONS] || ''}
          </p>
        </div>

        <button
          onClick={handleDelete}
          className="p-1 hover:bg-red-600/20 rounded transition-colors flex-shrink-0"
          title="Remover bloco"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* Bottom Handle */}
      {data.type !== 'action' && data.type !== 'risk' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: color,
            width: '10px',
            height: '10px',
            border: `2px solid ${color}`,
          }}
        />
      )}
    </div>
  );
}
