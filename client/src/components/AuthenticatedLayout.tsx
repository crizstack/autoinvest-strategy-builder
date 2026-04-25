import { ReactNode, useState } from 'react';
import { useAuthToken } from '@/_core/hooks/useAuthToken';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Settings, BarChart3, TrendingUp, Zap, DollarSign, Cpu, ChevronDown } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, logout, isAuthenticated, loading } = useAuthToken();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentPath] = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado com sucesso');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { label: 'Estratégias', href: '/estrategias', icon: Zap },
    { label: 'Backtest', href: '/backtest', icon: TrendingUp },
    { label: 'Trades', href: '/trades', icon: DollarSign },
    { label: 'Billing', href: '/billing', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-900/50 border-r border-slate-800 backdrop-blur-sm transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">AutoInvest</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="absolute bottom-4 left-4 right-4">
          <a
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            title={!sidebarOpen ? 'Configurações' : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Configurações</span>}
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Navbar */}
        <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex-1" />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name || user?.email}</p>
                <p className="text-xs text-slate-400">{user?.role === 'admin' ? 'Admin' : 'Usuário'}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-lg z-50">
                <a
                  href="/settings"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white first:rounded-t-lg"
                >
                  Configurações
                </a>
                <a
                  href="/settings/profile"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Perfil
                </a>
                <a
                  href="/settings/billing"
                  className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Plano
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 flex items-center gap-2 last:rounded-b-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Page Content */}
        <main className="p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
