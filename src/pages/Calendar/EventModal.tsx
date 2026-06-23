import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  Clock,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Plus,
  Repeat,
  Trash2,
  X,
} from 'lucide-react';
import {
  CREATE_CALENDAR_EVENT,
  DELETE_CALENDAR_EVENT,
  GET_CALENDAR_EVENT,
  UPDATE_CALENDAR_EVENT,
} from '../../graphql/queries/calendar';

interface ReminderRow {
  offsetMin: number;
  channels: string[];
}

const CHANNELS = [
  { key: 'IN_APP', label: 'Sino do app', icon: '🔔' },
  { key: 'EMAIL', label: 'E-mail', icon: '✉️' },
  { key: 'WHATSAPP', label: 'WhatsApp', icon: '📱' },
  { key: 'PUSH', label: 'Push (navegador)', icon: '🌐' },
];

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#64748b',
];

const QUICK_OFFSETS: Array<{ label: string; min: number }> = [
  { label: 'No horário', min: 0 },
  { label: '5min antes', min: 5 },
  { label: '15min antes', min: 15 },
  { label: '30min antes', min: 30 },
  { label: '1h antes', min: 60 },
  { label: '1 dia antes', min: 24 * 60 },
  { label: '1 semana antes', min: 7 * 24 * 60 },
];

type Freq = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eventId?: string | null;
  prefillStart?: Date | null;
  prefillEnd?: Date | null;
  onSaved?: () => void;
}

function toLocalInput(d: Date): string {
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function fromLocalInput(s: string): Date {
  return new Date(s);
}

function freqFromRrule(rrule: string | null | undefined): Freq {
  if (!rrule) return 'NONE';
  const m = rrule.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i);
  return (m?.[1]?.toUpperCase() as Freq) ?? 'NONE';
}

function buildRrule(freq: Freq, interval: number): string | null {
  if (freq === 'NONE') return null;
  const parts = [`FREQ=${freq}`];
  if (interval > 1) parts.push(`INTERVAL=${interval}`);
  return parts.join(';');
}

export function EventModal({
  isOpen,
  onClose,
  eventId,
  prefillStart,
  prefillEnd,
  onSaved,
}: Props) {
  const isEdit = !!eventId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState(() => toLocalInput(prefillStart ?? new Date()));
  const [endAt, setEndAt] = useState(() =>
    toLocalInput(prefillEnd ?? new Date(Date.now() + 60 * 60_000)),
  );
  const [category, setCategory] = useState('outros');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'critical'>('normal');
  const [channels, setChannels] = useState<string[]>(['IN_APP']);
  const [reminders, setReminders] = useState<ReminderRow[]>([
    { offsetMin: 15, channels: ['IN_APP'] },
  ]);
  const [freq, setFreq] = useState<Freq>('NONE');
  const [interval, setInterval] = useState(1);
  const [recurrenceUntil, setRecurrenceUntil] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const { data, loading: loadingExisting } = useQuery(GET_CALENDAR_EVENT, {
    variables: { id: eventId },
    skip: !eventId || !isOpen,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (!isOpen) return;
    if (eventId && data?.calendarEvent) {
      const e = data.calendarEvent;
      setTitle(e.title);
      setDescription(e.description ?? '');
      setLocation(e.location ?? '');
      setLink(e.link ?? '');
      setColor(e.color || COLORS[0]);
      setAllDay(e.allDay);
      setStartAt(toLocalInput(new Date(e.startAt)));
      setEndAt(toLocalInput(new Date(e.endAt)));
      setCategory(e.category ?? 'outros');
      setPriority((e.priority as any) ?? 'normal');
      setChannels(e.channels?.length ? e.channels : ['IN_APP']);
      setReminders(
        e.reminders?.length
          ? e.reminders.map((r: any) => ({ offsetMin: r.offsetMin, channels: r.channels }))
          : [],
      );
      setFreq(freqFromRrule(e.rrule));
      const m = e.rrule?.match(/INTERVAL=(\d+)/);
      setInterval(m ? Number(m[1]) : 1);
      setRecurrenceUntil(
        e.recurrenceUntil ? new Date(e.recurrenceUntil).toISOString().slice(0, 10) : '',
      );
    } else if (!eventId) {
      // reset to prefill
      setTitle('');
      setDescription('');
      setLocation('');
      setLink('');
      setColor(COLORS[0]);
      setAllDay(false);
      setStartAt(toLocalInput(prefillStart ?? new Date()));
      setEndAt(toLocalInput(prefillEnd ?? new Date(Date.now() + 60 * 60_000)));
      setCategory('outros');
      setPriority('normal');
      setChannels(['IN_APP']);
      setReminders([{ offsetMin: 15, channels: ['IN_APP'] }]);
      setFreq('NONE');
      setInterval(1);
      setRecurrenceUntil('');
    }
    setErr(null);
  }, [eventId, data, isOpen, prefillStart, prefillEnd]);

  const [createMut, { loading: creating }] = useMutation(CREATE_CALENDAR_EVENT);
  const [updateMut, { loading: updating }] = useMutation(UPDATE_CALENDAR_EVENT);
  const [deleteMut, { loading: deleting }] = useMutation(DELETE_CALENDAR_EVENT);

  const submitting = creating || updating || deleting;

  const rrule = useMemo(() => buildRrule(freq, interval), [freq, interval]);

  const submit = async () => {
    if (!title.trim()) {
      setErr('Informe um título.');
      return;
    }
    const start = fromLocalInput(startAt);
    const end = fromLocalInput(endAt);
    if (end < start) {
      setErr('Data final precisa ser depois da inicial.');
      return;
    }

    const input = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      link: link.trim() || null,
      color,
      allDay,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      category,
      priority,
      channels,
      reminders,
      rrule,
      recurrenceUntil: recurrenceUntil ? new Date(recurrenceUntil).toISOString() : null,
    };

    try {
      if (isEdit) {
        await updateMut({ variables: { input: { id: eventId, ...input } } });
      } else {
        await createMut({ variables: { input } });
      }
      onSaved?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? 'Falhou ao salvar.');
    }
  };

  const doDelete = async () => {
    if (!eventId) return;
    if (!window.confirm('Apagar este evento (e todas as ocorrências futuras)?')) return;
    try {
      await deleteMut({ variables: { id: eventId } });
      onSaved?.();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? 'Falhou ao apagar.');
    }
  };

  const toggleChannel = (c: string) => {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const addReminder = () => {
    setReminders((prev) => [...prev, { offsetMin: 15, channels: ['IN_APP'] }]);
  };
  const updateReminder = (i: number, patch: Partial<ReminderRow>) => {
    setReminders((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  const removeReminder = (i: number) => {
    setReminders((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col"
      >
        <header className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: color }}
          >
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isEdit ? 'Editar evento' : 'Novo evento'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit ? 'Ajuste detalhes do evento e dos lembretes.' : 'Crie um lembrete completo com notificações.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loadingExisting ? (
            <div className="py-12 flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Adicionar título"
                  autoFocus
                  className="w-full text-xl font-semibold border-0 border-b-2 border-slate-200 dark:border-white/10 focus:border-brand-600 focus:outline-none bg-transparent text-slate-900 dark:text-white py-2"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Início
                  </label>
                  <input
                    type={allDay ? 'date' : 'datetime-local'}
                    value={allDay ? startAt.slice(0, 10) : startAt}
                    onChange={(e) => setStartAt(allDay ? e.target.value + 'T00:00' : e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Fim
                  </label>
                  <input
                    type={allDay ? 'date' : 'datetime-local'}
                    value={allDay ? endAt.slice(0, 10) : endAt}
                    onChange={(e) => setEndAt(allDay ? e.target.value + 'T23:59' : e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-4 h-4 accent-brand-600"
                />
                O dia todo
              </label>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" />
                  Recorrência
                </label>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={freq}
                    onChange={(e) => setFreq(e.target.value as Freq)}
                    className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="NONE">Não repete</option>
                    <option value="DAILY">Diariamente</option>
                    <option value="WEEKLY">Semanalmente</option>
                    <option value="MONTHLY">Mensalmente</option>
                    <option value="YEARLY">Anualmente</option>
                  </select>
                  {freq !== 'NONE' && (
                    <>
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        a cada
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={interval}
                          onChange={(e) => setInterval(Math.max(1, Number(e.target.value)))}
                          className="w-14 px-2 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white text-center"
                        />
                        {freq === 'DAILY' ? 'dia(s)' : freq === 'WEEKLY' ? 'semana(s)' : freq === 'MONTHLY' ? 'mês(es)' : 'ano(s)'}
                      </div>
                      <input
                        type="date"
                        value={recurrenceUntil}
                        onChange={(e) => setRecurrenceUntil(e.target.value)}
                        placeholder="Termina em"
                        className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Local
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex.: Escritório / Sala 2"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5" /> Link
                  </label>
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="URL relacionada (ex.: meet.google.com/abc)"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Detalhes, agenda, observações…"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                    Cor
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full transition-all ${
                          color === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="fiscal">📋 Fiscal</option>
                    <option value="financeiro">💰 Financeiro</option>
                    <option value="comercial">🛒 Comercial</option>
                    <option value="operacional">🛠 Operacional</option>
                    <option value="rh">👥 RH</option>
                    <option value="outros">📌 Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="low">○ Baixa</option>
                    <option value="normal">• Normal</option>
                    <option value="high">⚠ Alta</option>
                    <option value="critical">🔥 Crítica</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Notificar por
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((c) => {
                    const active = channels.includes(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => toggleChannel(c.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          active
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-slate-50'
                        }`}
                      >
                        {c.icon} {c.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Lembrar
                    </span>
                    <button
                      type="button"
                      onClick={addReminder}
                      className="text-[11px] inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>
                  {reminders.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhum lembrete configurado.</p>
                  ) : (
                    <div className="space-y-2">
                      {reminders.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5"
                        >
                          <select
                            value={r.offsetMin}
                            onChange={(e) =>
                              updateReminder(i, { offsetMin: Number(e.target.value) })
                            }
                            className="px-2 py-1 text-xs bg-transparent text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 rounded"
                          >
                            {QUICK_OFFSETS.map((o) => (
                              <option key={o.min} value={o.min}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1 flex-1 flex-wrap">
                            {CHANNELS.map((c) => {
                              const active = r.channels.includes(c.key);
                              return (
                                <button
                                  key={c.key}
                                  type="button"
                                  onClick={() =>
                                    updateReminder(i, {
                                      channels: active
                                        ? r.channels.filter((x) => x !== c.key)
                                        : [...r.channels, c.key],
                                    })
                                  }
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    active
                                      ? 'bg-brand-600 text-white border-brand-600'
                                      : 'bg-transparent text-slate-500 border-slate-200 dark:border-white/10'
                                  }`}
                                  title={c.label}
                                >
                                  {c.icon}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeReminder(i)}
                            className="p-1 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {err && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-lg text-sm text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {err}
                </div>
              )}
            </>
          )}
        </div>

        <footer className="px-6 py-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-2 bg-slate-50 dark:bg-white/[0.02]">
          {isEdit && (
            <button
              type="button"
              onClick={doDelete}
              disabled={submitting}
              className="px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Apagar
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !title.trim()}
            className="px-4 py-2 text-sm bg-brand-600 text-white hover:bg-brand-700 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar evento'}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
