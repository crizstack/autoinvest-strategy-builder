import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Bell, Trash2, CheckCheck } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons = {
  execution: '▶️',
  risk: '⚠️',
  market: '📊',
  system: '⚙️',
};

const severityColors = {
  info: 'border-blue-600/50 bg-blue-600/10',
  warning: 'border-yellow-600/50 bg-yellow-600/10',
  error: 'border-red-600/50 bg-red-600/10',
  success: 'border-green-600/50 bg-green-600/10',
};

const severityTextColors = {
  info: 'text-blue-300',
  warning: 'text-yellow-300',
  error: 'text-red-300',
  success: 'text-green-300',
};

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { data: notifications = [], refetch } = trpc.notifications.getAll.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.getUnreadCount.useQuery();

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteAllMutation = trpc.notifications.deleteAll.useMutation({
    onSuccess: () => refetch(),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-end z-50">
      <Card className="p-0 bg-slate-900 border-slate-800 w-full max-w-md h-screen max-h-screen flex flex-col rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Notificações</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 rounded-full bg-red-600 text-white text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex gap-2 p-4 border-b border-slate-800">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Marcar tudo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => deleteAllMutation.mutate()}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma notificação</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {notifications.map((notif: any) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-lg border transition-all ${
                    severityColors[notif.severity as keyof typeof severityColors]
                  } ${!notif.read ? 'ring-1 ring-blue-500' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeIcons[notif.type as keyof typeof typeIcons]}</span>
                        <h3 className="font-semibold text-white">{notif.title}</h3>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 ml-auto"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{notif.message}</p>
                      <p className={`text-xs ${severityTextColors[notif.severity as keyof typeof severityTextColors]}`}>
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          locale: ptBR,
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate({ id: notif.id })}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {notif.actionUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3 text-xs"
                      onClick={() => {
                        window.location.href = notif.actionUrl;
                        onClose();
                      }}
                    >
                      Ver detalhes
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
