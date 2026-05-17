import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState, EMPTY_STATES } from '../EmptyState';

describe('EmptyState Component', () => {
  it('deve renderizar com ícone', () => {
    render(
      <EmptyState
        icon="📊"
        title="Nenhuma estratégia"
        description="Crie sua primeira estratégia"
      />
    );

    expect(screen.getByText('📊')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma estratégia')).toBeInTheDocument();
    expect(screen.getByText('Crie sua primeira estratégia')).toBeInTheDocument();
  });

  it('deve renderizar com ação', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon="📊"
        title="Nenhuma estratégia"
        description="Crie sua primeira estratégia"
        action={{ label: 'Criar', onClick }}
      />
    );

    const button = screen.getByText('Criar');
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalled();
  });

  it('deve renderizar com ilustração', () => {
    render(
      <EmptyState
        illustration="/empty.png"
        title="Vazio"
        description="Nada aqui"
      />
    );

    const img = screen.getByAltText('Vazio');
    expect(img).toHaveAttribute('src', '/empty.png');
  });

  it('deve aplicar className customizado', () => {
    const { container } = render(
      <EmptyState
        icon="📊"
        title="Teste"
        description="Teste"
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('deve renderizar preset de estratégias', () => {
    render(
      <EmptyState
        icon={EMPTY_STATES.strategies.icon}
        title={EMPTY_STATES.strategies.title}
        description={EMPTY_STATES.strategies.description}
      />
    );

    expect(screen.getByText('Nenhuma estratégia criada')).toBeInTheDocument();
  });

  it('deve renderizar preset de backtest', () => {
    render(
      <EmptyState
        icon={EMPTY_STATES.backtest.icon}
        title={EMPTY_STATES.backtest.title}
        description={EMPTY_STATES.backtest.description}
      />
    );

    expect(screen.getByText('Nenhum backtest realizado')).toBeInTheDocument();
  });

  it('deve renderizar preset de trades', () => {
    render(
      <EmptyState
        icon={EMPTY_STATES.trades.icon}
        title={EMPTY_STATES.trades.title}
        description={EMPTY_STATES.trades.description}
      />
    );

    expect(screen.getByText('Nenhuma operação registrada')).toBeInTheDocument();
  });
});
