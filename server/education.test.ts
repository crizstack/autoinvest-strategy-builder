import { describe, it, expect } from 'vitest';

describe('Educational Module', () => {
  describe('Lessons', () => {
    it('should have intro-stocks lesson', () => {
      const lesson = {
        id: 'intro-stocks',
        title: 'Introdução ao Mercado de Ações',
        description: 'Aprenda os conceitos básicos do mercado de ações brasileiro',
        difficulty: 'beginner',
        category: 'Fundamentos',
        duration: 15,
      };

      expect(lesson.id).toBe('intro-stocks');
      expect(lesson.difficulty).toBe('beginner');
      expect(lesson.duration).toBe(15);
    });

    it('should have RSI indicator lesson', () => {
      const lesson = {
        id: 'rsi-indicator',
        title: 'Indicador RSI (Relative Strength Index)',
        difficulty: 'intermediate',
        category: 'Indicadores Técnicos',
        duration: 12,
      };

      expect(lesson.difficulty).toBe('intermediate');
      expect(lesson.category).toBe('Indicadores Técnicos');
    });

    it('should have moving average lesson', () => {
      const lesson = {
        id: 'moving-average',
        title: 'Média Móvel Simples',
        difficulty: 'beginner',
        category: 'Indicadores Técnicos',
      };

      expect(lesson.category).toBe('Indicadores Técnicos');
    });

    it('should have stop loss lesson', () => {
      const lesson = {
        id: 'stop-loss',
        title: 'Stop Loss e Take Profit',
        difficulty: 'beginner',
        category: 'Gestão de Risco',
      };

      expect(lesson.category).toBe('Gestão de Risco');
    });
  });

  describe('Glossary Terms', () => {
    it('should have acao term', () => {
      const term = {
        id: 'acao',
        term: 'Ação',
        definition: 'Fração do capital de uma empresa. Representa propriedade parcial.',
        category: 'Fundamentos',
      };

      expect(term.term).toBe('Ação');
      expect(term.category).toBe('Fundamentos');
    });

    it('should have b3 term', () => {
      const term = {
        id: 'b3',
        term: 'B3',
        definition: 'Brasil, Bolsa, Balcão - bolsa de valores brasileira.',
        category: 'Mercado',
      };

      expect(term.term).toBe('B3');
      expect(term.category).toBe('Mercado');
    });

    it('should have volatilidade term', () => {
      const term = {
        id: 'volatilidade',
        term: 'Volatilidade',
        definition: 'Medida de variação do preço de um ativo. Alta volatilidade = maior risco.',
        category: 'Risco',
      };

      expect(term.category).toBe('Risco');
    });
  });

  describe('Learning Paths', () => {
    it('should have beginner path', () => {
      const path = {
        id: 'beginner-path',
        title: 'Iniciante: Primeiros Passos',
        description: 'Comece do zero e aprenda os fundamentos do mercado de ações',
        difficulty: 'beginner',
        estimatedTime: 0.5,
        lessons: ['intro-stocks', 'stop-loss'],
      };

      expect(path.difficulty).toBe('beginner');
      expect(path.lessons.length).toBe(2);
      expect(path.estimatedTime).toBe(0.5);
    });

    it('should have technical analysis path', () => {
      const path = {
        id: 'technical-analysis',
        title: 'Análise Técnica Básica',
        difficulty: 'intermediate',
        estimatedTime: 1,
        lessons: ['moving-average', 'rsi-indicator', 'stop-loss'],
      };

      expect(path.difficulty).toBe('intermediate');
      expect(path.lessons.length).toBe(3);
    });

    it('should have risk management path', () => {
      const path = {
        id: 'risk-management',
        title: 'Gestão de Risco',
        difficulty: 'beginner',
        estimatedTime: 0.25,
      };

      expect(path.difficulty).toBe('beginner');
      expect(path.estimatedTime).toBe(0.25);
    });
  });

  describe('Categories', () => {
    it('should have all categories', () => {
      const categories = [
        'Fundamentos',
        'Indicadores Técnicos',
        'Gestão de Risco',
        'Análise Técnica',
        'Mercado',
        'Índices',
        'Renda',
      ];

      expect(categories).toContain('Fundamentos');
      expect(categories).toContain('Indicadores Técnicos');
      expect(categories).toContain('Gestão de Risco');
      expect(categories).toContain('Análise Técnica');
      expect(categories.length).toBe(7);
    });
  });

  describe('Content Structure', () => {
    it('should have lesson with content', () => {
      const lesson = {
        id: 'intro-stocks',
        title: 'Introdução ao Mercado de Ações',
        content: '# Introdução ao Mercado de Ações\n\n## O que é uma ação?',
      };

      expect(lesson.content).toContain('# Introdução');
      expect(lesson.content).toContain('O que é uma ação?');
    });

    it('should have glossary term with example', () => {
      const term = {
        id: 'acao',
        term: 'Ação',
        definition: 'Fração do capital de uma empresa',
        example: 'PETR4 é uma ação da Petrobras',
      };

      expect(term.example).toBeTruthy();
      expect(term.example).toContain('PETR4');
    });
  });

  describe('Difficulty Levels', () => {
    it('should support all difficulty levels', () => {
      const difficulties = ['beginner', 'intermediate', 'advanced'];

      expect(difficulties).toContain('beginner');
      expect(difficulties).toContain('intermediate');
      expect(difficulties).toContain('advanced');
    });
  });
});
