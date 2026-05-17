import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  actionLabel?: string;
}

interface OnboardingProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export function Onboarding({ steps, onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-6 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{step.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Passo {currentStep + 1} de {steps.length}
            </p>
          </div>
          <button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-muted rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Icon & Description */}
        <div className="mb-6">
          <div className="flex justify-center mb-4 text-primary">
            {step.icon}
          </div>
          <p className="text-center text-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Action Button */}
        {step.actionLabel && (
          <Button
            onClick={handleNext}
            className="w-full mb-3"
            variant="default"
          >
            {step.actionLabel}
          </Button>
        )}

        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <Button
            onClick={handleNext}
            variant="default"
            size="sm"
            className="flex-1"
          >
            {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
            {currentStep < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 ml-1" />
            )}
          </Button>
        </div>

        {/* Skip Link */}
        <button
          onClick={handleSkip}
          className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular onboarding
        </button>
      </Card>
    </div>
  );
}

// Onboarding Steps Presets
export const DASHBOARD_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao AutoInvest',
    description: 'Crie estratégias de trading automatizadas sem código. Vamos começar!',
    icon: '🚀',
  },
  {
    id: 'strategies',
    title: 'Crie Estratégias',
    description: 'Use o Strategy Builder para criar suas estratégias de trading personalizadas.',
    icon: '📊',
    actionLabel: 'Ir para Builder',
  },
  {
    id: 'backtest',
    title: 'Teste com Backtest',
    description: 'Valide suas estratégias com dados históricos antes de usar com dinheiro real.',
    icon: '⏮️',
  },
  {
    id: 'market',
    title: 'Explore o Mercado',
    description: 'Acompanhe ativos em tempo real e crie watchlists personalizadas.',
    icon: '📈',
  },
  {
    id: 'education',
    title: 'Aprenda Mais',
    description: 'Acesse tutoriais, glossário e dúvidas frequentes na seção Educação.',
    icon: '📚',
  },
];

export const BUILDER_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Strategy Builder',
    description: 'Construa estratégias arrastando blocos. Sem código necessário!',
    icon: '🎨',
  },
  {
    id: 'blocks',
    title: 'Blocos Disponíveis',
    description: 'Trigger (gatilho), Indicadores, Ações (compra/venda) e Proteções (Stop Loss).',
    icon: '🧩',
  },
  {
    id: 'flow',
    title: 'Fluxo da Estratégia',
    description: 'Conecte blocos em ordem: Trigger → Indicador → Ação → Proteção.',
    icon: '🔗',
  },
  {
    id: 'save',
    title: 'Salve e Teste',
    description: 'Salve sua estratégia e execute um backtest para validar.',
    icon: '💾',
  },
];
