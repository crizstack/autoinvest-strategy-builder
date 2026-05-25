import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Copy, Pause, Play, Trash2, BarChart3, Loader2, ChevronDown, MoreVertical, Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface Strategy {
  id: number;
  name: string;
  asset: string;
  status: string;
  description?: string;
  createdAt?: Date;
}

export default function Strategies() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [newStrategyAsset, setNewStrategyAsset] = useState('PETR4');
  const [newStrategyDescription, setNewStrategyDescription] = useState('');

  // Fetch strategies
  const strategiesQuery = trpc.strategies.list.useQuery(
    { status: filterStatus !== 'all' ? (filterStatus as any) : undefined },
    { enabled: !!user }
  );

  // Create strategy mutation
  const createMutation = trpc.strategies.create.useMutation({
    onSuccess: () => {
      toast.success('Estratégia criada com sucesso!');
      setNewStrategyName('');
      setNewStrategyDescription('');
      setShowCreateModal(false);
      strategiesQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar estratégia');
    },
  });

  // Update strategy mutation
  const updateMutation = trpc.strategies.update.useMutation({
    onSuccess: () => {
      toast.success('Estratégia atualizada com sucesso!');
      setShowEditModal(false);
      setEditingStrategy(null);
      strategiesQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar estratégia');
    },
  });

  // Delete strategy mutation
  const deleteMutation = trpc.strategies.delete.useMutation({
    onSuccess: () => {
      toast.success('Estratégia deletada com sucesso!');
      strategiesQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao deletar estratégia');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = trpc.strategies.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success('Status atualizado!');
      strategiesQuery.refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });

  const handleCreateStrategy = async () => {
    if (!newStrategyName.trim()) {
      toast.error('Nome da estratégia é obrigatório');
      return;
    }

    await createMutation.mutateAsync({
      name: newStrategyName,
      asset: newStrategyAsset,
      description: newStrategyDescription || undefined,
    });
  };

  const handleEditStrategy = async () => {
    if (!editingStrategy) return;
    if (!newStrategyName.trim()) {
      toast.error('Nome da estratégia é obrigatório');
      return;
    }

    await updateMutation.mutateAsync({
      id: editingStrategy.id,
      name: newStrategyName,
      description: newStrategyDescription || undefined,
    });
  };

  const handleDeleteStrategy = (id: number) => {
    if (confirm('Tem certeza que deseja deletar esta estratégia?')) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toggleStatusMutation.mutate({ id, status: newStatus as any });
  };

  const handleEditClick = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setNewStrategyName(strategy.name);
    setNewStrategyDescription(strategy.description || '');
    setShowEditModal(true);
  };

  const handleDuplicateStrategy = async (strategy: Strategy) => {
    await createMutation.mutateAsync({
      name: `${strategy.name} (Cópia)`,
      asset: strategy.asset,
      description: strategy.description,
    });
  };

  const strategies = (strategiesQuery.data || []) as Strategy[];
  const filteredStrategies = useMemo(() => {
    return strategies.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.asset.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [strategies, searchTerm]);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Ativa' },
    paused: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pausada' },
    draft: { bg: 'bg-slate-700/50', text: 'text-slate-400', label: 'Rascunho' },
    archived: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Arquivada' },
  };

  const assets = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'ABEV3', 'WEGE3', 'MGLU3', 'RENT3'];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Estratégias</h1>
          <div className="flex gap-3">
            <Button
              onClick={() => setLocation('/estrategias/builder')}
              className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Builder Visual
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Buscar por nome ou ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800 text-white placeholder-slate-600"
            />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white rounded-lg px-4 py-2 pr-10"
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunho</option>
              <option value="active">Ativa</option>
              <option value="paused">Pausada</option>
              <option value="archived">Arquivada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {strategiesQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
      ) : filteredStrategies.length === 0 ? (
        <Card className="p-12 bg-slate-900/50 border-slate-800 text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma estratégia encontrada</h3>
          <p className="text-slate-400 mb-6">
            {searchTerm ? 'Tente refinar sua busca' : 'Crie sua primeira estratégia para começar'}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setLocation('/estrategias/builder')}
              className="bg-green-600 hover:bg-green-700"
            >
              Criar Estratégia
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredStrategies.map((strategy) => {
            const statusColor = statusColors[strategy.status] || statusColors.draft;
            return (
              <Card
                key={strategy.id}
                className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor.bg} ${statusColor.text}`}>
                        {statusColor.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-sm text-slate-400">
                        Ativo: <span className="text-green-400 font-medium">{strategy.asset}</span>
                      </span>
                      {strategy.description && (
                        <span className="text-sm text-slate-400">{strategy.description}</span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Operações</p>
                        <p className="text-lg font-semibold text-white">0</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Taxa de Acerto</p>
                        <p className="text-lg font-semibold text-white">-</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Drawdown</p>
                        <p className="text-lg font-semibold text-white">-</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Criada em</p>
                        <p className="text-sm font-medium text-slate-300">
                          {strategy.createdAt ? new Date(strategy.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(strategy)}
                      className="text-slate-400 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicateStrategy(strategy)}
                      className="text-slate-400 hover:text-white"
                      title="Duplicar"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(strategy.id, strategy.status)}
                      className={strategy.status === 'active' ? 'text-green-400' : 'text-slate-400 hover:text-white'}
                      title={strategy.status === 'active' ? 'Pausar' : 'Ativar'}
                    >
                      {strategy.status === 'active' ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStrategy(strategy.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Deletar"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Nova Estratégia</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">
                  Nome da Estratégia
                </Label>
                <Input
                  placeholder="Ex: Estratégia RSI"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">
                  Descrição (Opcional)
                </Label>
                <Input
                  placeholder="Descreva sua estratégia..."
                  value={newStrategyDescription}
                  onChange={(e) => setNewStrategyDescription(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">
                  Ativo (B3)
                </Label>
                <select
                  value={newStrategyAsset}
                  onChange={(e) => setNewStrategyAsset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2"
                >
                  {assets.map(asset => (
                    <option key={asset} value={asset}>{asset}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-700"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleCreateStrategy}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Strategy Modal */}
      {showEditModal && editingStrategy && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Editar Estratégia</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">
                  Nome da Estratégia
                </Label>
                <Input
                  placeholder="Ex: Estratégia RSI"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300 mb-2 block">
                  Descrição (Opcional)
                </Label>
                <Input
                  placeholder="Descreva sua estratégia..."
                  value={newStrategyDescription}
                  onChange={(e) => setNewStrategyDescription(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-slate-700"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleEditStrategy}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
