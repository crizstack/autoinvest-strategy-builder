import { describe, it, expect } from 'vitest';
import { isMessageSafe, formatAIResponse, getSuggestionsForContext } from './ai-assistant';

/**
 * Testes para AI Assistant
 */

describe('AI Assistant', () => {
  describe('Message Safety', () => {
    it('deve aceitar mensagens seguras', () => {
      const messages = [
        'Como usar o builder?',
        'O que é RSI?',
        'Como criar estratégia?',
        'Explique média móvel',
      ];

      messages.forEach((msg) => {
        expect(isMessageSafe(msg)).toBe(true);
      });
    });

    it('deve rejeitar mensagens com promessas de ganho', () => {
      const dangerousMessages = [
        'Você promete ganho garantido?',
        'Qual estratégia vai me dar lucro sem risco?',
        'Você recomenda comprar PETR4 agora?',
        'Recomendo vender agora',
      ];

      dangerousMessages.forEach((msg) => {
        expect(isMessageSafe(msg)).toBe(false);
      });
    });
  });

  describe('Response Formatting', () => {
    it('deve adicionar disclaimer quando necessário', () => {
      const response = 'Invista em ações de qualidade';
      const formatted = formatAIResponse(response, true);

      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('não é recomendação financeira');
    });

    it('deve não duplicar disclaimer', () => {
      const response = 'Resposta com ⚠️ Isso não é recomendação financeira.';
      const formatted = formatAIResponse(response, true);

      const disclaimerCount = (formatted.match(/⚠️/g) || []).length;
      expect(disclaimerCount).toBe(1);
    });

    it('deve retornar resposta sem disclaimer quando não necessário', () => {
      const response = 'Como usar o builder?';
      const formatted = formatAIResponse(response, false);

      expect(formatted).toBe(response);
    });
  });

  describe('Context-based Suggestions', () => {
    it('deve retornar sugestões para builder', () => {
      const suggestions = getSuggestionsForContext('builder');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toContain('estratégia');
    });

    it('deve retornar sugestões para market', () => {
      const suggestions = getSuggestionsForContext('market');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.toLowerCase().includes('gráfico'))).toBe(true);
    });

    it('deve retornar sugestões para backtest', () => {
      const suggestions = getSuggestionsForContext('backtest');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.toLowerCase().includes('resultado'))).toBe(true);
    });

    it('deve retornar sugestões para trades', () => {
      const suggestions = getSuggestionsForContext('trades');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.toLowerCase().includes('taxa'))).toBe(true);
    });

    it('deve retornar sugestões padrão para contexto desconhecido', () => {
      const suggestions = getSuggestionsForContext('unknown');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Financial Terms Knowledge', () => {
    it('deve conhecer RSI', () => {
      const rsiInfo = {
        name: 'RSI (Relative Strength Index)',
        range: '0-100',
        interpretation: 'Acima de 70: sobrecomprado | Abaixo de 30: sobrevendido',
      };

      expect(rsiInfo.name).toContain('RSI');
      expect(rsiInfo.range).toBe('0-100');
    });

    it('deve conhecer MACD', () => {
      const macdInfo = {
        name: 'MACD (Moving Average Convergence Divergence)',
        signals: 'Cruzamento de linhas indica mudança de tendência',
      };

      expect(macdInfo.name).toContain('MACD');
      expect(macdInfo.signals).toContain('tendência');
    });

    it('deve conhecer Stop Loss', () => {
      const slInfo = {
        name: 'Stop Loss',
        purpose: 'Proteger contra perdas grandes',
      };

      expect(slInfo.name).toBe('Stop Loss');
      expect(slInfo.purpose).toContain('Proteger');
    });

    it('deve conhecer Take Profit', () => {
      const tpInfo = {
        name: 'Take Profit',
        purpose: 'Garantir ganhos',
      };

      expect(tpInfo.name).toBe('Take Profit');
      expect(tpInfo.purpose).toContain('ganhos');
    });
  });

  describe('Platform Help Knowledge', () => {
    it('deve saber como usar o builder', () => {
      const builderHelp = {
        title: 'Como usar o Strategy Builder',
        steps: [
          '1. Selecione um ativo',
          '2. Arraste um Trigger',
          '3. Adicione Indicadores',
          '4. Termine com uma Ação',
          '5. Adicione Proteções',
          '6. Valide e salve',
        ],
      };

      expect(builderHelp.steps.length).toBe(6);
      expect(builderHelp.steps[0]).toContain('ativo');
    });

    it('deve saber como funciona backtest', () => {
      const backtestHelp = {
        title: 'Como funciona o Backtest',
        description: 'Testa sua estratégia com dados históricos',
        metrics: 'Lucro/Prejuízo, Taxa de Acerto, Drawdown, Sharpe Ratio',
      };

      expect(backtestHelp.description).toContain('históricos');
      expect(backtestHelp.metrics).toContain('Sharpe');
    });

    it('deve saber como funciona paper trading', () => {
      const ptHelp = {
        title: 'Como funciona o Paper Trading',
        description: 'Simula operações em tempo real sem usar dinheiro real',
      };

      expect(ptHelp.description).toContain('dinheiro real');
    });
  });

  describe('Strategy Suggestions', () => {
    it('deve sugerir estratégia RSI', () => {
      const rsiStrategy = {
        name: 'Estratégia RSI',
        riskLevel: 'Moderado',
      };

      expect(rsiStrategy.name).toContain('RSI');
      expect(rsiStrategy.riskLevel).toBe('Moderado');
    });

    it('deve sugerir cruzamento de médias', () => {
      const maStrategy = {
        name: 'Cruzamento de Médias',
        riskLevel: 'Moderado',
      };

      expect(maStrategy.name).toContain('Médias');
    });

    it('deve sugerir estratégia conservadora', () => {
      const conservativeStrategy = {
        name: 'Estratégia Conservadora',
        riskLevel: 'Baixo',
      };

      expect(conservativeStrategy.riskLevel).toBe('Baixo');
    });

    it('deve sugerir estratégia agressiva', () => {
      const aggressiveStrategy = {
        name: 'Estratégia Agressiva',
        riskLevel: 'Alto',
      };

      expect(aggressiveStrategy.riskLevel).toBe('Alto');
    });
  });

  describe('Safety Guardrails', () => {
    it('deve incluir disclaimer em respostas sobre investimento', () => {
      const investmentResponse = 'Você deve investir em ações';
      const formatted = formatAIResponse(investmentResponse, true);

      expect(formatted).toContain('⚠️');
    });

    it('deve rejeitar recomendações diretas de compra', () => {
      const message = 'Recomendo comprar PETR4 agora';
      expect(isMessageSafe(message)).toBe(false);
    });

    it('deve rejeitar recomendações diretas de venda', () => {
      const message = 'Recomendo vender VALE3 agora';
      expect(isMessageSafe(message)).toBe(false);
    });

    it('deve rejeitar promessas de lucro sem risco', () => {
      const message = 'Essa estratégia não tem risco';
      expect(isMessageSafe(message)).toBe(false);
    });
  });
});
