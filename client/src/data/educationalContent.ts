export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: number; // em minutos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  videoUrl?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  example: string;
  category: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  lessons: string[]; // IDs das aulas
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // em horas
}

export const lessons: Lesson[] = [
  {
    id: 'intro-stocks',
    title: 'Introdução ao Mercado de Ações',
    description: 'Aprenda os conceitos básicos do mercado de ações brasileiro',
    content: `
# Introdução ao Mercado de Ações

## O que é uma ação?
Uma ação é uma fração do capital de uma empresa. Quando você compra uma ação, você se torna sócio da empresa.

## Por que investir em ações?
- Potencial de ganho com valorização
- Recebimento de dividendos
- Participação nos lucros da empresa

## Como funciona a B3?
A B3 (Brasil, Bolsa, Balcão) é a bolsa de valores brasileira onde as ações são negociadas.

## Tipos de ações
- **Ações Ordinárias (ON)**: Direito a voto
- **Ações Preferenciais (PN)**: Prioridade em dividendos

## Risco e Retorno
Quanto maior o potencial de retorno, maior o risco envolvido.
    `,
    duration: 15,
    difficulty: 'beginner',
    category: 'Fundamentos',
  },
  {
    id: 'rsi-indicator',
    title: 'Indicador RSI (Relative Strength Index)',
    description: 'Entenda como usar o RSI para identificar oportunidades de compra e venda',
    content: `
# Indicador RSI

## O que é RSI?
O RSI (Relative Strength Index) é um indicador técnico que mede a força de um movimento de preço.

## Como funciona?
- Varia de 0 a 100
- RSI > 70: Ativo pode estar sobrecomprado
- RSI < 30: Ativo pode estar sobrevendido

## Interpretação
- **Sobrecomprado**: Possível reversão para baixa
- **Sobrevendido**: Possível reversão para alta

## Exemplo prático
Se PETR4 tem RSI de 25, pode ser um bom momento para comprar.

## Limitações
O RSI não é infalível. Use em conjunto com outros indicadores.
    `,
    duration: 12,
    difficulty: 'intermediate',
    category: 'Indicadores Técnicos',
  },
  {
    id: 'moving-average',
    title: 'Média Móvel Simples',
    description: 'Aprenda a usar médias móveis para identificar tendências',
    content: `
# Média Móvel Simples

## O que é?
A média móvel simples (SMA) é a média aritmética dos preços em um período.

## Cálculo
SMA = (P1 + P2 + P3 + ... + Pn) / n

## Interpretação
- Preço acima da SMA: Tendência de alta
- Preço abaixo da SMA: Tendência de baixa

## Períodos comuns
- 20 dias: Curto prazo
- 50 dias: Médio prazo
- 200 dias: Longo prazo

## Exemplo
Se VALE3 está acima da SMA de 50 dias, a tendência é de alta.
    `,
    duration: 10,
    difficulty: 'beginner',
    category: 'Indicadores Técnicos',
  },
  {
    id: 'stop-loss',
    title: 'Stop Loss e Take Profit',
    description: 'Proteja seus investimentos com stop loss e maximize ganhos com take profit',
    content: `
# Stop Loss e Take Profit

## O que é Stop Loss?
Stop Loss é uma ordem que vende automaticamente quando o preço cai a um nível pré-determinado.

## Benefícios
- Limita perdas
- Remove emoção da decisão
- Protege seu capital

## O que é Take Profit?
Take Profit é uma ordem que vende automaticamente quando o preço sobe a um nível alvo.

## Exemplo
Você compra PETR4 a R$ 28:
- Stop Loss: R$ 26 (limita perda a R$ 2)
- Take Profit: R$ 32 (garante ganho de R$ 4)

## Regra 2:1
Procure ter Take Profit 2x maior que Stop Loss.
    `,
    duration: 8,
    difficulty: 'beginner',
    category: 'Gestão de Risco',
  },
];

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: 'acao',
    term: 'Ação',
    definition: 'Fração do capital de uma empresa. Representa propriedade parcial.',
    example: 'PETR4 é uma ação da Petrobras.',
    category: 'Fundamentos',
  },
  {
    id: 'b3',
    term: 'B3',
    definition: 'Brasil, Bolsa, Balcão - bolsa de valores brasileira.',
    example: 'Todas as ações brasileiras são negociadas na B3.',
    category: 'Mercado',
  },
  {
    id: 'ibovespa',
    term: 'Ibovespa',
    definition: 'Índice da bolsa de valores brasileira. Representa as 100 maiores empresas.',
    example: 'O Ibovespa subiu 2% hoje.',
    category: 'Índices',
  },
  {
    id: 'dividendo',
    term: 'Dividendo',
    definition: 'Parte do lucro da empresa distribuída aos acionistas.',
    example: 'A empresa pagou R$ 2 de dividendo por ação.',
    category: 'Renda',
  },
  {
    id: 'volatilidade',
    term: 'Volatilidade',
    definition: 'Medida de variação do preço de um ativo. Alta volatilidade = maior risco.',
    example: 'Ações de startups têm alta volatilidade.',
    category: 'Risco',
  },
  {
    id: 'tendencia',
    term: 'Tendência',
    definition: 'Direção geral do movimento do preço (alta, baixa ou lateral).',
    example: 'VALE3 está em tendência de alta.',
    category: 'Análise Técnica',
  },
  {
    id: 'suporte',
    term: 'Suporte',
    definition: 'Nível de preço onde a demanda é forte e o preço tende a parar de cair.',
    example: 'PETR4 tem suporte em R$ 28.',
    category: 'Análise Técnica',
  },
  {
    id: 'resistencia',
    term: 'Resistência',
    definition: 'Nível de preço onde a oferta é forte e o preço tende a parar de subir.',
    example: 'ITUB4 tem resistência em R$ 35.',
    category: 'Análise Técnica',
  },
];

export const learningPaths: LearningPath[] = [
  {
    id: 'beginner-path',
    title: 'Iniciante: Primeiros Passos',
    description: 'Comece do zero e aprenda os fundamentos do mercado de ações',
    lessons: ['intro-stocks', 'stop-loss'],
    difficulty: 'beginner',
    estimatedTime: 0.5,
  },
  {
    id: 'technical-analysis',
    title: 'Análise Técnica Básica',
    description: 'Aprenda a ler gráficos e usar indicadores técnicos',
    lessons: ['moving-average', 'rsi-indicator', 'stop-loss'],
    difficulty: 'intermediate',
    estimatedTime: 1,
  },
  {
    id: 'risk-management',
    title: 'Gestão de Risco',
    description: 'Proteja seu capital e maximize seus ganhos',
    lessons: ['stop-loss'],
    difficulty: 'beginner',
    estimatedTime: 0.25,
  },
];

export const categories = [
  'Fundamentos',
  'Indicadores Técnicos',
  'Gestão de Risco',
  'Análise Técnica',
  'Mercado',
  'Índices',
  'Renda',
];
