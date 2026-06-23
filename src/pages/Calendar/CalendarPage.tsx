import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { motion } from 'framer-motion';
import {
  BellOff,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  GET_CALENDAR_ITEMS,
  TEST_WEB_PUSH,
} from '../../graphql/queries/calendar';
import { useWebPush } from '../../hooks/useWebPush';
import { EventModal } from './EventModal';
import { SummaryModal } from './SummaryModal';
import {
  CalendarItem,
  SOURCE_ICON,
  SOURCE_LABEL,
  ViewMode,
  addDays,
  buildMonthGrid,
  endOfDay,
  formatHM,
  formatRange,
  getHeaderLabel,
  getViewRange,
  navigateBy,
  sameDay,
  startOfDay,
  startOfWeek,
  WEEKDAYS_SHORT_PT,
} from './utils';

const SOURCE_FILTERS: Array<{ key: CalendarItem['source']; label: string; color: string }> = [
  { key: 'EVENT', label: 'Eventos', color: '#3b82f6' },
  { key: 'REMINDER', label: 'Lembretes', color: '#f59e0b' },
  { key: 'PAYABLE', label: 'A pagar', color: '#ef4444' },
  { key: 'RECEIVABLE', label: 'A receber', color: '#10b981' },
  { key: 'DELIVERY', label: 'Entregas', color: '#8b5cf6' },
  { key: 'CONTRACT', label: 'Contratos', color: '#06b6d4' },
  { key: 'ORDER', label: 'Pedidos', color: '#ec4899' },
];

export function CalendarPage() {
  const [view, setView] = useState<ViewMode>('month');
  const [refDate, setRefDate] = useState(new Date());
  const [activeSources, setActiveSources] = useState<CalendarItem['source'][]>(
    SOURCE_FILTERS.map((s) => s.key),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEventId, setModalEventId] = useState<string | null>(null);
  const [modalPrefill, setModalPrefill] = useState<{ start: Date; end: Date } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const range = useMemo(() => getViewRange(view, refDate), [view, refDate]);

  const { data, loading, refetch } = useQuery<{ calendarItems: CalendarItem[] }>(
    GET_CALENDAR_ITEMS,
    {
      variables: {
        range: {
          start: range.start.toISOString(),
          end: range.end.toISOString(),
          sources: activeSources,
        },
      },
      fetchPolicy: 'cache-and-network',
      pollInterval: 60_000,
    },
  );

  const items = data?.calendarItems ?? [];

  const webPush = useWebPush();
  const [testPush] = useMutation(TEST_WEB_PUSH);

  const openCreate = (start?: Date, end?: Date) => {
    setModalEventId(null);
    setModalPrefill(
      start
        ? { start, end: end ?? new Date(start.getTime() + 60 * 60_000) }
        : null,
    );
    setModalOpen(true);
  };

  const openEdit = (item: CalendarItem) => {
    if (item.source !== 'EVENT' || !item.editable) {
      // navegar pro link da origem
      if (item.link) window.location.assign(item.link);
      return;
    }
    setModalEventId(item.sourceId);
    setModalPrefill(null);
    setModalOpen(true);
  };

  const toggleSource = (s: CalendarItem['source']) => {
    setActiveSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      {/* HEADER */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-6 py-4 flex flex-wrap items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
          <img
            src="https://cdn-icons-png.flaticon.com/512/9887/9887384.png"
            alt="Agenda"
            className="w-8 h-8 object-contain"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Agenda</h1>
          <p className="text-xs text-slate-500">
            Eventos, lembretes, contas e entregas — tudo num só lugar.
          </p>
        </div>

        <button
          onClick={() => setSummaryOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white rounded-lg hover:opacity-90 text-sm font-semibold shadow-sm"
          title="Resumir agenda com IA"
        >
          <Sparkles className="w-4 h-4" />
          Resumir agenda
        </button>

        <button
          onClick={() => setRefDate(new Date())}
          className="px-3 py-2 text-sm bg-slate-100 dark:bg-white/10 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-medium"
        >
          Hoje
        </button>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 rounded-lg p-1">
          <button
            onClick={() => setRefDate((r) => navigateBy(view, r, -1))}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRefDate((r) => navigateBy(view, r, 1))}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 min-w-[180px]">
          {getHeaderLabel(view, refDate)}
        </span>

        <div className="flex gap-0.5 bg-slate-100 dark:bg-white/10 rounded-lg p-0.5 ml-auto">
          {(['month', 'week', 'day', 'agenda'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                view === v
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : v === 'day' ? 'Dia' : 'Agenda'}
            </button>
          ))}
        </div>

        <button
          onClick={() => refetch()}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {webPush.supported && webPush.status === 'subscribed' ? (
          <button
            onClick={() => testPush().catch(() => undefined)}
            className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600"
            title="Push ativo — clique pra testar"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        ) : webPush.supported && webPush.status === 'unsubscribed' ? (
          <button
            onClick={() => webPush.enable()}
            disabled={webPush.busy || webPush.status === ('not-configured' as any)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
            title="Ativar notificações push"
          >
            <BellOff className="w-4 h-4" />
          </button>
        ) : null}

        <button
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Criar
        </button>
      </header>

      {/* FILTROS */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10 px-6 py-2.5 flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
        {SOURCE_FILTERS.map((s) => {
          const active = activeSources.includes(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleSource(s.key)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                active
                  ? 'text-white border-transparent'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-white/10'
              }`}
              style={active ? { backgroundColor: s.color } : undefined}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1"
                style={{ backgroundColor: active ? '#fff' : s.color }}
              />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* BODY */}
      <main className="p-4">
        {view === 'month' && (
          <MonthView
            refDate={refDate}
            items={items}
            onDayClick={(d) => openCreate(d, addDays(d, 0))}
            onItemClick={openEdit}
          />
        )}
        {view === 'week' && (
          <WeekView refDate={refDate} items={items} onItemClick={openEdit} onSlotClick={openCreate} />
        )}
        {view === 'day' && (
          <DayView refDate={refDate} items={items} onItemClick={openEdit} onSlotClick={openCreate} />
        )}
        {view === 'agenda' && (
          <AgendaView items={items} onItemClick={openEdit} />
        )}
      </main>

      <EventModal
        isOpen={modalOpen}
        eventId={modalEventId}
        prefillStart={modalPrefill?.start ?? null}
        prefillEnd={modalPrefill?.end ?? null}
        onClose={() => setModalOpen(false)}
        onSaved={() => refetch()}
      />

      <SummaryModal
        isOpen={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        initialReferenceDate={refDate}
        initialSources={activeSources}
      />
    </div>
  );
}

// ---------------- Views ----------------

function MonthView({
  refDate,
  items,
  onDayClick,
  onItemClick,
}: {
  refDate: Date;
  items: CalendarItem[];
  onDayClick: (d: Date) => void;
  onItemClick: (item: CalendarItem) => void;
}) {
  const grid = useMemo(() => buildMonthGrid(refDate), [refDate]);
  const today = new Date();

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const start = new Date(it.startAt);
      const key = start.toDateString();
      const list = map.get(key) ?? [];
      list.push(it);
      map.set(key, list);
    }
    return map;
  }, [items]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
        {WEEKDAYS_SHORT_PT.map((d, i) => (
          <div
            key={d}
            className={`px-2 py-2 text-[11px] uppercase tracking-wide font-semibold text-center ${
              i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 min-h-[600px]">
        {grid.flat().map((d, idx) => {
          const isCurrentMonth = d.getMonth() === refDate.getMonth();
          const isToday = sameDay(d, today);
          const dayItems = itemsByDay.get(d.toDateString()) ?? [];
          return (
            <button
              key={idx}
              onClick={() => onDayClick(d)}
              className={`relative border-r border-b border-slate-100 dark:border-white/[0.06] p-1.5 text-left flex flex-col gap-0.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] ${
                !isCurrentMonth ? 'bg-slate-50/40 dark:bg-white/[0.01]' : ''
              }`}
            >
              <span
                className={`text-[11px] font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                  isToday
                    ? 'bg-brand-600 text-white'
                    : isCurrentMonth
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {d.getDate()}
              </span>
              <div className="space-y-0.5 overflow-hidden">
                {dayItems.slice(0, 3).map((it) => (
                  <div
                    key={it.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick(it);
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] truncate cursor-pointer hover:opacity-90"
                    style={{
                      backgroundColor: `${it.color}22`,
                      color: it.color,
                      borderLeft: `2px solid ${it.color}`,
                    }}
                  >
                    {!it.allDay && (
                      <span className="opacity-70 font-medium">
                        {formatHM(new Date(it.startAt))}
                      </span>
                    )}
                    <span className="truncate font-medium">{it.title}</span>
                  </div>
                ))}
                {dayItems.length > 3 && (
                  <div className="text-[10px] text-slate-500 px-1.5">
                    +{dayItems.length - 3} mais
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  refDate,
  items,
  onItemClick,
  onSlotClick,
}: {
  refDate: Date;
  items: CalendarItem[];
  onItemClick: (it: CalendarItem) => void;
  onSlotClick: (start: Date, end: Date) => void;
}) {
  const start = startOfWeek(refDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const HOURS = Array.from({ length: 24 }, (_, h) => h);
  const today = new Date();

  const allDayItems = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const d of days) m.set(d.toDateString(), []);
    for (const it of items) {
      if (!it.allDay) continue;
      const key = new Date(it.startAt).toDateString();
      m.get(key)?.push(it);
    }
    return m;
  }, [items, days]);

  const timedItems = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const d of days) m.set(d.toDateString(), []);
    for (const it of items) {
      if (it.allDay) continue;
      const key = new Date(it.startAt).toDateString();
      m.get(key)?.push(it);
    }
    return m;
  }, [items, days]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
        <div />
        {days.map((d) => {
          const isToday = sameDay(d, today);
          return (
            <div key={d.toISOString()} className="px-2 py-2 text-center border-l border-slate-200 dark:border-white/10">
              <div className="text-[10px] uppercase font-semibold text-slate-500">
                {WEEKDAYS_SHORT_PT[d.getDay()]}
              </div>
              <div
                className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                  isToday ? 'bg-brand-600 text-white' : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* faixa all-day */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 dark:border-white/10">
        <div className="px-2 py-2 text-[10px] uppercase font-semibold text-slate-400 flex items-center">
          dia
        </div>
        {days.map((d) => (
          <div
            key={d.toDateString()}
            className="border-l border-slate-200 dark:border-white/10 p-1 min-h-[36px] space-y-0.5"
          >
            {(allDayItems.get(d.toDateString()) ?? []).map((it) => (
              <button
                key={it.id}
                onClick={() => onItemClick(it)}
                className="w-full text-left px-1.5 py-0.5 text-[10.5px] truncate rounded"
                style={{ backgroundColor: `${it.color}22`, color: it.color, borderLeft: `2px solid ${it.color}` }}
              >
                {it.title}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="relative grid grid-cols-[60px_repeat(7,1fr)] max-h-[640px] overflow-y-auto">
        <div>
          {HOURS.map((h) => (
            <div
              key={h}
              className="h-12 text-[10px] text-slate-400 px-2 text-right border-b border-slate-100 dark:border-white/[0.06] pt-0.5"
            >
              {h.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className="relative border-l border-slate-200 dark:border-white/10"
          >
            {HOURS.map((h) => (
              <div
                key={h}
                onClick={() => {
                  const s = new Date(d);
                  s.setHours(h, 0, 0, 0);
                  const e = new Date(s);
                  e.setHours(h + 1);
                  onSlotClick(s, e);
                }}
                className="h-12 border-b border-slate-100 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer"
              />
            ))}
            {(timedItems.get(d.toDateString()) ?? []).map((it) => {
              const start = new Date(it.startAt);
              const end = new Date(it.endAt);
              const top = (start.getHours() + start.getMinutes() / 60) * 48; // 48px/h
              const height = Math.max(
                20,
                ((end.getTime() - start.getTime()) / 3600_000) * 48,
              );
              return (
                <button
                  key={it.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick(it);
                  }}
                  style={{
                    top,
                    height,
                    left: 4,
                    right: 4,
                    backgroundColor: `${it.color}22`,
                    borderLeft: `3px solid ${it.color}`,
                    color: it.color,
                  }}
                  className="absolute rounded-md text-[11px] px-1.5 py-1 text-left overflow-hidden hover:opacity-90"
                >
                  <div className="font-semibold truncate">{it.title}</div>
                  <div className="opacity-70">{formatHM(start)} – {formatHM(end)}</div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayView({
  refDate,
  items,
  onItemClick,
  onSlotClick,
}: {
  refDate: Date;
  items: CalendarItem[];
  onItemClick: (it: CalendarItem) => void;
  onSlotClick: (start: Date, end: Date) => void;
}) {
  const HOURS = Array.from({ length: 24 }, (_, h) => h);
  const dayItems = items.filter((it) => sameDay(new Date(it.startAt), refDate));
  const allDay = dayItems.filter((it) => it.allDay);
  const timed = dayItems.filter((it) => !it.allDay);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
        {allDay.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
            <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
              O dia todo
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allDay.map((it) => (
                <button
                  key={it.id}
                  onClick={() => onItemClick(it)}
                  className="px-2 py-1 text-xs rounded-md font-medium"
                  style={{ backgroundColor: `${it.color}22`, color: it.color }}
                >
                  {SOURCE_ICON[it.source]} {it.title}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="relative grid grid-cols-[60px_1fr] max-h-[680px] overflow-y-auto">
          <div>
            {HOURS.map((h) => (
              <div key={h} className="h-14 text-[11px] text-slate-400 px-2 text-right border-b border-slate-100 dark:border-white/[0.06] pt-0.5">
                {h.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          <div className="relative border-l border-slate-200 dark:border-white/10">
            {HOURS.map((h) => (
              <div
                key={h}
                onClick={() => {
                  const s = new Date(refDate);
                  s.setHours(h, 0, 0, 0);
                  const e = new Date(s);
                  e.setHours(h + 1);
                  onSlotClick(s, e);
                }}
                className="h-14 border-b border-slate-100 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.03] cursor-pointer"
              />
            ))}
            {timed.map((it) => {
              const start = new Date(it.startAt);
              const end = new Date(it.endAt);
              const top = (start.getHours() + start.getMinutes() / 60) * 56;
              const height = Math.max(
                28,
                ((end.getTime() - start.getTime()) / 3600_000) * 56,
              );
              return (
                <button
                  key={it.id}
                  onClick={() => onItemClick(it)}
                  style={{
                    top,
                    height,
                    left: 6,
                    right: 6,
                    backgroundColor: `${it.color}22`,
                    borderLeft: `4px solid ${it.color}`,
                    color: it.color,
                  }}
                  className="absolute rounded-lg text-xs px-2 py-1 text-left hover:opacity-90 overflow-hidden"
                >
                  <div className="font-bold truncate">{it.title}</div>
                  <div className="opacity-70 text-[11px]">{formatHM(start)} – {formatHM(end)}</div>
                  {it.location && <div className="opacity-60 text-[10px] truncate">📍 {it.location}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 p-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">
          Agenda do dia
        </h3>
        {dayItems.length === 0 ? (
          <p className="text-sm text-slate-400">Sem compromissos hoje.</p>
        ) : (
          <div className="space-y-2">
            {dayItems.map((it) => (
              <button
                key={it.id}
                onClick={() => onItemClick(it)}
                className="w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: it.color }} />
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    {SOURCE_LABEL[it.source]}
                  </span>
                </div>
                <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                  {it.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {formatRange(new Date(it.startAt), new Date(it.endAt), it.allDay)}
                </div>
                {it.amount && (
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                    R$ {Number(it.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

function AgendaView({
  items,
  onItemClick,
}: {
  items: CalendarItem[];
  onItemClick: (it: CalendarItem) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const key = startOfDay(new Date(it.startAt)).toISOString();
      const list = map.get(key) ?? [];
      list.push(it);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, list]) => ({ date: new Date(key), list }));
  }, [items]);

  const today = new Date();

  if (grouped.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-white/10 py-16 text-center">
        <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">Nada por aqui no período selecionado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {grouped.map(({ date, list }) => {
        const isToday = sameDay(date, today);
        return (
          <section
            key={date.toISOString()}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <header className={`px-4 py-2.5 border-b border-slate-200 dark:border-white/10 flex items-center gap-3 ${isToday ? 'bg-brand-50 dark:bg-brand-500/10' : 'bg-slate-50 dark:bg-white/[0.02]'}`}>
              <div className={`text-2xl font-bold ${isToday ? 'text-brand-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {date.getDate()}
              </div>
              <div>
                <div className="text-xs uppercase font-semibold text-slate-500">
                  {date.toLocaleDateString('pt-BR', { weekday: 'long' })}
                </div>
                <div className="text-xs text-slate-400">
                  {date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              {isToday && (
                <span className="ml-auto text-[10px] uppercase font-bold px-2 py-1 bg-brand-600 text-white rounded-full">
                  Hoje
                </span>
              )}
            </header>
            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {list.map((it) => (
                <motion.button
                  key={it.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onItemClick(it)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] flex items-start gap-3"
                >
                  <div
                    className="w-1 self-stretch rounded-full"
                    style={{ backgroundColor: it.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{SOURCE_ICON[it.source]}</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                        {it.title}
                      </span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${it.color}22`, color: it.color }}>
                        {SOURCE_LABEL[it.source]}
                      </span>
                      {it.status === 'OVERDUE' && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Vencido
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatRange(new Date(it.startAt), new Date(it.endAt), it.allDay)}
                      {it.location && ` · 📍 ${it.location}`}
                    </div>
                    {it.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {it.description}
                      </p>
                    )}
                  </div>
                  {it.amount && (
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        R$ {Number(it.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// silence unused warnings
void endOfDay;
