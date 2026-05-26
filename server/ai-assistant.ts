import { invokeLLM } from './_core/llm';
import type { Message } from '@/types/ai';
import { ContextualAIService } from './ai/contextual-service';
import { AnalysisEngine } from './ai/analysis-engine';

/**
 * AIAssistant Service
 * Gerencia interações com IA e contexto inteligente
 */

export interface AIAssistantOptions {
  context?: {
    page?: string;
    userRole?: string;
    currentPlan?: string;
    strategyName?: string;
    selectedAsset?: string;
  };
  conversationHistory?: Message[];
}

const SYSTEM_PROMPT = `Você é o AutoInvest AI, um assistente inteligente para a plataforma AutoInvest Strategy Builder.

Seu objetivo é:
1. Educar usuários sobre indicadores financeiros e trading
2. Ajudar na criação e compreensão de estratégias
3. Explicar funcionalidades da plataforma
4. **Explicar erros e problemas** do usuário
5. **Interpretar e analisar estratégias** criadas
6. **Sugerir melhorias** de forma educativa
7. **Explicar indicadores técnicos** de forma simples
8. **Analisar resultados de backtest** e métricas

IMPORTANTE - Você NUNCA deve:
- Prometer ganhos ou retornos específicos
- Prever o comportamento do mercado
- Agir como consultor financeiro
- Recomendar compra/venda direta de ativos
- Dar recomendações financeiras diretas

SEMPRE inclua em respostas sobre investimentos:
"⚠️ Isso não é recomendação financeira. Faça sua própria pesquisa."

RESPOSTAS CONCISAS E EDUCATIVAS:
⚡ Máximo 2-3 linhas por resposta
⚡ Linguagem simples e objetiva
⚡ Evite textos longos
⚡ Use bullets para organizar
⚡ Se precisar mais detalhes, usuário pedirá
⚡ Sempre explique o "porquê" não apenas o "o quê"

Mantenha respostas:
- Educacionais e simples
- Focadas na plataforma quando relevante
- Seguras e responsáveis
- Amigáveis e acessíveis
- Úteis para aprendizado`;

const CONTEXT_PROMPTS: Record<string, string> = {
  builder: `O usuário está no Strategy Builder. Foque em:
- Como usar blocos (Trigger, Indicadores, Ações, Proteções)
- Como conectar blocos
- Validação de estratégias
- Exemplos práticos de estratégias`,

  market: `O usuário está no módulo de Mercado. Foque em:
- Análise de ativos
- Leitura de gráficos
- Indicadores técnicos
- Identificação de oportunidades`,

  backtest: `O usuário está no Backtest. Foque em:
- Interpretação de métricas (Win Rate, Sharpe Ratio, Drawdown, etc)
- Análise de performance histórica
- Explicação de resultados de forma educativa
- Sugestões de melhorias baseadas em dados
- Otimização de estratégias
- Identificação de pontos fracos
- Comparação com benchmarks`,

  trades: `O usuário está vendo histórico de Trades. Foque em:
- Análise de performance
- Gestão de risco
- Aprendizado com operações
- Melhorias para próximas operações`,

  strategies: `O usuário está gerenciando Estratégias. Foque em:
- Interpretação e análise de estratégias
- Explicação de lógica e fluxo
- Sugestões de melhorias
- Identificação de erros ou problemas
- Criação de novas estratégias
- Edição de estratégias existentes
- Ativação/desativação
- Comparação de estratégias`,

  dashboard: `O usuário está no Dashboard. Foque em:
- Visão geral da plataforma
- Próximos passos
- Funcionalidades principais
- Onboarding
- Análise de performance geral
- Interpretação de métricas
- Sugestões de ações`
};

export async function generateAIResponse(
  userMessage: string,
  userId?: number,
  options: AIAssistantOptions = {}
): Promise<string> {
  const { context = {}, conversationHistory = [] } = options;

  // Construir contexto adicional
  let contextPrompt = '';
  if (context.page && CONTEXT_PROMPTS[context.page]) {
    contextPrompt = `\n\n[CONTEXTO: ${CONTEXT_PROMPTS[context.page]}]`;
  }

  if (context.strategyName) {
    contextPrompt += `\nO usuário está trabalhando com a estratégia: "${context.strategyName}"`;
  }

  if (context.selectedAsset) {
    contextPrompt += `\nAtivo selecionado: ${context.selectedAsset}`;
  }

  // Adicionar contexto do usuário se disponível
  if (userId) {
    try {
      const userContext = await ContextualAIService.getUserContext(userId);
      const contextSummary = ContextualAIService.generateContextSummary(userContext);
      contextPrompt += contextSummary;
    } catch (error) {
      console.warn('[AI] Error loading user context:', error);
    }
  }

  // Construir histórico de conversa
  const messages = [
    {
      role: 'system' as const,
      content: SYSTEM_PROMPT + contextPrompt,
    },
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  try {
    const response = await invokeLLM({
      messages,
    });

    const assistantMessage = response.choices?.[0]?.message?.content;
    if (typeof assistantMessage === 'string') {
      // Limitar resposta a 1000 caracteres para manter concisão
      const maxLength = 1000;
      if (assistantMessage.length > maxLength) {
        return assistantMessage.substring(0, maxLength).trim() + '...';
      }
      return assistantMessage;
    }
    return '';
  } catch (error) {
    console.error('Erro ao gerar resposta IA:', error);
    throw new Error('Falha ao gerar resposta. Tente novamente.');
  }
}

/**
 * Gera sugestões rápidas baseadas no contexto
 */
export function getSuggestionsForContext(page: string): string[] {
  const suggestions: Record<string, string[]> = {
    builder: [
      'Como criar uma estratégia RSI?',
      'Quais blocos devo usar?',
      'Como conectar blocos?',
      'O que é um Trigger?',
    ],
    market: [
      'Como ler um gráfico?',
      'O que é RSI?',
      'Como identificar tendências?',
      'Qual ativo escolher?',
    ],
    backtest: [
      'Como interpretar os resultados?',
      'O que é Sharpe Ratio?',
      'Como otimizar minha estratégia?',
      'O que é Drawdown?',
    ],
    trades: [
      'Como melhorar minha taxa de acerto?',
      'Como gerenciar risco?',
      'O que é Stop Loss?',
      'Como calcular Take Profit?',
    ],
    strategies: [
      'Que tipo de estratégia criar?',
      'Como comparar estratégias?',
      'Qual é a melhor estratégia?',
      'Como testar uma estratégia?',
    ],
    dashboard: [
      'Como começar?',
      'Qual é o primeiro passo?',
      'Como criar uma estratégia?',
      'O que é paper trading?',
    ],
  };

  return suggestions[page] || [
    'Como usar a plataforma?',
    'O que é trading?',
    'Como criar uma estratégia?',
    'Qual é o melhor indicador?',
  ];
}

/**
 * Validar se mensagem é segura (sem pedidos perigosos)
 */
export function isMessageSafe(message: string): boolean {
  const dangerousKeywords = [
    'ganho garantido',
    'vai ficar rico',
    'prometo',
    'recomendo',
    'recomenda',
    'certeza de lucro',
    'sem risco',
    'não tem risco',
  ];

  const lowerMessage = message.toLowerCase();
  return !dangerousKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Formatar resposta com disclaimer se necessário
 */
export function formatAIResponse(message: string, includeDisclaimer: boolean = false): string {
  if (includeDisclaimer && !message.includes('⚠️')) {
    return `${message}\n\n⚠️ Isso não é recomendação financeira. Faça sua própria pesquisa.`;
  }
  return message;
}


/**
 * Base de conhecimento sobre indicadores técnicos
 */
const INDICATOR_KNOWLEDGE: Record<string, { name: string; description: string; range?: string; interpretation: string }> = {
  rsi: {
    name: 'RSI (Relative Strength Index)',
    description: 'Mede a força do movimento de preço',
    range: '0-100',
    interpretation: 'Acima de 70: sobrecomprado | Abaixo de 30: sobrevendido',
  },
  macd: {
    name: 'MACD (Moving Average Convergence Divergence)',
    description: 'Identifica mudanças de tendência através de médias móveis',
    interpretation: 'Cruzamento de linhas: sinal de mudança | Divergência: possível reversão',
  },
  ma: {
    name: 'Média Móvel (MA)',
    description: 'Suaviza preços para identificar tendências',
    interpretation: 'Preço acima: tendência de alta | Preço abaixo: tendência de baixa',
  },
  bollinger: {
    name: 'Bandas de Bollinger',
    description: 'Mede volatilidade e níveis de preço extremos',
    interpretation: 'Preço na banda superior: possível queda | Na inferior: possível alta',
  },
  stochastic: {
    name: 'Estocástico',
    description: 'Compara preço de fechamento com faixa de preços',
    range: '0-100',
    interpretation: 'Acima de 80: sobrecomprado | Abaixo de 20: sobrevendido',
  },
};

/**
 * Explicar um indicador de forma educativa
 */
export function explainIndicator(indicatorName: string): string {
  const normalized = indicatorName.toLowerCase().replace(/[^a-z]/g, '');
  const indicator = Object.entries(INDICATOR_KNOWLEDGE).find(
    ([key]) => normalized.includes(key) || key.includes(normalized)
  )?.[1];

  if (!indicator) {
    return `Não encontrei informações sobre "${indicatorName}". Tente: RSI, MACD, Média Móvel, Bandas de Bollinger ou Estocástico.`;
  }

  let explanation = `**${indicator.name}**\n${indicator.description}`;
  if (indicator.range) {
    explanation += `\nFaixa: ${indicator.range}`;
  }
  explanation += `\nInterpretação: ${indicator.interpretation}`;

  return explanation;
}

/**
 * Análise de estratégia para sugestões de melhorias
 */
export interface StrategyAnalysis {
  hasAsset: boolean;
  hasTrigger: boolean;
  hasCondition: boolean;
  hasAction: boolean;
  hasRiskManagement: boolean;
  issues: string[];
  suggestions: string[];
}

export function analyzeStrategy(strategyData: any): StrategyAnalysis {
  const analysis: StrategyAnalysis = {
    hasAsset: !!strategyData?.asset,
    hasTrigger: !!strategyData?.blocks?.some((b: any) => b.type === 'trigger'),
    hasCondition: !!strategyData?.blocks?.some((b: any) => b.type === 'condition'),
    hasAction: !!strategyData?.blocks?.some((b: any) => b.type === 'action'),
    hasRiskManagement: !!strategyData?.blocks?.some((b: any) => b.type === 'risk'),
    issues: [],
    suggestions: [],
  };

  // Verificar problemas
  if (!analysis.hasAsset) analysis.issues.push('Ativo não selecionado');
  if (!analysis.hasTrigger) analysis.issues.push('Falta Trigger (gatilho)');
  if (!analysis.hasAction) analysis.issues.push('Falta Ação (compra/venda)');
  if (!analysis.hasRiskManagement) analysis.suggestions.push('Considere adicionar Stop Loss ou Take Profit');

  // Sugestões de melhoria
  if (analysis.hasAction && !analysis.hasRiskManagement) {
    analysis.suggestions.push('Proteja seus ganhos com Take Profit');
    analysis.suggestions.push('Limite perdas com Stop Loss');
  }
  if (analysis.hasTrigger && !analysis.hasCondition) {
    analysis.suggestions.push('Adicione condições para refinar o gatilho');
  }

  return analysis;
}

/**
 * Base de conhecimento sobre métricas de backtest
 */
const BACKTEST_METRICS: Record<string, { name: string; explanation: string; goodRange?: string }> = {
  winRate: {
    name: 'Taxa de Acerto (Win Rate)',
    explanation: 'Percentual de operações lucrativas',
    goodRange: 'Acima de 50% é positivo',
  },
  sharpeRatio: {
    name: 'Sharpe Ratio',
    explanation: 'Mede retorno ajustado pelo risco',
    goodRange: 'Acima de 1.0 é bom',
  },
  drawdown: {
    name: 'Drawdown Máximo',
    explanation: 'Maior queda de saldo durante o período',
    goodRange: 'Menor é melhor',
  },
  profitFactor: {
    name: 'Profit Factor',
    explanation: 'Razão entre ganhos totais e perdas totais',
    goodRange: 'Acima de 1.5 é bom',
  },
  returnPercent: {
    name: 'Retorno (%)',
    explanation: 'Ganho total em percentual',
    goodRange: 'Depende do período testado',
  },
};

/**
 * Explicar métrica de backtest
 */
export function explainBacktestMetric(metricName: string): string {
  const normalized = metricName.toLowerCase().replace(/[^a-z]/g, '');
  
  // Procurar por correspondência melhorada
  let metric: any = null;
  
  for (const [key, m] of Object.entries(BACKTEST_METRICS)) {
    const keyNorm = key.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.includes(keyNorm) || keyNorm.includes(normalized) || 
        m.name.toLowerCase().includes(metricName.toLowerCase())) {
      metric = m;
      break;
    }
  }

  if (!metric) {
    return `Métrica "${metricName}" não encontrada. Disponíveis: Win Rate, Sharpe Ratio, Drawdown, Profit Factor, Retorno.`;
  }

  let explanation = `**${metric.name}**\n${metric.explanation}`;
  if (metric.goodRange) {
    explanation += `\n${metric.goodRange}`;
  }

  return explanation;
}

/**
 * Detectar tipo de pergunta do usuário
 */
export function detectQuestionType(message: string): 'indicator' | 'strategy' | 'backtest' | 'error' | 'general' {
  const lower = message.toLowerCase();

  // Verificar erro PRIMEIRO (antes de estratégia)
  if (lower.includes('erro') || lower.includes('problema') || lower.includes('não funciona') ||
      lower.includes('quebrou') || lower.includes('errado')) {
    return 'error';
  }

  if (lower.includes('rsi') || lower.includes('macd') || lower.includes('média móvel') || 
      lower.includes('bollinger') || lower.includes('estocástico') || lower.includes('indicador')) {
    return 'indicator';
  }

  if (lower.includes('estratégia') || lower.includes('bloco') || lower.includes('trigger') ||
      lower.includes('condição') || lower.includes('ação') || lower.includes('proteção')) {
    return 'strategy';
  }

  if (lower.includes('backtest') || lower.includes('resultado') || lower.includes('métrica') ||
      lower.includes('win rate') || lower.includes('sharpe') || lower.includes('drawdown')) {
    return 'backtest';
  }

  return 'general';
}


/**
 * Base de conhecimento sobre erros comuns
 */
const COMMON_ERRORS: Record<string, { problem: string; cause: string; solution: string }> = {
  'no_asset': {
    problem: 'Nenhum ativo selecionado',
    cause: 'Você não escolheu um ativo para a estratégia',
    solution: 'Clique em "Selecionar Ativo" e escolha um ativo B3 (ex: PETR4, VALE3)',
  },
  'no_trigger': {
    problem: 'Falta Trigger (gatilho)',
    cause: 'Toda estratégia precisa de um gatilho para iniciar',
    solution: 'Arraste um bloco de Trigger (ex: Preço, Indicador) para o builder',
  },
  'no_action': {
    problem: 'Falta Ação (compra/venda)',
    cause: 'Estratégia sem ação não executa operações',
    solution: 'Adicione um bloco de Ação (Comprar ou Vender) após a condição',
  },
  'disconnected_blocks': {
    problem: 'Blocos desconectados',
    cause: 'Blocos não estão conectados corretamente',
    solution: 'Arraste a seta de um bloco para outro para conectar. Ordem: Trigger → Indicador → Ação → Risco',
  },
  'no_risk_management': {
    problem: 'Sem proteção de risco',
    cause: 'Estratégia sem Stop Loss ou Take Profit é arriscada',
    solution: 'Adicione blocos de Stop Loss e Take Profit para proteger seus ganhos',
  },
};

/**
 * Analisar erro e fornecer solução educativa
 */
export function analyzeError(errorMessage: string): { problem: string; cause: string; solution: string } | null {
  const normalized = errorMessage.toLowerCase();

  // Verificar se é uma chave direta
  if (COMMON_ERRORS[errorMessage]) {
    return COMMON_ERRORS[errorMessage];
  }

  // Procurar por erro conhecido
  for (const [key, error] of Object.entries(COMMON_ERRORS)) {
    if (normalized.includes(key.replace(/_/g, ' ')) || 
        normalized.includes(error.problem.toLowerCase())) {
      return error;
    }
  }

  // Se não encontrar erro específ ico, retornar null
  return null;
}

/**
 * Gerar sugestões de melhoria baseadas em análise
 */
export function generateImprovementSuggestions(strategyData: any): string[] {
  const suggestions: string[] = [];
  const analysis = analyzeStrategy(strategyData);

  // Sugestões baseadas em problemas
  if (analysis.issues.length > 0) {
    suggestions.push(`Corrija: ${analysis.issues.join(', ')}`);
  }

  // Sugestões baseadas em análise
  if (analysis.suggestions.length > 0) {
    suggestions.push(...analysis.suggestions);
  }

  // Sugestões gerais de otimização
  if (analysis.hasAction && analysis.hasRiskManagement) {
    suggestions.push('Teste sua estratégia com Backtest antes de usar');
    suggestions.push('Comece com paper trading para validar em tempo real');
  }

  if (!analysis.hasCondition && analysis.hasTrigger) {
    suggestions.push('Adicione condições para filtrar sinais falsos');
  }

  return suggestions.length > 0 ? suggestions : ['Estratégia parece bem estruturada! Teste com Backtest.'];
}

/**
 * Formatar análise de erro para resposta educativa
 */
export function formatErrorExplanation(error: { problem: string; cause: string; solution: string }): string {
  return `**${error.problem}**\n\n**Por quê:** ${error.cause}\n\n**Como resolver:** ${error.solution}`;
}


/**
 * Análise de resultados de backtest
 */
export interface BacktestResult {
  totalReturn?: number;
  winRate?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  profitFactor?: number;
  totalTrades?: number;
  winningTrades?: number;
  losingTrades?: number;
}

/**
 * Avaliar qualidade de um backtest
 */
export function evaluateBacktestQuality(result: BacktestResult): { rating: 'excellent' | 'good' | 'fair' | 'poor'; feedback: string[] } {
  const feedback: string[] = [];
  let score = 0;

  // Avaliar Win Rate
  if (result.winRate !== undefined) {
    if (result.winRate >= 60) {
      feedback.push('✅ Taxa de acerto excelente (acima de 60%)');
      score += 2;
    } else if (result.winRate >= 50) {
      feedback.push('✓ Taxa de acerto positiva (acima de 50%)');
      score += 1;
    } else {
      feedback.push('⚠️ Taxa de acerto baixa (abaixo de 50%)');
    }
  }

  // Avaliar Sharpe Ratio
  if (result.sharpeRatio !== undefined) {
    if (result.sharpeRatio >= 1.5) {
      feedback.push('✅ Excelente retorno ajustado pelo risco');
      score += 2;
    } else if (result.sharpeRatio >= 1.0) {
      feedback.push('✓ Bom retorno ajustado pelo risco');
      score += 1;
    } else {
      feedback.push('⚠️ Retorno ajustado pelo risco baixo');
    }
  }

  // Avaliar Drawdown
  if (result.maxDrawdown !== undefined) {
    if (result.maxDrawdown <= 15) {
      feedback.push('✅ Drawdown controlado (abaixo de 15%)');
      score += 2;
    } else if (result.maxDrawdown <= 30) {
      feedback.push('✓ Drawdown aceitável (15-30%)');
      score += 1;
    } else {
      feedback.push('⚠️ Drawdown alto (acima de 30%)');
    }
  }

  // Avaliar Profit Factor
  if (result.profitFactor !== undefined) {
    if (result.profitFactor >= 2.0) {
      feedback.push('✅ Excelente profit factor (acima de 2.0)');
      score += 2;
    } else if (result.profitFactor >= 1.5) {
      feedback.push('✓ Bom profit factor (1.5-2.0)');
      score += 1;
    } else {
      feedback.push('⚠️ Profit factor baixo (abaixo de 1.5)');
    }
  }

  // Determinar rating
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 7) {
    rating = 'excellent';
  } else if (score >= 5) {
    rating = 'good';
  } else if (score >= 3) {
    rating = 'fair';
  } else {
    rating = 'poor';
  }

  return { rating, feedback };
}

/**
 * Gerar recomendações baseadas em backtest
 */
export function generateBacktestRecommendations(result: BacktestResult): string[] {
  const recommendations: string[] = [];
  const evaluation = evaluateBacktestQuality(result);

  // Recomendações baseadas em rating
  if (evaluation.rating === 'excellent') {
    recommendations.push('Estratégia está bem otimizada! Considere fazer paper trading.');
  } else if (evaluation.rating === 'good') {
    recommendations.push('Resultados bons. Pode testar em paper trading com cautela.');
  } else if (evaluation.rating === 'fair') {
    recommendations.push('Resultados aceitáveis. Considere otimizar antes de usar.');
  } else {
    recommendations.push('Resultados fracos. Revise a lógica da estratégia.');
  }

  // Recomendações específicas
  if (result.winRate && result.winRate < 50) {
    recommendations.push('Melhore o filtro de entrada para aumentar taxa de acerto.');
  }

  if (result.maxDrawdown && result.maxDrawdown > 30) {
    recommendations.push('Adicione ou ajuste Stop Loss para reduzir perdas máximas.');
  }

  if (result.totalTrades && result.totalTrades < 10) {
    recommendations.push('Poucos trades testados. Use período mais longo ou ajuste parâmetros.');
  }

  if (result.profitFactor && result.profitFactor < 1.5) {
    recommendations.push('Ganhos não compensam perdas. Revise a estratégia.');
  }

  return recommendations;
}

/**
 * Formatar análise de backtest para resposta educativa
 */
export function formatBacktestAnalysis(result: BacktestResult): string {
  const evaluation = evaluateBacktestQuality(result);
  const recommendations = generateBacktestRecommendations(result);

  let analysis = `**Análise do Backtest: ${evaluation.rating.toUpperCase()}**\n\n`;
  
  // Métricas
  if (result.winRate !== undefined) analysis += `📊 Taxa de Acerto: ${result.winRate.toFixed(1)}%\n`;
  if (result.sharpeRatio !== undefined) analysis += `📈 Sharpe Ratio: ${result.sharpeRatio.toFixed(2)}\n`;
  if (result.maxDrawdown !== undefined) analysis += `📉 Drawdown Máx: ${result.maxDrawdown.toFixed(1)}%\n`;
  if (result.profitFactor !== undefined) analysis += `💰 Profit Factor: ${result.profitFactor.toFixed(2)}\n`;
  if (result.totalReturn !== undefined) analysis += `💵 Retorno Total: ${result.totalReturn.toFixed(1)}%\n`;

  analysis += `\n**Feedback:**\n${evaluation.feedback.map(f => `• ${f}`).join('\n')}`;
  
  if (recommendations.length > 0) {
    analysis += `\n\n**Recomendações:**\n${recommendations.map(r => `• ${r}`).join('\n')}`;
  }

  return analysis;
}


/**
 * Gerar análise contextual completa
 */
export async function generateContextualAnalysis(userId: number): Promise<{
  risks: string[];
  suggestions: string[];
  insights: string[];
  recommendations: string[];
  nextAction: string;
}> {
  try {
    const analysis = await AnalysisEngine.analyzePortfolio(userId);
    const context = await ContextualAIService.getUserContext(userId);
    const nextAction = AnalysisEngine.getNextAction(context);

    return {
      risks: analysis.risks,
      suggestions: analysis.suggestions,
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      nextAction,
    };
  } catch (error) {
    console.error('[AI] Error generating contextual analysis:', error);
    return {
      risks: [],
      suggestions: [],
      insights: [],
      recommendations: [],
      nextAction: 'Comece criando sua primeira estratégia.',
    };
  }
}
