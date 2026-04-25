import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 'Grátis',
    description: 'Para começar',
    features: [
      { name: 'Até 2 estratégias', included: true },
      { name: 'Paper trading apenas', included: true },
      { name: 'Dados com delay de 15min', included: true },
      { name: 'Backtesting básico', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'Execução real', included: false },
      { name: 'Dados em tempo real', included: false },
      { name: 'Integração com corretoras', included: false },
    ],
    cta: 'Plano Atual',
    ctaVariant: 'outline' as const,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 49',
    period: '/mês',
    description: 'Para traders sérios',
    features: [
      { name: 'Estratégias ilimitadas', included: true },
      { name: 'Paper trading e backtest', included: true },
      { name: 'Dados em tempo real', included: true },
      { name: 'Backtesting avançado', included: true },
      { name: 'Suporte prioritário', included: true },
      { name: 'Execução real', included: false },
      { name: 'Integração com corretoras', included: false },
      { name: 'API customizada', included: false },
    ],
    cta: 'Upgrade para Pro',
    ctaVariant: 'default' as const,
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 99',
    period: '/mês',
    description: 'Tudo incluído',
    features: [
      { name: 'Estratégias ilimitadas', included: true },
      { name: 'Paper trading e backtest', included: true },
      { name: 'Dados em tempo real', included: true },
      { name: 'Backtesting avançado', included: true },
      { name: 'Suporte 24/7', included: true },
      { name: 'Execução real', included: true },
      { name: 'Integração com corretoras', included: true },
      { name: 'API customizada', included: true },
    ],
    cta: 'Upgrade para Premium',
    ctaVariant: 'default' as const,
  },
];

export default function Billing() {
  const currentPlan = 'free';

  const handleUpgrade = (planId: string) => {
    if (planId === currentPlan) {
      toast.info('Você já está neste plano');
      return;
    }
    toast.success(`Redirecionando para checkout do plano ${planId.toUpperCase()}...`);
    // In production, redirect to Stripe checkout
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      toast.success('Assinatura cancelada com sucesso');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Planos e Billing</h1>
        <p className="text-slate-400">Escolha o plano ideal para suas necessidades</p>
      </div>

      {/* Current Plan */}
      <Card className="p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-600/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">Plano Atual</p>
            <p className="text-2xl font-bold text-white">Free</p>
            <p className="text-slate-400 text-sm mt-2">Próxima renovação: -</p>
          </div>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-red-600/50 text-red-400 hover:bg-red-600/10"
          >
            Cancelar Assinatura
          </Button>
        </div>
      </Card>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`p-6 border transition-all ${
              plan.popular
                ? 'bg-slate-900/80 border-blue-600/50 ring-2 ring-blue-600/30 relative'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MAIS POPULAR
                </span>
              </div>
            )}

            <div className="mb-6 pt-2">
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-slate-400 text-sm mb-4">{plan.description}</p>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                {plan.period && <span className="text-slate-400">{plan.period}</span>}
              </div>
            </div>

            <Button
              onClick={() => handleUpgrade(plan.id)}
              variant={plan.ctaVariant}
              className={`w-full mb-6 ${
                plan.ctaVariant === 'default'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'border-slate-700 hover:bg-slate-800'
              }`}
              disabled={plan.id === currentPlan}
            >
              {plan.cta}
            </Button>

            {/* Features */}
            <div className="space-y-3">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      feature.included ? 'text-white' : 'text-slate-500 line-through'
                    }`}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* FAQ */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-6">Perguntas Frequentes</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-white mb-2">Posso cancelar a qualquer momento?</h3>
            <p className="text-slate-400 text-sm">
              Sim, você pode cancelar sua assinatura a qualquer momento. O acesso será mantido até o final do período de cobrança.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Qual é a diferença entre Paper Trading e Execução Real?</h3>
            <p className="text-slate-400 text-sm">
              Paper Trading simula operações sem usar dinheiro real. Execução Real permite que suas estratégias executem operações reais na bolsa.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Posso fazer upgrade ou downgrade?</h3>
            <p className="text-slate-400 text-sm">
              Sim, você pode mudar de plano a qualquer momento. As mudanças serão refletidas na próxima cobrança.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Vocês oferecem período de teste?</h3>
            <p className="text-slate-400 text-sm">
              O plano Free oferece acesso completo com limitações. Comece gratuitamente e faça upgrade quando estiver pronto.
            </p>
          </div>
        </div>
      </Card>

      {/* Contact */}
      <Card className="p-6 bg-gradient-to-r from-slate-900/50 to-slate-900/50 border-slate-800 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Precisa de ajuda?</h3>
        <p className="text-slate-400 mb-4">Entre em contato com nosso time de suporte</p>
        <Button variant="outline" className="border-slate-700">
          Enviar Email
        </Button>
      </Card>
    </div>
  );
}
