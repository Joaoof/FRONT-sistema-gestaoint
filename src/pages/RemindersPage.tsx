import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  CREATE_COMPANY_REMINDER,
  DELETE_COMPANY_REMINDER,
  GET_COMPANY_REMINDERS,
  SNOOZE_COMPANY_REMINDER,
  TOGGLE_COMPANY_REMINDER_DONE,
} from '../graphql/queries/timeline';

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
  { bg: string; ring: string; chip: string; icon: string; label: string }
> = {
  low: {
    bg: 'bg-slate-50 dark:bg-slate-900',
    ring: 'border-slate-200 dark:border-white/10',
    chip: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300',
    icon: '○',
    label: 'Baixa',
  },
  normal: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    ring: 'border-blue-200 dark:border-blue-500/30',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    icon: '•',
    label: 'Normal',
  },
  high: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    ring: 'border-amber-300 dark:border-amber-500/30',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    icon: '⚠',
    label: 'Alta',
  },
  critical: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    ring: 'border-rose-300 dark:border-rose-500/30',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
    icon: '🔥',
    label: 'Crítica',
  },
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'fiscal', label: '📋 Fiscal' },
  { value: 'financeiro', label: '💰 Financeiro' },
  { value: 'comercial', label: '🛒 Comercial' },
  { value: 'operacional', label: '🛠 Operacional' },
  { value: 'rh', label: '👥 RH' },
  { value: 'outros', label: '📌 Outros' },
];

type Tab = 'overdue' | 'pending' | 'done' | 'all';

export function RemindersPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('outros');
  const [priority, setPriority] = useState('normal');
  const [dueAt, setDueAt] = useState('');

  const { data, loading, refetch } = useQuery<{ companyReminders: Reminder[] }>(
    GET_COMPANY_REMINDERS,
    {
      variables: {
        pending: tab === 'done' ? false : tab === 'all' ? undefined : true,
        category: filterCategory || undefined,
        priority: filterPriority || undefined,
      },
      fetchPolicy: 'cache-and-network',
      pollInterval: 30_000,
    },
  );

  const [createMut, { loading: creating }] = useMutation(CREATE_COMPANY_REMINDER);
  const [toggleMut] = useMutation(TOGGLE_COMPANY_REMINDER_DONE);
  const [snoozeMut] = useMutation(SNOOZE_COMPANY_REMINDER);
  const [deleteMut] = useMutation(DELETE_COMPANY_REMINDER);

  const reminders = data?.companyReminders ?? [];
  const now = new Date();

  const filtered = useMemo(() => {
    if (tab === 'overdue') {
      return reminders.filter((r) => !r.doneAt && new Date(r.dueAt) <= now);
    }
    if (tab === 'done') return reminders.filter((r) => r.doneAt);
    return reminders;
  }, [reminders, tab, now]);

  const stats = useMemo(() => {
    const all = reminders;
    return {
      pending: all.filter((r) => !r.doneAt).length,
      overdue: all.filter((r) => !r.doneAt && new Date(r.dueAt) <= now).length,
      critical: all.filter((r) => !r.doneAt && r.priority === 'critical').length,
      done: all.filter((r) => r.doneAt).length,
    };
  }, [reminders, now]);

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

  const onComplete = async (r: Reminder) => {
    await toggleMut({ variables: { id: r.id, done: !r.doneAt } });
    refetch();
  };

  const onSnooze = async (r: Reminder, minutes: number) => {
    await snoozeMut({ variables: { id: r.id, minutes } });
    refetch();
  };

  const onDelete = async (r: Reminder) => {
    if (!window.confirm(`Apagar "${r.title}"?`)) return;
    await deleteMut({ variables: { id: r.id } });
    refetch();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] px-6 py-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0">
          <Bell className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Lembretes da empresa
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Não esqueça do que ainda precisa fazer — som + bell quando vencer.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo lembrete
        </button>
      </header>

      {/* KPIs */}
      <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-3 border border-slate-100 dark:border-white/[0.06]">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Pendentes</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {stats.pending}
          </div>
        </div>
        <div className="bg-rose-50 dark:bg-rose-500/10 rounded-lg p-3 border border-rose-200 dark:border-rose-500/20">
          <div className="text-[10px] uppercase tracking-wide text-rose-600 dark:text-rose-400">
            Vencidos
          </div>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
            {stats.overdue}
          </div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3 border border-amber-200 dark:border-amber-500/20">
          <div className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Críticos
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.critical}
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 border border-emerald-200 dark:border-emerald-500/20">
          <div className="text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            Concluídos
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.done}
          </div>
        </div>
      </div>

      {/* Tabs + filtros */}
      <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.06] rounded-lg p-1">
          {(
            [
              ['pending', `Pendentes (${stats.pending})`],
              ['overdue', `Vencidos (${stats.overdue})`],
              ['done', `Concluídos`],
              ['all', 'Todos'],
            ] as Array<[Tab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                tab === key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto items-center text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1.5 border border-slate-200 dark:border-white/10 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="">Toda prioridade</option>
            <option value="critical">🔥 Crítica</option>
            <option value="high">⚠ Alta</option>
            <option value="normal">• Normal</option>
            <option value="low">○ Baixa</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      <main className="max-w-4xl mx-auto p-6 space-y-3">
        {loading && reminders.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando lembretes…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
            <Bell className="w-12 h-12 mx-auto opacity-30 mb-3 text-slate-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Nenhum lembrete {tab === 'overdue' ? 'vencido' : 'na lista'}.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Criar lembrete
            </button>
          </div>
        ) : (
          filtered.map((r) => {
            const style = PRIORITY_STYLE[r.priority] ?? PRIORITY_STYLE.normal;
            const isOverdue = !r.doneAt && new Date(r.dueAt) <= now;
            const isDone = !!r.doneAt;
            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-4 ${style.bg} ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-500/40'
                    : style.ring
                } ${isDone ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onComplete(r)}
                    className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-white/20 hover:border-emerald-500 hover:bg-emerald-50'
                    }`}
                    title={isDone ? 'Reabrir' : 'Concluir'}
                  >
                    {isDone && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-semibold text-slate-900 dark:text-white text-[15px] ${
                              isDone ? 'line-through text-slate-500' : ''
                            }`}
                          >
                            {r.title}
                          </h3>
                          <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold ${style.chip}`}>
                            {style.icon} {style.label}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] uppercase tracking-wide bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Vencido
                            </span>
                          )}
                        </div>
                        {r.description && (
                          <p className="text-[13px] text-slate-700 dark:text-slate-300 mt-1.5">
                            {r.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[11.5px] text-slate-500 dark:text-slate-400 mt-2">
                          {r.category && (
                            <span className="bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded">
                              {r.category}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(r.dueAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {r.notifiedAt && (
                            <span className="inline-flex items-center gap-1 text-amber-600">
                              🔔 Notificado
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!isDone && (
                          <>
                            <button
                              onClick={() => onSnooze(r, 60)}
                              className="text-[11px] inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                              title="Adiar 1h"
                            >
                              <Clock className="w-3 h-3" />
                              +1h
                            </button>
                            <button
                              onClick={() => onSnooze(r, 24 * 60)}
                              className="text-[11px] inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                              title="Adiar amanhã"
                            >
                              +1d
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onDelete(r)}
                          className="text-[11px] inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded text-rose-600 hover:bg-rose-50"
                          title="Apagar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </main>

      {/* Modal de criação */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Novo lembrete
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  Título
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pagar GNRE até sexta"
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {CATEGORY_OPTIONS.filter((c) => c.value).map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="low">○ Baixa</option>
                    <option value="normal">• Normal</option>
                    <option value="high">⚠ Alta</option>
                    <option value="critical">🔥 Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  Quando lembrar?
                </label>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <div className="flex gap-1 mt-2 flex-wrap">
                  {[
                    { l: 'Em 15min', m: 15 },
                    { l: 'Em 1h', m: 60 },
                    { l: 'Hoje 18h', m: 'today18' as const },
                    { l: 'Amanhã 9h', m: 'tomorrow9' as const },
                    { l: 'Próxima segunda', m: 'monday' as const },
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
                        } else if (opt.m === 'monday') {
                          const day = d.getDay();
                          const diff = (8 - day) % 7 || 7;
                          d.setDate(d.getDate() + diff);
                          d.setHours(9, 0, 0, 0);
                        } else {
                          d.setMinutes(d.getMinutes() + (opt.m as number));
                        }
                        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                          .toISOString()
                          .slice(0, 16);
                        setDueAt(local);
                      }}
                      className="text-[11px] px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-white/20"
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
                className="flex-1 py-2.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={creating || !title.trim() || !dueAt}
                className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm font-medium inline-flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar lembrete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
