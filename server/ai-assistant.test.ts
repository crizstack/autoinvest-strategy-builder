import { describe, it, expect } from 'vitest';
import { isMessageSafe, formatAIResponse, getSuggestionsForContext, explainIndicator, analyzeStrategy, analyzeError, formatErrorExplanation, generateImprovementSuggestions, explainBacktestMetric, evaluateBacktestQuality, generateBacktestRecommendations, detectQuestionType } from './ai-assistant';

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

  describe('Indicator Explanation', () => {
    it('deve explicar RSI', () => {
      const explanation = explainIndicator('RSI');
      
      expect(explanation).toContain('RSI');
      expect(explanation).toContain('0-100');
      expect(explanation).toContain('sobrecomprado');
    });

    it('deve explicar MACD', () => {
      const explanation = explainIndicator('MACD');
      
      expect(explanation).toContain('MACD');
      expect(explanation).toContain('tendência');
    });

    it('deve retornar mensagem para indicador desconhecido', () => {
      const explanation = explainIndicator('IndicadorFake');
      
      expect(explanation).toContain('Não encontrei');
    });
  });

  describe('Strategy Analysis', () => {
    it('deve detectar estratégia completa', () => {
      const strategy = {
        asset: 'PETR4',
        blocks: [
          { type: 'trigger' },
          { type: 'condition' },
          { type: 'action' },
          { type: 'risk' },
        ],
      };

      const analysis = analyzeStrategy(strategy);
      
      expect(analysis.hasAsset).toBe(true);
      expect(analysis.hasTrigger).toBe(true);
      expect(analysis.hasAction).toBe(true);
      expect(analysis.hasRiskManagement).toBe(true);
      expect(analysis.issues.length).toBe(0);
    });

    it('deve detectar estratégia incompleta', () => {
      const strategy = {
        asset: 'PETR4',
        blocks: [
          { type: 'trigger' },
        ],
      };

      const analysis = analyzeStrategy(strategy);
      
      expect(analysis.hasTrigger).toBe(true);
      expect(analysis.hasAction).toBe(false);
      expect(analysis.issues).toContain('Falta Ação (compra/venda)');
    });

    it('deve sugerir Stop Loss e Take Profit', () => {
      const strategy = {
        asset: 'PETR4',
        blocks: [
          { type: 'trigger' },
          { type: 'action' },
        ],
      };

      const analysis = analyzeStrategy(strategy);
      
      expect(analysis.suggestions.some(s => s.includes('Stop Loss'))).toBe(true);
      expect(analysis.suggestions.some(s => s.includes('Take Profit'))).toBe(true);
    });
  });

  describe('Error Analysis', () => {
    it('deve detectar erro de ativo não selecionado', () => {
      const error = analyzeError('no_asset');
      
      expect(error).not.toBeNull();
      expect(error?.problem).toContain('ativo');
    });

    it('deve detectar erro de trigger faltante', () => {
      const error = analyzeError('no_trigger');
      
      expect(error).not.toBeNull();
      expect(error?.problem).toContain('Trigger');
    });

    it('deve retornar null para erro desconhecido', () => {
      const error = analyzeError('erro_inexistente');
      
      expect(error).toBeNull();
    });

    it('deve fornecer solução educativa para erro', () => {
      const error = analyzeError('no_risk_management');
      
      if (error) {
        const formatted = formatErrorExplanation(error);
        expect(formatted).toContain('Por quê');
        expect(formatted).toContain('Como resolver');
      }
    });
  });

  describe('Improvement Suggestions', () => {
    it('deve gerar sugestões para estratégia incompleta', () => {
      const strategy = {
        asset: 'PETR4',
        blocks: [
          { type: 'trigger' },
          { type: 'action' },
        ],
      };

      const suggestions = generateImprovementSuggestions(strategy);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('Stop Loss') || s.includes('Take Profit'))).toBe(true);
    });

    it('deve sugerir backtest para estratégia completa', () => {
      const strategy = {
        asset: 'PETR4',
        blocks: [
          { type: 'trigger' },
          { type: 'action' },
          { type: 'risk' },
        ],
      };

      const suggestions = generateImprovementSuggestions(strategy);
      
      expect(suggestions.some(s => s.includes('Backtest'))).toBe(true);
    });
  });

  describe('Backtest Metrics Explanation', () => {
    it('deve explicar Win Rate', () => {
      const explanation = explainBacktestMetric('Win Rate');
      
      expect(explanation).toContain('Taxa de Acerto');
      expect(explanation).toContain('50%');
    });

    it('deve explicar Sharpe Ratio', () => {
      const explanation = explainBacktestMetric('Sharpe');
      
      expect(explanation).toContain('Sharpe');
      expect(explanation).toContain('risco');
    });

    it('deve retornar mensagem para métrica desconhecida', () => {
      const explanation = explainBacktestMetric('MetricaFake');
      
      expect(explanation).toContain('não encontrada');
    });
  });

  describe('Backtest Quality Evaluation', () => {
    it('deve avaliar backtest excelente', () => {
      const result = {
        winRate: 65,
        sharpeRatio: 1.8,
        maxDrawdown: 10,
        profitFactor: 2.5,
      };

      const evaluation = evaluateBacktestQuality(result);
      
      expect(evaluation.rating).toBe('excellent');
      expect(evaluation.feedback.length).toBeGreaterThan(0);
    });

    it('deve avaliar backtest fraco', () => {
      const result = {
        winRate: 40,
        sharpeRatio: 0.5,
        maxDrawdown: 50,
        profitFactor: 0.8,
      };

      const evaluation = evaluateBacktestQuality(result);
      
      expect(evaluation.rating).toBe('poor');
      expect(evaluation.feedback.some(f => f.includes('⚠️'))).toBe(true);
    });

    it('deve gerar recomendações baseadas em backtest', () => {
      const result = {
        winRate: 45,
        sharpeRatio: 0.8,
        maxDrawdown: 35,
        profitFactor: 1.2,
        totalTrades: 5,
      };

      const recommendations = generateBacktestRecommendations(result);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.includes('taxa de acerto') || r.includes('Stop Loss'))).toBe(true);
    });
  });

  describe('Question Type Detection', () => {
    it('deve detectar pergunta sobre indicador', () => {
      const type = detectQuestionType('Como usar RSI?');
      
      expect(type).toBe('indicator');
    });

    it('deve detectar pergunta sobre estratégia', () => {
      const type = detectQuestionType('Como conectar blocos?');
      
      expect(type).toBe('strategy');
    });

    it('deve detectar pergunta sobre backtest', () => {
      const type = detectQuestionType('Como interpretar resultados?');
      
      expect(type).toBe('backtest');
    });

    it('deve detectar pergunta sobre erro', () => {
      const type = detectQuestionType('Recebi um erro na estratégia');
      
      expect(type).toBe('error');
    });
  });
});
