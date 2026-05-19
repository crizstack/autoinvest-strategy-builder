import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string; // CSS selector do elemento a destacar
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}

interface GuidedTutorialProps {
  steps: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export function GuidedTutorial({
  steps,
  onComplete,
  onSkip,
  autoStart = false,
}: GuidedTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(autoStart);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isVisible || steps.length === 0) return;

    const step = steps[currentStep];
    const element = document.querySelector(step.targetSelector);

    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);

      // Scroll elemento para view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isVisible, steps]);

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

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay com highlight */}
      {highlightRect && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Fundo escuro */}
          <div className="absolute inset-0 bg-black/50" />

          {/* Highlight da área */}
          <div
            className="absolute border-2 border-primary rounded-lg shadow-lg"
            style={{
              top: `${highlightRect.top - 8}px`,
              left: `${highlightRect.left - 8}px`,
              width: `${highlightRect.width + 16}px`,
              height: `${highlightRect.height + 16}px`,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            }}
          />
        </div>
      )}

      {/* Tooltip */}
      <Card
        className="fixed z-50 p-4 w-80 shadow-2xl animate-slide-in-bottom"
        style={{
          top: highlightRect
            ? `${highlightRect.bottom + 16}px`
            : 'auto',
          left: highlightRect
            ? `${Math.max(16, highlightRect.left)}px`
            : 'auto',
          bottom: !highlightRect ? '2rem' : 'auto',
          right: !highlightRect ? '2rem' : 'auto',
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0" />
            <h3 className="font-semibold text-foreground">{step.title}</h3>
          </div>
          <button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="w-full h-1 bg-muted rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {step.description}
        </p>

        {/* Step Indicator */}
        <p className="text-xs text-muted-foreground mb-4">
          Passo {currentStep + 1} de {steps.length}
        </p>

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
          className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Pular tutorial
        </button>
      </Card>
    </>
  );
}

// Tutorial Presets
export const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Dashboard',
    description: 'Aqui você acompanha o desempenho de suas estratégias em tempo real.',
    targetSelector: 'h1',
    position: 'bottom',
  },
  {
    id: 'metrics',
    title: 'Suas Métricas',
    description: 'Veja o saldo simulado, rentabilidade e outras métricas importantes.',
    targetSelector: '[class*="grid"][class*="md:grid-cols-4"]',
    position: 'bottom',
  },
  {
    id: 'charts',
    title: 'Gráficos de Desempenho',
    description: 'Visualize a evolução do seu saldo e rentabilidade ao longo do tempo.',
    targetSelector: '[class*="BalanceChart"]',
    position: 'bottom',
  },
  {
    id: 'strategies',
    title: 'Suas Estratégias',
    description: 'Acompanhe quais estratégias estão gerando mais lucro.',
    targetSelector: '[class*="TopStrategiesWidget"]',
    position: 'bottom',
  },
];

export const BUILDER_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'canvas',
    title: 'Área de Construção',
    description: 'Arraste blocos aqui para construir sua estratégia.',
    targetSelector: '[class*="canvas"]',
    position: 'left',
  },
  {
    id: 'blocks',
    title: 'Blocos Disponíveis',
    description: 'Escolha entre Trigger, Indicadores, Ações e Proteções.',
    targetSelector: '[class*="BlockLibrary"]',
    position: 'right',
  },
  {
    id: 'config',
    title: 'Configuração',
    description: 'Ajuste os parâmetros do bloco selecionado aqui.',
    targetSelector: '[class*="ConfigPanel"]',
    position: 'left',
  },
  {
    id: 'save',
    title: 'Salvar Estratégia',
    description: 'Clique aqui para salvar sua estratégia e testá-la.',
    targetSelector: 'button:has-text("Salvar")',
    position: 'top',
  },
];

export const MARKET_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'search',
    title: 'Buscar Ativos',
    description: 'Procure por ações, criptomoedas e outros ativos.',
    targetSelector: 'input[placeholder*="Buscar"]',
    position: 'bottom',
  },
  {
    id: 'filters',
    title: 'Filtros',
    description: 'Filtre por categoria, performance e outros critérios.',
    targetSelector: '[class*="filter"]',
    position: 'bottom',
  },
  {
    id: 'watchlist',
    title: 'Adicionar à Watchlist',
    description: 'Clique na estrela para acompanhar seus ativos favoritos.',
    targetSelector: 'button[class*="star"]',
    position: 'top',
  },
];
