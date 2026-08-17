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
    <div className="min-h-screen bg-gradient-to-b from-[#050805] via-[#0B110B] to-[#050805]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#050805]/80 backdrop-blur-md border-b border-[#235317]/30 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
             <img src="/manus-storage/joven-invest-logo_07fcc62c.png" alt="Auto Invest" className="w-8 h-8" />
            <span className="text-xl font-bold text-white">Auto Invest</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-[#B8C2B8] hover:text-white transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-[#B8C2B8] hover:text-white transition-colors">
              Planos
            </a>
            <a href="#faq" className="text-[#B8C2B8] hover:text-white transition-colors">
              FAQ
            </a>
            <Link href="/login">
              <Button className="bg-[#38A636] hover:bg-[#4CB22F]">
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
            <span className="px-4 py-2 bg-[#38A636]/20 border border-[#4CB22F]/30 rounded-full text-[#76E821] text-sm font-medium">
              🚀 Plataforma de Trading Automatizado
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Crie estratégias de investimento
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#76E821] to-emerald-400">
              {' '}automatizadas
            </span>
          </h1>

          <p className="text-xl text-[#B8C2B8] mb-8 max-w-2xl mx-auto">
            Simule, teste e execute estratégias de trading na B3 sem escrever uma linha de código.
            Backtesting profissional com dados reais do mercado brasileiro.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-[#38A636] hover:bg-[#4CB22F] text-white px-8 py-3 text-lg flex items-center gap-2"
            >
              Começar Grátis <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="border-[#235317]/45 text-white hover:bg-[#141C14] px-8 py-3 text-lg"
            >
              Ver Demo
            </Button>
          </div>

          {/* Hero Image/Chart */}
          <div className="relative rounded-xl overflow-hidden border border-[#235317]/30 bg-[#0B110B]/50 backdrop-blur-sm">
            <div className="aspect-video bg-gradient-to-b from-[#235317]/10 to-[#0B110B] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-[#38A636] mx-auto mb-4 opacity-50" />
                <p className="text-[#B8C2B8]">Dashboard em tempo real</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 border-t border-[#235317]/30">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Recursos Poderosos
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50 hover:bg-[#141C14]/50 transition-colors">
              <Zap className="w-8 h-8 text-[#76E821] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Builder Visual</h3>
              <p className="text-[#B8C2B8]">
                Crie estratégias com drag-and-drop. Sem código necessário.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50 hover:bg-[#141C14]/50 transition-colors">
              <TrendingUp className="w-8 h-8 text-[#76E821] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Backtesting</h3>
              <p className="text-[#B8C2B8]">
                Teste suas estratégias com dados históricos reais da B3.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50 hover:bg-[#141C14]/50 transition-colors">
              <Shield className="w-8 h-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Paper Trading</h3>
              <p className="text-[#B8C2B8]">
                Simule operações em tempo real sem risco de capital.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50 hover:bg-[#141C14]/50 transition-colors">
              <BarChart3 className="w-8 h-8 text-[#76E821] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Métricas Avançadas</h3>
              <p className="text-[#B8C2B8]">
                Sharpe Ratio, Drawdown, Win Rate e muito mais.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50 hover:bg-[#141C14]/50 transition-colors">
              <Lock className="w-8 h-8 text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Segurança</h3>
              <p className="text-[#B8C2B8]">
                Criptografia end-to-end e conformidade com CVM.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50 hover:bg-[#141C14]/50 transition-colors">
              <Cpu className="w-8 h-8 text-[#76E821] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Indicadores</h3>
              <p className="text-[#B8C2B8]">
                MA, RSI, MACD e mais indicadores técnicos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 border-t border-[#235317]/30">
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
                <div className="w-12 h-12 rounded-full bg-[#38A636] text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[#B8C2B8]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 border-t border-[#235317]/30">
        <div className="container">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Planos Simples e Transparentes
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="p-8 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50">
              <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
              <p className="text-[#B8C2B8] mb-6">Comece sem custo</p>
              <div className="text-4xl font-bold text-white mb-6">R$ 0<span className="text-lg text-[#B8C2B8]">/mês</span></div>
              <ul className="space-y-3 mb-8">
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Até 2 estratégias
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Paper trading
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Dados com delay
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#6B756B]">✗</span> Backtest completo
                </li>
              </ul>
              <Button variant="outline" className="w-full border-[#235317]/45">
                Começar
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-xl border-2 border-[#38A636] bg-[#0B110B]/50 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#38A636] text-white text-sm font-semibold rounded-full">
                Mais Popular
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
              <p className="text-[#B8C2B8] mb-6">Para traders sérios</p>
              <div className="text-4xl font-bold text-white mb-6">R$ 99<span className="text-lg text-[#B8C2B8]">/mês</span></div>
              <ul className="space-y-3 mb-8">
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Estratégias ilimitadas
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Backtest completo
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Dados em tempo real
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Suporte prioritário
                </li>
              </ul>
              <Button className="w-full bg-[#38A636] hover:bg-[#4CB22F]">
                Começar
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="p-8 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50">
              <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
              <p className="text-[#B8C2B8] mb-6">Execução real (em breve)</p>
              <div className="text-4xl font-bold text-white mb-6">R$ 299<span className="text-lg text-[#B8C2B8]">/mês</span></div>
              <ul className="space-y-3 mb-8">
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Tudo do Pro
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Execução real
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Integração corretora
                </li>
                <li className="text-[#B8C2B8] flex items-center gap-2">
                  <span className="text-[#76E821]">✓</span> Prioridade máxima
                </li>
              </ul>
              <Button 
                onClick={() => window.location.href = getLoginUrl()}
                className="w-full bg-[#38A636] hover:bg-[#4CB22F] text-white"
              >
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 border-t border-[#235317]/30">
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
              <div key={idx} className="p-6 rounded-xl border border-[#235317]/30 bg-[#0B110B]/50">
                <h3 className="text-lg font-semibold text-white mb-2">{item.q}</h3>
                <p className="text-[#B8C2B8]">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-[#235317]/30">
        <div className="container max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-[#B8C2B8] mb-8">
            Crie sua primeira estratégia em minutos. Sem cartão de crédito necessário.
          </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="bg-[#38A636] hover:bg-[#4CB22F] text-white px-8 py-3 text-lg"
          >
            Começar Grátis Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#235317]/30 py-12 px-4">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">AutoInvest</h4>
              <p className="text-[#B8C2B8] text-sm">
                Plataforma de trading automatizado para o mercado brasileiro.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-[#B8C2B8] text-sm">
                <li><a href="#" className="hover:text-white">Recursos</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-[#B8C2B8] text-sm">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-[#B8C2B8] text-sm">
                <li><a href="#" className="hover:text-white">Termos</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
                <li><a href="#" className="hover:text-white">Disclaimer</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[#235317]/30 pt-8 text-center text-[#B8C2B8] text-sm">
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
