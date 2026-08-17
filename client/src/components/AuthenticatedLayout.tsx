import { ReactNode, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, Settings, BarChart3, TrendingUp, Zap, DollarSign, Cpu, ChevronDown, LineChart, BookOpen, Shield } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { toast } from 'sonner';

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const { user, logout, isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentPath] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
      setLocation('/login');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#050805] via-[#0B110B] to-[#050805]">
        <div className="text-center">
          <p className="text-[#B8C2B8]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { label: 'Mercado', href: '/mercado', icon: LineChart },
    { label: 'Estratégias', href: '/estrategias', icon: Zap },
    { label: 'Backtest', href: '/backtest', icon: TrendingUp },
    { label: 'Trades', href: '/trades', icon: DollarSign },
    { label: 'Educação', href: '/educacao', icon: BookOpen },
    { label: 'Logs de Auditoria', href: '/audit-logs', icon: Shield },
    { label: 'Billing', href: '/billing', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050805] via-[#0B110B] to-[#050805] flex">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-[#0B110B]/50 border-r border-[#235317]/30 backdrop-blur-sm transition-all duration-300 z-40 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#235317]/30">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/manus-storage/joven-invest-logo_07fcc62c.png" alt="Auto Invest" className="w-8 h-8" />
            <span className="text-xl font-bold text-white">Auto Invest</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#B8C2B8] hover:text-white"
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
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-[#38A636]/20 text-[#76E821] border-l-2 border-[#4CB22F]' : 'text-[#B8C2B8] hover:text-white hover:bg-[#141C14]/50'}`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="absolute bottom-4 left-4 right-4">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#B8C2B8] hover:text-white hover:bg-[#141C14]/50 transition-colors"
            title={!sidebarOpen ? 'Configurações' : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-medium">Configurações</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Navbar */}
        <nav className="h-16 border-b border-[#235317]/30 bg-[#0B110B]/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex-1" />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#141C14]/50 transition-colors"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name || user?.email}</p>
                <p className="text-xs text-[#B8C2B8]">{user?.role === 'admin' ? 'Admin' : 'Usuário'}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#38A636] flex items-center justify-center text-white font-bold">
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <ChevronDown className="w-4 h-4 text-[#B8C2B8]" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-[#0B110B] border border-[#235317]/30 rounded-lg shadow-lg z-50">
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-[#B8C2B8] hover:bg-[#141C14] hover:text-white first:rounded-t-lg"
                  onClick={() => setShowUserMenu(false)}
                >
                  Configurações
                </Link>
                <Link
                  href="/settings/profile"
                  className="block px-4 py-2 text-sm text-[#B8C2B8] hover:bg-[#141C14] hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  Perfil
                </Link>
                <Link
                  href="/settings/billing"
                  className="block px-4 py-2 text-sm text-[#B8C2B8] hover:bg-[#141C14] hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  Plano
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#141C14] hover:text-red-300 flex items-center gap-2 last:rounded-b-lg"
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
