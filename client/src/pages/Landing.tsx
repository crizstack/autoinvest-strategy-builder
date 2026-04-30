import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Zap, Shield, BarChart3, Cpu, Lock } from 'lucide-react';
import { getLoginUrl } from '@/const';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useEffect } from 'react';

export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation('/dashboard');
    }
  }, [loading, user, setLocation]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/joven-invest-logo_07fcc62c.png" alt="Joven Invest" className="w-8 h-8" />
            <span className="text-xl font-bold text-white">Joven Invest</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors">
              Planos
            </a>
            <a href="#faq" className="text-slate-300 hover:text-white transition-colors">
              FAQ
            </a>
            <Link href="/login">
              <Button className="bg-green-600 hover:bg-green-700">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="mb-8 inline-block">
            <span className="px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium">
              🚀 Plataforma de Trading Automatizado
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Crie estratégias de investimento
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              {' '}automatizadas
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Simule, teste e execute estratégias de trading na B3 sem escrever uma linha de código.
            Backtesting profissional com dados reais do mercado brasileiro.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg flex items-center gap-2"
            >
              Começar Grátis <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="border-slate-700 text-white hover:bg-slate-800 px-8 py-3 text-lg"
            >
              Ver Demo
            </Button>
          </div>

          {/* Hero Image/Chart */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className="aspect-video bg-gradient-to-b from-green-600/10 to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-green-600 mx-auto mb-4 opacity-50" />
                <p className="text-slate-400">Dashboard em tempo real</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 border-t border-slate-800">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Recursos Poderosos
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
              <Zap className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Builder Visual</h3>
              <p className="text-slate-400">
                Crie estratégias com drag-and-drop. Sem código necessário.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
              <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Backtesting</h3>
              <p className="text-slate-400">
                Teste suas estratégias com dados históricos reais da B3.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
              <Shield className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Paper Trading</h3>
              <p className="text-slate-400">
                Simule operações em tempo real sem risco de capital.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
              <BarChart3 className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Métricas Avançadas</h3>
              <p className="text-slate-400">
                Sharpe Ratio, Drawdown, Win Rate e muito mais.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
              <Lock className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Segurança</h3>
              <p className="text-slate-400">
                Criptografia end-to-end e conformidade com CVM.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
              <Cpu className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Indicadores</h3>
              <p className="text-slate-400">
                MA, RSI, MACD e mais indicadores técnicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 border-t border-slate-800">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Como Funciona
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Criar', desc: 'Defina sua estratégia' },
              { step: '2', title: 'Testar', desc: 'Backtest com dados reais' },
              { step: '3', title: 'Simular', desc: 'Paper trading em tempo real' },
              { step: '4', title: 'Executar', desc: 'Operações automatizadas' },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 border-t border-slate-800">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Planos Simples e Transparentes
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-slate-400 mb-6">Comece sem custo</p>
              <div className="text-4xl font-bold text-white mb-6">R$ 0<span className="text-lg text-slate-400">/mês</span></div>
              <ul className="space-y-3 mb-8">
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Até 2 estratégias
                </li>
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Paper trading
                </li>
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Dados com delay
                </li>
                <li className="text-slate-400 flex items-center gap-2">
                  <span className="text-gray-600">✗</span> Backtest completo
                </li>
              </ul>
              <Button variant="outline" className="w-full border-slate-700">
                Começar
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-xl border-2 border-blue-600 bg-slate-900/50 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full">
                Mais Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-slate-400 mb-6">Para traders sérios</p>
              <div className="text-4xl font-bold text-white mb-6">R$ 99<span className="text-lg text-slate-400">/mês</span></div>
              <ul className="space-y-3 mb-8">
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Estratégias ilimitadas
                </li>
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Backtest completo
                </li>
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Dados em tempo real
                </li>
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Suporte prioritário
                </li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Começar
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/50">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <p className="text-slate-400 mb-6">Execução real (em breve)</p>
              <div className="text-4xl font-bold text-white mb-6">R$ 299<span className="text-lg text-slate-400">/mês</span></div>
              <ul className="space-y-3 mb-8">
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Tudo do Pro
                </li>
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Execução real
                </li>
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Integração corretora
                </li>
                <li className="text-slate-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Prioridade máxima
                </li>
              </ul>
              <Button variant="outline" className="w-full border-slate-700">
                Em breve
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 border-t border-slate-800">
        <div className="container max-w-3xl">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'Posso usar sem experiência em programação?',
                a: 'Sim! O builder visual foi desenvolvido especificamente para traders sem conhecimento técnico.',
              },
              {
                q: 'Os dados são em tempo real?',
                a: 'Planos Free têm delay de 15 minutos. Pro e Premium têm dados em tempo real.',
              },
              {
                q: 'Posso testar estratégias antes de usar?',
                a: 'Sim! Todos os planos incluem backtesting com dados históricos reais.',
              },
              {
                q: 'É seguro?',
                a: 'Sim! Usamos criptografia end-to-end e estamos em conformidade com as exigências da CVM.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
                <h3 className="text-lg font-semibold text-white mb-2">{item.q}</h3>
                <p className="text-slate-400">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-slate-800">
        <div className="container max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Crie sua primeira estratégia em minutos. Sem cartão de crédito necessário.
          </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Começar Grátis Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">AutoInvest</h4>
              <p className="text-slate-400 text-sm">
                Plataforma de trading automatizado para o mercado brasileiro.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Recursos</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white">Termos</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 AutoInvest. Todos os direitos reservados.</p>
            <p className="mt-2">
              AutoInvest é uma plataforma de simulação de trading. Não é um serviço de investimento real.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
