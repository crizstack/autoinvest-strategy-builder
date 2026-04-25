import { Handle, Position } from 'reactflow';
import { X, Settings } from 'lucide-react';
import { BLOCK_COLORS, BLOCK_DESCRIPTIONS } from '@/types/builder';
import { useBuilderStore } from '@/stores/builderStore';

export interface BlockNodeData {
  label: string;
  type: 'trigger' | 'indicator' | 'operator' | 'action' | 'risk';
  subType: string;
  params?: Record<string, any>;
}

export default function BlockNode({ data, id, isConnecting, selected }: any) {
  const { removeNode, setSelectedNodeId } = useBuilderStore();
  const blockType = data.type as keyof typeof BLOCK_COLORS;
  const color = BLOCK_COLORS[blockType] || '#6b7280';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleSelect = () => {
    setSelectedNodeId(id);
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 transition-all cursor-pointer ${
        selected
          ? 'border-white shadow-lg shadow-white/20 bg-opacity-100'
          : 'border-opacity-50 hover:border-opacity-100'
      }`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: color,
      }}
      onClick={handleSelect}
    >
      {/* Input Handle */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: color,
            width: '8px',
            height: '8px',
          }}
        />
      )}

      {/* Block Content */}
      <div className="flex items-center gap-3 min-w-max">
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: color }}
        >
          {data.label.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{data.label}</p>
          <p className="text-xs text-slate-400 max-w-xs">
            {BLOCK_DESCRIPTIONS[data.subType as keyof typeof BLOCK_DESCRIPTIONS] || ''}
          </p>
        </div>

        <button
          onClick={handleDelete}
          className="p-1 hover:bg-red-600/20 rounded transition-colors"
          title="Remover bloco"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>
      </div>

      {/* Output Handle */}
      {data.type !== 'action' && data.type !== 'risk' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: color,
            width: '8px',
            height: '8px',
          }}
        />
      )}
    </div>
  );
}
