import { invokeLLM } from './_core/llm';
import type { Message } from '@/types/ai';

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
4. Fornecer orientação clara e acessível

IMPORTANTE - Você NUNCA deve:
- Prometer ganhos ou retornos específicos
- Prever o comportamento do mercado
- Agir como consultor financeiro
- Recomendar compra/venda direta de ativos

SEMPRE inclua em respostas sobre investimentos:
"⚠️ Isso não é recomendação financeira. Faça sua própria pesquisa."

Mantenha respostas:
- Educacionais e simples
- Focadas na plataforma quando relevante
- Seguras e responsáveis
- Amigáveis e acessíveis`;

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
- Interpretação de métricas
- Análise de performance
- Otimização de estratégias
- Compreensão de resultados`,

  trades: `O usuário está vendo histórico de Trades. Foque em:
- Análise de performance
- Gestão de risco
- Aprendizado com operações
- Melhorias para próximas operações`,

  strategies: `O usuário está gerenciando Estratégias. Foque em:
- Criação de novas estratégias
- Edição de estratégias existentes
- Ativação/desativação
- Comparação de estratégias`,

  dashboard: `O usuário está no Dashboard. Foque em:
- Visão geral da plataforma
- Próximos passos
- Funcionalidades principais
- Onboarding`,
};

export async function generateAIResponse(
  userMessage: string,
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
