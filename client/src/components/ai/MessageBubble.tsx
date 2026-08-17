import { Message } from '@/types/ai';
import { Streamdown } from 'streamdown';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 mb-4 animate-fadeIn ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-[#38A636] text-white'
            : 'bg-gradient-to-br from-[#235317] to-[#76E821] text-white'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-md ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block px-4 py-3 rounded-lg ${
            isUser
              ? 'bg-[#38A636] text-white rounded-br-none'
              : 'bg-[#141C14] text-white rounded-bl-none border border-[#235317]/45'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#6B756B] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#6B756B] rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-[#6B756B] rounded-full animate-bounce delay-200" />
              </div>
              <span className="text-sm text-[#B8C2B8]">Digitando...</span>
            </div>
          ) : (
            <div className="text-sm leading-relaxed">
              {/* Se for resposta da IA, renderizar markdown */}
              {!isUser ? (
                <Streamdown>{message.content}</Streamdown>
              ) : (
                message.content
              )}
            </div>
          )}
        </div>

        {/* Ações */}
        {!message.isLoading && !isUser && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-[#1D2A1D] rounded transition-colors"
              title="Copiar mensagem"
            >
              {copied ? (
                <Check className="w-4 h-4 text-[#76E821]" />
              ) : (
                <Copy className="w-4 h-4 text-[#B8C2B8]" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
