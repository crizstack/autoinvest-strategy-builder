import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  illustration,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {illustration ? (
        <img src={illustration} alt={title} className="w-24 h-24 mb-4 opacity-80" />
      ) : icon ? (
        <div className="text-5xl mb-4 opacity-60">{icon}</div>
      ) : null}

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">{description}</p>

      {action && (
        <Button onClick={action.onClick} variant="default" size="sm">
          {action.label}
        </Button>
      )}
    </Card>
  );
}

// Presets para diferentes contextos
export const EMPTY_STATES = {
  strategies: {
    icon: '📊',
    title: 'Nenhuma estratégia criada',
    description: 'Comece criando sua primeira estratégia de trading automatizada.',
    action: 'Criar Estratégia',
  },
  backtest: {
    icon: '⏮️',
    title: 'Nenhum backtest realizado',
    description: 'Execute um backtest para validar sua estratégia com dados históricos.',
    action: 'Executar Backtest',
  },
  trades: {
    icon: '📈',
    title: 'Nenhuma operação registrada',
    description: 'Suas operações aparecerão aqui quando começar a tradear.',
    action: null,
  },
  watchlist: {
    icon: '⭐',
    title: 'Watchlist vazia',
    description: 'Adicione ativos à sua watchlist para acompanhá-los em tempo real.',
    action: 'Adicionar Ativos',
  },
  education: {
    icon: '📚',
    title: 'Nenhuma aula disponível',
    description: 'Confira novamente em breve para novos conteúdos educacionais.',
    action: null,
  },
  search: {
    icon: '🔍',
    title: 'Nenhum resultado encontrado',
    description: 'Tente ajustar seus filtros ou termos de busca.',
    action: null,
  },
};
