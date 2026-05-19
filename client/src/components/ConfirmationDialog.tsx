import { useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  cancelLabel?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  requireConfirmation?: boolean;
  confirmationText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  actionLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  severity = 'medium',
  requireConfirmation = false,
  confirmationText,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const isConfirmed = !requireConfirmation || confirmationInput === confirmationText;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
      setConfirmationInput('');
    }
  };

  const handleCancel = () => {
    setConfirmationInput('');
    onCancel();
  };

  const severityStyles = {
    low: 'border-blue-500/30 bg-blue-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    high: 'border-orange-500/30 bg-orange-500/5',
    critical: 'border-red-500/30 bg-red-500/5',
  };

  const severityIconColor = {
    low: 'text-blue-400',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-red-400',
  };

  const actionButtonVariant = {
    low: 'default',
    medium: 'default',
    high: 'destructive',
    critical: 'destructive',
  } as const;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${severityIconColor[severity]}`} />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base mt-2">{description}</DialogDescription>
        </DialogHeader>

        <div className={`p-4 rounded-lg border ${severityStyles[severity]}`}>
          <div className="flex items-start gap-3">
            <Lock className={`w-4 h-4 mt-0.5 flex-shrink-0 ${severityIconColor[severity]}`} />
            <div className="text-sm text-muted-foreground">
              {severity === 'critical' && 'Esta ação é irreversível e não pode ser desfeita.'}
              {severity === 'high' && 'Esta ação causará mudanças significativas.'}
              {severity === 'medium' && 'Por favor, revise cuidadosamente antes de confirmar.'}
              {severity === 'low' && 'Confirme para continuar.'}
            </div>
          </div>
        </div>

        {requireConfirmation && confirmationText && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Digite <span className="font-mono bg-muted px-2 py-1 rounded">{confirmationText}</span> para confirmar
            </label>
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="Digite aqui"
              className="font-mono"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConfirming || isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={actionButtonVariant[severity]}
            onClick={handleConfirm}
            disabled={!isConfirmed || isConfirming || isLoading}
            className="min-w-[100px]"
          >
            {isConfirming || isLoading ? 'Processando...' : actionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook para gerenciar estado de confirmação
 */
export function useConfirmation() {
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    requireConfirmation?: boolean;
    confirmationText?: string;
    onConfirm?: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const confirm = async (options: {
    title: string;
    description: string;
    actionLabel?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    requireConfirmation?: boolean;
    confirmationText?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationState({
        isOpen: true,
        ...options,
        onConfirm: async () => {
          setIsLoading(true);
          try {
            resolve(true);
          } finally {
            setIsLoading(false);
            setConfirmationState((prev) => ({ ...prev, isOpen: false }));
          }
        },
      });
    });
  };

  const cancel = () => {
    setConfirmationState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    confirmationState,
    confirm,
    cancel,
    isLoading,
    Dialog: (
      <ConfirmationDialog
        {...confirmationState}
        isLoading={isLoading}
        onConfirm={() => confirmationState.onConfirm?.()}
        onCancel={cancel}
      />
    ),
  };
}
