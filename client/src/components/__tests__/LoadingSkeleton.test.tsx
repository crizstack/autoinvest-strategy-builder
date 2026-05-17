import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  DashboardSkeleton,
  StrategyBuilderSkeleton,
  BacktestResultsSkeleton,
} from '../LoadingSkeleton';

describe('LoadingSkeleton Components', () => {
  describe('Skeleton', () => {
    it('deve renderizar skeleton com classe customizada', () => {
      const { container } = render(
        <Skeleton className="h-6 w-1/3" />
      );

      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toHaveClass('h-6', 'w-1/3');
    });
  });

  describe('CardSkeleton', () => {
    it('deve renderizar card skeleton', () => {
      const { container } = render(<CardSkeleton />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('ListSkeleton', () => {
    it('deve renderizar com contagem padrão', () => {
      const { container } = render(<ListSkeleton />);

      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('deve renderizar com contagem customizada', () => {
      const { container } = render(<ListSkeleton count={5} />);

      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('TableSkeleton', () => {
    it('deve renderizar com dimensões padrão', () => {
      const { container } = render(<TableSkeleton />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      // 5 linhas + 1 header = 6 linhas, 4 colunas cada = 24 skeletons
      expect(skeletons.length).toBeGreaterThanOrEqual(20);
    });

    it('deve renderizar com dimensões customizadas', () => {
      const { container } = render(<TableSkeleton rows={3} cols={2} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      // 3 linhas + 1 header = 4 linhas, 2 colunas cada = 8 skeletons
      expect(skeletons.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('DashboardSkeleton', () => {
    it('deve renderizar dashboard skeleton completo', () => {
      const { container } = render(<DashboardSkeleton />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Verificar presença de cards
      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('StrategyBuilderSkeleton', () => {
    it('deve renderizar strategy builder skeleton', () => {
      const { container } = render(<StrategyBuilderSkeleton />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Verificar grid layout
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('BacktestResultsSkeleton', () => {
    it('deve renderizar backtest results skeleton', () => {
      const { container } = render(<BacktestResultsSkeleton />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Verificar presença de múltiplos cards
      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThan(1);
    });
  });
});
