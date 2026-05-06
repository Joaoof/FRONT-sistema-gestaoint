import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Bot,
  Calendar,
  DollarSign,
  Globe,
  Loader2,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Truck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { GET_COMPANY_TIMELINE } from '../graphql/queries/timeline';

type TimelineCategory =
  | 'FINANCIAL'
  | 'COMMERCIAL'
  | 'OPERATIONAL'
  | 'COMMUNICATIONS'
  | 'ALERTS'
  | 'ACTIVITY';

interface TimelineEvent {
  id: string;
  type: string;
  categories: TimelineCategory[];
  at: string;
  title: string;
  description: string | null;
  actor: string | null;
  amount: number | null;
  peerNumber: string | null;
  entityId: string | null;
  entityType: string | null;
  iconKey: string;
  colorKey: string;
}

type ViewMode =
  | 'hub'
  | 'financial'
  | 'commercial'
  | 'operational'
  | 'communications'
  | 'alerts'
  | 'activity';

interface ViewConfig {
  label: string;
  desc: string;
  Icon: typeof Sparkles;
  color: string;
  categories: TimelineCategory[] | null;
}

const VIEWS: Record<ViewMode, ViewConfig> = {
  hub: {
    label: 'Hub',
    desc: 'Tudo que está acontecendo na empresa',
    Icon: Sparkles,
    color: 'violet',
    categories: null,
  },
  financial: {
    label: 'Financeiro',
    desc: 'Pagamentos, recebimentos, fluxo de caixa',
    Icon: Wallet,
    color: 'emerald',
    categories: ['FINANCIAL'],
  },
  commercial: {
    label: 'Comercial',
    desc: 'Vendas, novos clientes, conversões',
    Icon: ShoppingCart,
    color: 'blue',
    categories: ['COMMERCIAL'],
  },
  operational: {
    label: 'Operacional',
    desc: 'Entregas, estoque, ajustes',
    Icon: Truck,
    color: 'amber',
    categories: ['OPERATIONAL'],
  },
  communications: {
    label: 'Comunicações',
    desc: 'WhatsApp, chamadas, lembretes',
    Icon: MessageCircle,
    color: 'green',
    categories: ['COMMUNICATIONS'],
  },
  alerts: {
    label: 'Alertas',
    desc: 'O que precisa de atenção agora',
    Icon: AlertTriangle,
    color: 'rose',
    categories: ['ALERTS'],
  },
  activity: {
    label: 'Atividade',
    desc: 'Quem fez o que, quando',
    Icon: Users,
    color: 'slate',
    categories: ['ACTIVITY'],
  },
};

type Period = 'today' | 'yesterday' | 'week' | 'month';

const PERIOD_LABEL: Record<Period, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  week: '7 dias',
  month: '30 dias',
};

function periodRange(p: Period): { from: Date; to: Date } {
  const now = new Date();
  const startOf = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOf = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };
  if (p === 'today') return { from: startOf(now), to: endOf(now) };
  if (p === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return { from: startOf(y), to: endOf(y) };
  }
  const days = p === 'week' ? 7 : 30;
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from: startOf(from), to: endOf(now) };
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n);
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const ICON_MAP: Record<string, typeof Sparkles> = {
  sale: ShoppingCart,
  receivable: TrendingUp,
  payable: TrendingDown,
  cash: DollarSign,
  customer: UserPlus,
  delivery: Truck,
  stock: Package,
  message: MessageCircle,
  call: Phone,
  reminder: Bell,
  chatbot: Bot,
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/30' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30' },
  violet: { bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-500/30' },
  green: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-500/30' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-500/30' },
};

function EventCard({ event }: { event: TimelineEvent }) {
  const Icon = ICON_MAP[event.iconKey] ?? Globe;
  const c = COLOR_MAP[event.colorKey] ?? COLOR_MAP.slate;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors border-b border-slate-100 dark:border-white/[0.04] last:border-b-0"
    >
      <div
        className={`w-10 h-10 rounded-full ${c.bg} ${c.text} flex items-center justify-center shrink-0 ring-1 ${c.border}`}
      >
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="font-semibold text-slate-800 dark:text-slate-100 text-[14px] truncate">
            {event.title}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            {event.amount != null && (
              <span className={`font-semibold ${c.text}`}>
                {formatBRL(event.amount)}
              </span>
            )}
            <span>{relativeTime(event.at)}</span>
          </div>
        </div>
        {event.description && (
          <div className="text-[12.5px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
            {event.description}
          </div>
        )}
        {event.actor && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            por {event.actor}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function GroupedFeed({ events }: { events: TimelineEvent[] }) {
  // Agrupa por dia
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of events) {
      const d = new Date(e.at);
      const key = d.toLocaleDateString('pt-BR');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [events]);

  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Calendar className="w-12 h-12 mx-auto opacity-30 mb-3" />
        <p className="text-sm">Sem novidades nesse período.</p>
        <p className="text-xs mt-1">Tente expandir o filtro de datas.</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('pt-BR');
  const yest = new Date(Date.now() - 86400000).toLocaleDateString('pt-BR');

  return (
    <AnimatePresence>
      {grouped.map(([day, items]) => (
        <div key={day}>
          <div className="sticky top-0 z-10 px-4 py-2 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-white/[0.06] text-[11px] uppercase tracking-wide font-semibold text-slate-500">
            {day === today ? '📍 Hoje' : day === yest ? 'Ontem' : day} • {items.length}
          </div>
          <div>
            {items.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      ))}
    </AnimatePresence>
  );
}

export function TimelinePage() {
  const [view, setView] = useState<ViewMode>('hub');
  const [period, setPeriod] = useState<Period>('today');

  const range = periodRange(period);
  const config = VIEWS[view];

  const { data, loading, refetch } = useQuery<{
    companyTimeline: TimelineEvent[];
  }>(GET_COMPANY_TIMELINE, {
    variables: {
      fromDate: range.from.toISOString(),
      toDate: range.to.toISOString(),
      categories: config.categories,
      limit: 300,
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: 30_000,
  });

  const events = data?.companyTimeline ?? [];

  // Stats por categoria pro hub
  const statsHub = useMemo(() => {
    const counts: Record<TimelineCategory, number> = {
      FINANCIAL: 0,
      COMMERCIAL: 0,
      OPERATIONAL: 0,
      COMMUNICATIONS: 0,
      ALERTS: 0,
      ACTIVITY: 0,
    };
    for (const e of events) {
      for (const c of e.categories) counts[c] = (counts[c] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] px-6 py-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className={`w-12 h-12 rounded-xl ${COLOR_MAP[config.color].bg} ${COLOR_MAP[config.color].text} flex items-center justify-center`}>
            <config.Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">
              Novidades — {config.label}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {config.desc}
            </p>
          </div>
          <div className="flex gap-1.5">
            {(['today', 'yesterday', 'week', 'month'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-[12px] px-3 py-1.5 rounded-md border transition-colors ${
                  period === p
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400'
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
            <button
              onClick={() => refetch()}
              className="text-[12px] px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] inline-flex items-center gap-1"
              title="Atualizar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs das 7 versões */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] px-4 overflow-x-auto">
        <div className="flex gap-1">
          {(Object.keys(VIEWS) as ViewMode[]).map((key) => {
            const v = VIEWS[key];
            const Icon = v.Icon;
            const active = view === key;
            return (
              <button
                key={key}
                onClick={() => setView(key)}
                className={`relative flex items-center gap-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {v.label}
                {active && (
                  <motion.span
                    layoutId="active-tab"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${COLOR_MAP[v.color].text.replace('text-', 'bg-')}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Hub: KPIs por categoria */}
      {view === 'hub' && (
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06]">
          {(Object.keys(VIEWS) as ViewMode[])
            .filter((k) => k !== 'hub')
            .map((k) => {
              const v = VIEWS[k];
              const cat = v.categories?.[0];
              if (!cat) return null;
              const count = statsHub[cat] ?? 0;
              const c = COLOR_MAP[v.color];
              return (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`text-left p-3 rounded-lg border ${c.border} ${c.bg} hover:scale-[1.02] transition-transform`}
                >
                  <div className={`text-[10px] uppercase tracking-wide ${c.text} font-semibold`}>
                    {v.label}
                  </div>
                  <div className={`text-2xl font-bold ${c.text} mt-1`}>{count}</div>
                </button>
              );
            })}
        </div>
      )}

      {/* Feed */}
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border-x border-b border-slate-200 dark:border-white/[0.06] sm:rounded-b-lg sm:my-4 sm:mb-8 sm:shadow-sm overflow-hidden">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando timeline…
          </div>
        ) : (
          <GroupedFeed events={events} />
        )}
      </div>
    </div>
  );
}
