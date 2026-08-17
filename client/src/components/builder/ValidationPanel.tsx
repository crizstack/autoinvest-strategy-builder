/**
 * Painel de Validação Visual
 * Exibe erros e avisos em tempo real
 */

import { AlertCircle, CheckCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import type { ValidationResult } from '@/hooks/useStrategyValidation';

interface ValidationPanelProps {
  validation: ValidationResult;
  isValidating?: boolean;
}

export default function ValidationPanel({
  validation,
  isValidating = false,
}: ValidationPanelProps) {
  if (!validation.errors.length && !validation.warnings.length) {
    return (
      <div className="p-4 bg-[#38A636]/10 border border-[#38A636]/30 rounded-lg flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-[#76E821] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[#76E821]">Estratégia Válida</p>
          <p className="text-xs text-[#76E821]/70 mt-1">Pronta para ser salva e executada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Erros */}
      {validation.errors.length > 0 && (
        <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-sm font-semibold text-red-400">
              {validation.errors.length} Erro{validation.errors.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ul className="space-y-2">
            {validation.errors.map((error, idx) => (
              <li key={idx} className="text-xs text-red-400/80 flex items-start gap-2">
                <span className="text-red-400 mt-1">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Avisos */}
      {validation.warnings.length > 0 && (
        <div className="p-4 bg-amber-600/10 border border-amber-600/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <p className="text-sm font-semibold text-amber-400">
              {validation.warnings.length} Aviso{validation.warnings.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ul className="space-y-2">
            {validation.warnings.map((warning, idx) => (
              <li key={idx} className="text-xs text-amber-400/80 flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sugestões */}
      {validation.errors.length > 0 && (
        <div className="p-4 bg-[#38A636]/10 border border-[#38A636]/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-[#76E821]" />
            <p className="text-sm font-semibold text-[#76E821]">Sugestões</p>
          </div>
          <ul className="space-y-2 text-xs text-[#76E821]/80">
            {validation.errors.some(e => e.includes('Trigger')) && (
              <li className="flex items-start gap-2">
                <span className="text-[#76E821] mt-1">→</span>
                <span>Comece com um bloco Trigger (Preço, Cruzamento, etc)</span>
              </li>
            )}
            {validation.errors.some(e => e.includes('Ação')) && (
              <li className="flex items-start gap-2">
                <span className="text-[#76E821] mt-1">→</span>
                <span>Termine com uma Ação (Compra, Venda ou Fechar)</span>
              </li>
            )}
            {validation.orphanedNodeIds.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#76E821] mt-1">→</span>
                <span>Conecte todos os blocos ao fluxo principal</span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Status de Validação */}
      {isValidating && (
        <div className="p-3 bg-[#394939]/10 border border-[#6B756B]/30 rounded-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#6B756B] border-t-[#6B756B] rounded-full animate-spin" />
          <p className="text-xs text-[#B8C2B8]">Validando estratégia...</p>
        </div>
      )}
    </div>
  );
}

/**
 * Componente para exibir erro em um node específico
 */
export function NodeErrorBadge({ error }: { error: string }) {
  return (
    <div className="absolute -top-8 left-0 bg-red-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-50">
      {error}
    </div>
  );
}

/**
 * Componente para exibir aviso em um node específico
 */
export function NodeWarningBadge({ warning }: { warning: string }) {
  return (
    <div className="absolute -top-8 left-0 bg-amber-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-50">
      {warning}
    </div>
  );
}
