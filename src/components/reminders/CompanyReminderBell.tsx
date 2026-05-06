import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  CREATE_COMPANY_REMINDER,
  DELETE_COMPANY_REMINDER,
  GET_COMPANY_REMINDERS,
  ON_COMPANY_REMINDER_DUE,
  SNOOZE_COMPANY_REMINDER,
  TOGGLE_COMPANY_REMINDER_DONE,
} from '../../graphql/queries/timeline';

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: 'low' | 'normal' | 'high' | 'critical' | string;
  link: string | null;
  dueAt: string;
  doneAt: string | null;
  notifiedAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

const PRIORITY_STYLE: Record<
  string,
  { ring: string; bg: string; text: string; icon: string }
> = {
  low: {
    ring: 'ring-slate-300',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    icon: '○',
  },
  normal: {
    ring: 'ring-blue-300',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: '•',
  },
  high: {
    ring: 'ring-amber-400',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    icon: '⚠',
  },
  critical: {
    ring: 'ring-rose-400',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    icon: '🔥',
  },
};

const CATEGORIES = [
  { value: 'fiscal', label: '📋 Fiscal' },
  { value: 'financeiro', label: '💰 Financeiro' },
  { value: 'comercial', label: '🛒 Comercial' },
  { value: 'operacional', label: '🛠 Operacional' },
  { value: 'rh', label: '👥 RH' },
  { value: 'outros', label: '📌 Outros' },
];

/**
 * Som de notificação procedural via WebAudio (sem precisar arquivo .mp3).
 * Toca um sino curto chamando atenção sem ser invasivo.
 */
function playReminderSound() {
  try {
    const Ctx =
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext ?? window.AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const tones = [880, 1320, 1760];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = now + i * 0.18;
      const end = start + 0.4;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.start(start);
      osc.stop(end);
    });
    setTimeout(() => ctx.close().catch(() => undefined), 1500);
  } catch {
    /* noop */
  }
}

export function CompanyReminderBell() {
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [toasts, setToasts] = useState<Reminder[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('outros');
  const [priority, setPriority] = useState<string>('normal');
  const [dueAt, setDueAt] = useState<string>('');

  const { data, refetch } = useQuery<{ companyReminders: Reminder[] }>(
    GET_COMPANY_REMINDERS,
    {
      variables: { pending: true },
      fetchPolicy: 'cache-and-network',
      pollInterval: 60_000,
    },
  );

  const [createMut, { loading: creating }] = useMutation(CREATE_COMPANY_REMINDER);
  const [toggleMut] = useMutation(TOGGLE_COMPANY_REMINDER_DONE);
  const [snoozeMut] = useMutation(SNOOZE_COMPANY_REMINDER);
  const [deleteMut] = useMutation(DELETE_COMPANY_REMINDER);

  const reminders = data?.companyReminders ?? [];
  const now = useMemo(() => new Date(), []);
  const overdue = reminders.filter((r) => new Date(r.dueAt) <= now);
  const upcoming = reminders.filter((r) => new Date(r.dueAt) > now);
  const count = overdue.length;

  // Subscription tempo real — toca som + adiciona toast + pulsa o sino
  useSubscription<{ companyReminderDue: Reminder }>(ON_COMPANY_REMINDER_DUE, {
    onData: ({ data: sub }) => {
      const r = sub?.data?.companyReminderDue;
      if (!r) return;
      playReminderSound();
      setPulse(true);
      setTimeout(() => setPulse(false), 4000);
      setToasts((prev) => {
        if (prev.some((x) => x.id === r.id)) return prev;
        return [r, ...prev].slice(0, 5);
      });
      refetch();
      // Browser notification opcional
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          const n = new Notification(`🔔 ${r.title}`, {
            body: r.description ?? 'Lembrete vencido',
            icon: '/favicon.ico',
            tag: r.id,
            requireInteraction: r.priority === 'critical',
          });
          n.onclick = () => {
            window.focus();
            setOpen(true);
          };
        } else if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      }
    },
  });

  // Pulsa quando aparece overdue novo (carga inicial)
  const lastCountRef = useRef(0);
  useEffect(() => {
    if (count > lastCountRef.current) {
      setPulse(true);
      setTimeout(() => setPulse(false), 4000);
    }
    lastCountRef.current = count;
  }, [count]);

  const submit = async () => {
    if (!title.trim() || !dueAt) {
      alert('Informe título e data.');
      return;
    }
    try {
      await createMut({
        variables: {
          title,
          description: description || null,
          category,
          priority,
          dueAt: new Date(dueAt).toISOString(),
        },
      });
      setTitle('');
      setDescription('');
      setDueAt('');
      setShowCreate(false);
      await refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const dismissToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <>
      {/* Bell visível — fixed pra ficar sempre acessível */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Lembretes da empresa"
        className={`fixed top-4 right-4 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
          count > 0
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'bg-white text-slate-700 hover:bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10'
        } ${pulse ? 'animate-bounce' : ''}`}
      >
        <Bell className={`w-5 h-5 ${pulse ? 'animate-pulse' : ''}`} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {count > 99 ? '99+' : count}
          </span>
        )}
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-rose-500/40 animate-ping" />
        )}
      </button>

      {/* Toaster — quando lembrete dispara */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((r) => {
            const style =
              PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.normal;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                className={`bg-white shadow-2xl rounded-lg p-4 flex items-start gap-3 pointer-events-auto ring-2 ${style.ring}`}
              >
                <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center shrink-0 text-lg`}>
                  {style.icon}
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
                    {r.category && (
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                        {r.category}
                      </span>
                    )}
                    <span>{new Date(r.dueAt).toLocaleTimeString('pt-BR')}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={async () => {
                        await toggleMut({ variables: { id: r.id, done: true } });
                        dismissToast(r.id);
                        refetch();
                      }}
                      className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      <Check className="w-3 h-3" />
                      Concluído
                    </button>
                    <button
                      onClick={async () => {
                        await snoozeMut({
                          variables: { id: r.id, minutes: 15 },
                        });
                        dismissToast(r.id);
                        refetch();
                      }}
                      className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
                    >
                      <Clock className="w-3 h-3" />
                      Adiar 15min
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => dismissToast(r.id)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Drawer — lista de lembretes ativos */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/30 z-40"
            />
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed right-0 top-0 h-full w-[400px] max-w-full bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col border-l border-slate-200 dark:border-white/10"
            >
              <header className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
                <Bell className="w-5 h-5 text-rose-500" />
                <h2 className="font-bold text-slate-800 dark:text-white flex-1">
                  Lembretes da empresa
                </h2>
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-[11px] inline-flex items-center gap-1 px-2 py-1 bg-brand-600 text-white rounded hover:bg-brand-700"
                >
                  <Plus className="w-3 h-3" />
                  Novo
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto">
                {overdue.length > 0 && (
                  <section className="p-3">
                    <div className="text-[11px] uppercase tracking-wide font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Vencidos ({overdue.length})
                    </div>
                    <ul className="space-y-2">
                      {overdue.map((r) => (
                        <ReminderItem
                          key={r.id}
                          r={r}
                          onDone={async () => {
                            await toggleMut({
                              variables: { id: r.id, done: true },
                            });
                            refetch();
                          }}
                          onSnooze={async (min) => {
                            await snoozeMut({
                              variables: { id: r.id, minutes: min },
                            });
                            refetch();
                          }}
                          onDelete={async () => {
                            await deleteMut({ variables: { id: r.id } });
                            refetch();
                          }}
                        />
                      ))}
                    </ul>
                  </section>
                )}
                {upcoming.length > 0 && (
                  <section className="p-3">
                    <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-2">
                      Próximos ({upcoming.length})
                    </div>
                    <ul className="space-y-2">
                      {upcoming.map((r) => (
                        <ReminderItem
                          key={r.id}
                          r={r}
                          onDone={async () => {
                            await toggleMut({
                              variables: { id: r.id, done: true },
                            });
                            refetch();
                          }}
                          onSnooze={async (min) => {
                            await snoozeMut({
                              variables: { id: r.id, minutes: min },
                            });
                            refetch();
                          }}
                          onDelete={async () => {
                            await deleteMut({ variables: { id: r.id } });
                            refetch();
                          }}
                        />
                      ))}
                    </ul>
                  </section>
                )}
                {reminders.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <Bell className="w-12 h-12 mx-auto opacity-30 mb-3" />
                    <p className="text-sm">Nenhum lembrete pendente.</p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="mt-3 text-xs text-brand-600 hover:underline"
                    >
                      Criar primeiro lembrete
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modal de criação */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Novo lembrete
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Título
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pagar o GNRE até sexta"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-900 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-900"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-900"
                  >
                    <option value="low">○ Baixa</option>
                    <option value="normal">• Normal</option>
                    <option value="high">⚠ Alta</option>
                    <option value="critical">🔥 Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Quando lembrar?
                </label>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-900"
                />
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {[
                    { l: 'Em 15min', m: 15 },
                    { l: 'Em 1h', m: 60 },
                    { l: 'Hoje 18h', m: 'today18' as const },
                    { l: 'Amanhã 9h', m: 'tomorrow9' as const },
                  ].map((opt) => (
                    <button
                      key={opt.l}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        if (opt.m === 'today18') d.setHours(18, 0, 0, 0);
                        else if (opt.m === 'tomorrow9') {
                          d.setDate(d.getDate() + 1);
                          d.setHours(9, 0, 0, 0);
                        } else {
                          d.setMinutes(d.getMinutes() + opt.m);
                        }
                        const local = new Date(
                          d.getTime() - d.getTimezoneOffset() * 60000,
                        )
                          .toISOString()
                          .slice(0, 16);
                        setDueAt(local);
                      }}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200"
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={creating || !title.trim() || !dueAt}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReminderItem({
  r,
  onDone,
  onSnooze,
  onDelete,
}: {
  r: Reminder;
  onDone: () => void;
  onSnooze: (min: number) => void;
  onDelete: () => void;
}) {
  const style = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.normal;
  const isOverdue = new Date(r.dueAt) <= new Date();
  return (
    <li
      className={`p-3 rounded-lg border ${
        isOverdue
          ? 'border-rose-300 bg-rose-50 dark:bg-rose-500/10 dark:border-rose-500/30'
          : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-white/10'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`text-base ${style.text}`}>{style.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-[13px] truncate">
            {r.title}
          </div>
          {r.description && (
            <div className="text-[12px] text-slate-600 dark:text-slate-400 mt-0.5">
              {r.description}
            </div>
          )}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
            {r.category && (
              <span className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded">
                {r.category}
              </span>
            )}
            <Clock className="w-3 h-3" />
            <span>
              {new Date(r.dueAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex gap-1 mt-2">
            <button
              onClick={onDone}
              className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
            >
              <Check className="w-3 h-3" />
              Concluir
            </button>
            <button
              onClick={() => onSnooze(60)}
              className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200"
            >
              <Clock className="w-3 h-3" />
              +1h
            </button>
            <button
              onClick={onDelete}
              className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 ml-auto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {r.link && (
            <a
              href={r.link}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-brand-600 hover:underline mt-1 inline-flex items-center gap-1"
            >
              Abrir <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
