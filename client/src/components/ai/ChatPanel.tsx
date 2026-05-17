import { useState, useRef, useEffect } from 'react';
import { Message, Suggestion, PageContext } from '@/types/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Trash2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SuggestionChips from './SuggestionChips';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext: PageContext;
}

export default function ChatPanel({ isOpen, onClose, pageContext }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiChatMutation = trpc.ai.chat.useMutation();

  // Scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar sugestões iniciais
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadInitialSuggestions();
    }
  }, [isOpen]);

  const loadInitialSuggestions = () => {
    const contextSuggestions: Record<PageContext, Suggestion[]> = {
      builder: [
        { id: '1', text: 'Como criar estratégia RSI?', icon: '🎯' },
        { id: '2', text: 'O que é um Trigger?', icon: '🔔' },
        { id: '3', text: 'Como conectar blocos?', icon: '🔗' },
      ],
      market: [
        { id: '1', text: 'Como ler um gráfico?', icon: '📊' },
        { id: '2', text: 'O que é RSI?', icon: '📈' },
        { id: '3', text: 'Como identificar tendências?', icon: '🎯' },
      ],
      backtest: [
        { id: '1', text: 'Como interpretar resultados?', icon: '📊' },
        { id: '2', text: 'O que é Sharpe Ratio?', icon: '📈' },
        { id: '3', text: 'Como otimizar estratégia?', icon: '⚙️' },
      ],
      trades: [
        { id: '1', text: 'Como melhorar taxa de acerto?', icon: '📈' },
        { id: '2', text: 'Como gerenciar risco?', icon: '🛡️' },
        { id: '3', text: 'O que é Stop Loss?', icon: '🛑' },
      ],
      strategies: [
        { id: '1', text: 'Que estratégia criar?', icon: '🎯' },
        { id: '2', text: 'Como comparar estratégias?', icon: '⚖️' },
        { id: '3', text: 'Como testar estratégia?', icon: '✅' },
      ],
      billing: [
        { id: '1', text: 'Qual plano escolher?', icon: '💳' },
        { id: '2', text: 'Qual a diferença dos planos?', icon: '📋' },
        { id: '3', text: 'Como fazer upgrade?', icon: '⬆️' },
      ],
      settings: [
        { id: '1', text: 'Como configurar perfil?', icon: '👤' },
        { id: '2', text: 'Como mudar senha?', icon: '🔐' },
        { id: '3', text: 'Como exportar dados?', icon: '💾' },
      ],
      dashboard: [
        { id: '1', text: 'Como começar?', icon: '🚀' },
        { id: '2', text: 'Como criar estratégia?', icon: '🎯' },
        { id: '3', text: 'O que é paper trading?', icon: '📝' },
      ],
      unknown: [
        { id: '1', text: 'Como usar a plataforma?', icon: '❓' },
        { id: '2', text: 'O que é trading?', icon: '📈' },
        { id: '3', text: 'Como criar estratégia?', icon: '🎯' },
      ],
    };

    setSuggestions(contextSuggestions[pageContext] || contextSuggestions.unknown);
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim()) return;

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSuggestions([]);
    setIsLoading(true);

    try {
      // Chamar API de IA
      const response = await aiChatMutation.mutateAsync({
        message: text,
        context: {
          page: pageContext,
        },
        conversationHistory: messages,
      });

      // Adicionar resposta da IA
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Carregar novas sugestões
      loadInitialSuggestions();
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    handleSendMessage(suggestion.text);
  };

  const handleClearChat = () => {
    setMessages([]);
    setSuggestions([]);
    loadInitialSuggestions();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 w-96 h-screen max-h-screen bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-50 animate-slideIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">AutoInvest AI</h2>
          <p className="text-xs text-purple-100">Seu assistente inteligente</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Limpar conversa"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-white font-semibold mb-2">Olá! Sou seu assistente IA</h3>
            <p className="text-slate-400 text-sm mb-4">
              Posso ajudar com dúvidas sobre a plataforma, indicadores financeiros e estratégias.
            </p>
            <p className="text-slate-500 text-xs">
              ⚠️ Não sou consultor financeiro. Sempre faça sua própria pesquisa.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="group">
            <MessageBubble message={message} />
          </div>
        ))}

        {isLoading && (
          <div className="group">
            <MessageBubble
              message={{
                id: 'loading',
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                isLoading: true,
              }}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length > 0 && suggestions.length > 0 && !isLoading && (
        <div className="px-4 pb-2">
          <SuggestionChips
            suggestions={suggestions}
            onSelect={handleSuggestionClick}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-800 p-4 bg-slate-950">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Faça uma pergunta..."
            className="bg-slate-900 border-slate-700 text-white placeholder-slate-500"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Pressione Enter para enviar • Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}
