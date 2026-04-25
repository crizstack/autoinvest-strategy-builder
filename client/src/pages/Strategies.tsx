import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Plus, Search, Edit2, Copy, Pause, Play, Trash2, BarChart3, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Strategies() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [newStrategyAsset, setNewStrategyAsset] = useState('PETR4');

  // Fetch strategies
  const strategiesQuery = trpc.strategies.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Create strategy mutation
  const createMutation = trpc.strategies.create.useMutation({
    onSuccess: () => {
      toast.success('Estratégia criada com sucesso!');
      setNewStrategyName('');
      setShowCreateModal(false);
      strategiesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar estratégia');
    },
  });

  // Delete strategy mutation
  const deleteMutation = trpc.strategies.delete.useMutation({
    onSuccess: () => {
      toast.success('Estratégia deletada com sucesso!');
      strategiesQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao deletar estratégia');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = trpc.strategies.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success('Status atualizado!');
      strategiesQuery.refetch();
    },
    onError: (error) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const strategies = strategiesQuery.data || [];
  const filteredStrategies = strategies.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.asset.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Estratégias</h1>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Estratégia
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Buscar por nome ou ativo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800 text-white placeholder-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        {strategiesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Criar Estratégia
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredStrategies.map((strategy) => (
              <Card
                key={strategy.id}
                className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{strategy.name}</h3>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-400">
                        Ativo: <span className="text-blue-400 font-medium">{strategy.asset}</span>
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        strategy.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : strategy.status === 'paused'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        {strategy.status === 'active' ? 'Ativa' : strategy.status === 'paused' ? 'Pausada' : 'Rascunho'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white"
                      title="Editar"
                    >
                      <Edit2 className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-white"
                      title="Duplicar"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(strategy.id, strategy.status || 'draft')}
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

                {strategy.description && (
                  <p className="text-sm text-slate-400 mb-4">{strategy.description}</p>
                )}

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
                      {new Date(strategy.createdAt || new Date()).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Strategy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Nova Estratégia</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Nome da Estratégia
                </label>
                <Input
                  placeholder="Ex: Estratégia RSI"
                  value={newStrategyName}
                  onChange={(e) => setNewStrategyName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white placeholder-slate-600"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Ativo (B3)
                </label>
                <select
                  value={newStrategyAsset}
                  onChange={(e) => setNewStrategyAsset(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2"
                >
                  <option value="PETR4">PETR4 - Petrobras</option>
                  <option value="VALE3">VALE3 - Vale</option>
                  <option value="ITUB4">ITUB4 - Itaú</option>
                  <option value="BBAS3">BBAS3 - Banco do Brasil</option>
                  <option value="ABEV3">ABEV3 - Ambev</option>
                  <option value="WEGE3">WEGE3 - WEG</option>
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateStrategy}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
