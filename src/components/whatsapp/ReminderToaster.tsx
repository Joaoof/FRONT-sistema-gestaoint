import { useEffect, useState } from 'react';
import { useSubscription } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ExternalLink } from 'lucide-react';
import { ON_WHATSAPP_REMINDER_DUE } from '../../graphql/queries/whatsapp-session';

interface DueReminder {
  id: string;
  peerNumber: string;
  title: string;
  description: string | null;
  tag: string | null;
  dueAt: string;
}

/**
 * Toaster global que escuta a subscription `whatsappReminderDue` e exibe um
 * card flutuante quando algum lembrete vence. Auto-dismiss após 30s.
 *
 * Uso: montar uma vez na raiz do app autenticado.
 */
export function WhatsappReminderToaster() {
  const [queue, setQueue] = useState<DueReminder[]>([]);

  useSubscription<{
    whatsappReminderDue: DueReminder;
  }>(ON_WHATSAPP_REMINDER_DUE, {
    onData: ({ data }) => {
      const r = data?.data?.whatsappReminderDue;
      if (!r) return;
      setQueue((prev) => {
        if (prev.some((x) => x.id === r.id)) return prev;
        return [r, ...prev].slice(0, 5);
      });
      // notificação do navegador
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`🔔 ${r.title}`, {
            body: r.description ?? 'Lembrete WhatsApp',
            icon: '/favicon.ico',
            tag: r.id,
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    },
  });

  // auto-dismiss
  useEffect(() => {
    if (queue.length === 0) return;
    const t = setTimeout(() => {
      setQueue((prev) => prev.slice(0, prev.length - 1));
    }, 30000);
    return () => clearTimeout(t);
  }, [queue.length]);

  const dismiss = (id: string) =>
    setQueue((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {queue.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="bg-white border-l-4 border-amber-500 shadow-2xl rounded-lg p-4 flex items-start gap-3 pointer-events-auto"
          >
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-800 text-sm truncate">
                {r.title}
              </div>
              {r.description && (
                <div className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                  {r.description}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                {r.tag && (
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                    #{r.tag}
                  </span>
                )}
                <span>{new Date(r.dueAt).toLocaleTimeString('pt-BR')}</span>
              </div>
              <a
                href={`/comunicacoes/whatsapp?peer=${encodeURIComponent(r.peerNumber)}`}
                className="inline-flex items-center gap-1 mt-2 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Abrir conversa <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <button
              onClick={() => dismiss(r.id)}
              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
