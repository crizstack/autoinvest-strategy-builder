import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Onboarding, DASHBOARD_ONBOARDING_STEPS, BUILDER_ONBOARDING_STEPS } from '../Onboarding';

describe('Onboarding Component', () => {
  it('deve renderizar o primeiro step', () => {
    render(
      <Onboarding steps={DASHBOARD_ONBOARDING_STEPS} />
    );

    expect(screen.getByText('Bem-vindo ao AutoInvest')).toBeInTheDocument();
    expect(screen.getByText(/Passo 1 de 5/)).toBeInTheDocument();
  });

  it('deve navegar para o próximo step', () => {
    render(
      <Onboarding steps={DASHBOARD_ONBOARDING_STEPS} />
    );

    const nextButton = screen.getByText('Próximo');
    fireEvent.click(nextButton);

    expect(screen.getByText('Crie Estratégias')).toBeInTheDocument();
    expect(screen.getByText(/Passo 2 de 5/)).toBeInTheDocument();
  });

  it('deve navegar para o step anterior', () => {
    render(
      <Onboarding steps={DASHBOARD_ONBOARDING_STEPS} />
    );

    const nextButton = screen.getByText('Próximo');
    fireEvent.click(nextButton);

    const prevButton = screen.getByText('Anterior');
    fireEvent.click(prevButton);

    expect(screen.getByText('Bem-vindo ao AutoInvest')).toBeInTheDocument();
  });

  it('deve desabilitar botão anterior no primeiro step', () => {
    render(
      <Onboarding steps={DASHBOARD_ONBOARDING_STEPS} />
    );

    const prevButton = screen.getByText('Anterior');
    expect(prevButton).toBeDisabled();
  });

  it('deve chamar onComplete quando terminar', () => {
    const onComplete = vi.fn();
    const { rerender } = render(
      <Onboarding steps={[DASHBOARD_ONBOARDING_STEPS[0]]} onComplete={onComplete} />
    );

    const button = screen.getByText('Concluir');
    fireEvent.click(button);

    expect(onComplete).toHaveBeenCalled();
  });

  it('deve chamar onSkip quando pular', () => {
    const onSkip = vi.fn();
    render(
      <Onboarding steps={DASHBOARD_ONBOARDING_STEPS} onSkip={onSkip} />
    );

    const skipButton = screen.getByText('Pular onboarding');
    fireEvent.click(skipButton);

    expect(onSkip).toHaveBeenCalled();
  });

  it('deve renderizar steps do builder', () => {
    render(
      <Onboarding steps={BUILDER_ONBOARDING_STEPS} />
    );

    expect(screen.getByText('Strategy Builder')).toBeInTheDocument();
    expect(screen.getByText(/Passo 1 de 4/)).toBeInTheDocument();
  });

  it('deve mostrar progresso correto', () => {
    const { rerender } = render(
      <Onboarding steps={DASHBOARD_ONBOARDING_STEPS} />
    );

    // Primeiro step: 20%
    let progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '20%' });

    // Navegar para segundo step
    fireEvent.click(screen.getByText('Próximo'));

    // Segundo step: 40%
    progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '40%' });
  });
});
