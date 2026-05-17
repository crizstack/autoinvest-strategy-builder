import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatPanel from './ChatPanel';
import type { PageContext } from '@/types/ai';

interface AIAssistantButtonProps {
  pageContext?: PageContext;
}

export default function AIAssistantButton({
  pageContext = 'dashboard',
}: AIAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-40 ${
          isOpen ? 'scale-95' : ''
        }`}
        title="Abrir assistente IA"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Panel */}
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} pageContext={pageContext} />
    </>
  );
}
