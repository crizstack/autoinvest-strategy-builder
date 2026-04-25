import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/_core/hooks/useAuth';
import { User, Lock, Bell, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    toast.success('Perfil atualizado com sucesso!');
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    if (formData.newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return;
    }
    toast.success('Senha alterada com sucesso!');
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'password', label: 'Senha', icon: Lock },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
        <p className="text-slate-400">Gerencie suas preferências e informações de conta</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-slate-400">Foto de Perfil</p>
                <Button variant="outline" className="mt-2 border-slate-700">
                  Alterar Foto
                </Button>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2 block">Nome</Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="bg-slate-950 border-slate-800 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">Email</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="bg-slate-950 border-slate-800 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">Plano Atual</Label>
                <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white">
                  Free
                </div>
              </div>

              <div>
                <Label className="text-slate-300 mb-2 block">Membro desde</Label>
                <div className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white">
                  {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700">
                    Salvar Alterações
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="border-slate-700"
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="space-y-4 max-w-md">
            <div>
              <Label className="text-slate-300 mb-2 block">Senha Atual</Label>
              <Input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                placeholder="Digite sua senha atual"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Nova Senha</Label>
              <Input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Mínimo 8 caracteres"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">Confirmar Nova Senha</Label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirme a nova senha"
                className="bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <Button onClick={handleChangePassword} className="bg-blue-600 hover:bg-blue-700 w-full">
              Alterar Senha
            </Button>
          </div>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-medium">Notificações de Trades</p>
                <p className="text-sm text-slate-400">Receba alertas quando um trade for executado</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </div>

            <div className="flex items-center justify-between py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-medium">Alertas de Risco</p>
                <p className="text-sm text-slate-400">Notificações quando o drawdown atingir limite</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 rounded" />
            </div>

            <div className="flex items-center justify-between py-4 border-b border-slate-800">
              <div>
                <p className="text-white font-medium">Relatórios Semanais</p>
                <p className="text-sm text-slate-400">Receba resumo de performance toda segunda</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded" />
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-white font-medium">Newsletter</p>
                <p className="text-sm text-slate-400">Dicas e atualizações do produto</p>
              </div>
              <input type="checkbox" className="w-5 h-5 rounded" />
            </div>

            <Button onClick={() => toast.success('Preferências salvas!')} className="bg-blue-600 hover:bg-blue-700 w-full mt-6">
              Salvar Preferências
            </Button>
          </div>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Autenticação de Dois Fatores</h3>
              <p className="text-slate-400 mb-4">
                Adicione uma camada extra de segurança à sua conta
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Ativar 2FA
              </Button>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Sessões Ativas</h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Navegador Atual</p>
                    <p className="text-sm text-slate-400">Chrome no Windows</p>
                  </div>
                  <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                    Ativo
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Deletar Conta</h3>
              <p className="text-slate-400 mb-4">
                Esta ação é irreversível. Todos os seus dados serão permanentemente deletados.
              </p>
              <Button variant="outline" className="border-red-600/50 text-red-400 hover:bg-red-600/10">
                Deletar Conta
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
