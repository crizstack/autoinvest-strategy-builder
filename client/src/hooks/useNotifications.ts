import { useCallback } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export interface AlertOptions {
  type: 'execution' | 'risk' | 'market' | 'system';
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  strategyId?: number;
  actionUrl?: string;
  showToast?: boolean;
}

export function useNotifications() {
  const createMutation = trpc.notifications.create.useMutation();

  const notify = useCallback(
    async (options: AlertOptions) => {
      const { showToast = true, ...notificationData } = options;

      // Create notification in database
      await createMutation.mutateAsync(notificationData);

      // Show toast if enabled
      if (showToast) {
        const toastOptions = {
          description: notificationData.message,
        };

        switch (notificationData.severity) {
          case 'error':
            toast.error(notificationData.title, toastOptions);
            break;
          case 'warning':
            toast.warning(notificationData.title, toastOptions);
            break;
          case 'success':
            toast.success(notificationData.title, toastOptions);
            break;
          default:
            toast.info(notificationData.title, toastOptions);
        }
      }
    },
    [createMutation]
  );

  // Execution alerts
  const notifyExecution = useCallback(
    (message: string, strategyId?: number) => {
      notify({
        type: 'execution',
        title: '▶️ Estratégia Executada',
        message,
        severity: 'success',
        strategyId,
        showToast: true,
      });
    },
    [notify]
  );

  // Risk alerts
  const notifyRisk = useCallback(
    (title: string, message: string, strategyId?: number) => {
      notify({
        type: 'risk',
        title: `⚠️ ${title}`,
        message,
        severity: 'warning',
        strategyId,
        showToast: true,
      });
    },
    [notify]
  );

  // Market alerts
  const notifyMarket = useCallback(
    (message: string) => {
      notify({
        type: 'market',
        title: '📊 Alerta de Mercado',
        message,
        severity: 'info',
        showToast: true,
      });
    },
    [notify]
  );

  // System alerts
  const notifySystem = useCallback(
    (title: string, message: string, severity: 'info' | 'warning' | 'error' = 'info') => {
      notify({
        type: 'system',
        title: `⚙️ ${title}`,
        message,
        severity,
        showToast: true,
      });
    },
    [notify]
  );

  return {
    notify,
    notifyExecution,
    notifyRisk,
    notifyMarket,
    notifySystem,
  };
}
