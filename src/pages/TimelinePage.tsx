import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bot,
  Calendar,
  ChevronRight,
  DollarSign,
  Globe,
  Layers,
  Loader2,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Search,
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

type ViewKey =
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
  accent: string;
  categories: TimelineCategory[] | null;
}

const VIEWS: Record<ViewKey, ViewConfig> = {
  hub: {
    label: 'Hub',
    desc: 'Visão consolidada de tudo que acontece na empresa',
    Icon: Layers,
    accent: 'violet',
    categories: null,
  },
  financial: {
    label: 'Financeiro',
    desc: 'Pagamentos recebidos, despesas e fluxo de caixa',
    Icon: Wallet,
    accent: 'emerald',
    categories: ['FINANCIAL'],
  },
  commercial: {
    label: 'Comercial',
    desc: 'Vendas registradas, novos clientes, conversões',
    Icon: ShoppingCart,
    accent: 'blue',
    categories: ['COMMERCIAL'],
  },
  operational: {
    label: 'Operacional',
    desc: 'Entregas, ajustes de estoque, ordens em execução',
    Icon: Truck,
    accent: 'amber',
    categories: ['OPERATIONAL'],
  },
  communications: {
    label: 'Comunicações',
    desc: 'WhatsApp, chamadas e respostas automáticas',
    Icon: MessageCircle,
    accent: 'green',
    categories: ['COMMUNICATIONS'],
  },
  alerts: {
    label: 'Alertas',
    desc: 'Itens que demandam atenção imediata',
    Icon: AlertTriangle,
    accent: 'rose',
    categories: ['ALERTS'],
  },
  activity: {
    label: 'Atividade',
    desc: 'Histórico de quem fez o que',
    Icon: Users,
    accent: 'slate',
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
  const startOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const endOf = (d: Date) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };
  if (p === 'today') return { from: startOf(now), to: endOf(now) };
  if (p === 'yesterday') {
    const y = new Date(now); y.setDate(y.getDate() - 1);
    return { from: startOf(y), to: endOf(y) };
  }
  const days = p === 'week' ? 7 : 30;
  const from = new Date(now); from.setDate(from.getDate() - days);
  return { from: startOf(from), to: endOf(now) };
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function relativeShort(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const ICON_MAP: Record<string, typeof Sparkles> = {
  sale: ShoppingCart, receivable: TrendingUp, payable: TrendingDown,
  cash: DollarSign, customer: UserPlus, delivery: Truck,
  stock: Package, message: MessageCircle, call: Phone,
  reminder: Bell, chatbot: Bot,
};

const ACCENT: Record<
  string,
  { ring: string; text: string; bg: string; bgSoft: string; dot: string }
> = {
  emerald: {
    ring: 'ring-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-600',
    bgSoft: 'bg-emerald-50 dark:bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  amber: {
    ring: 'ring-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-600',
    bgSoft: 'bg-amber-50 dark:bg-amber-500/10',
    dot: 'bg-amber-500',
  },
  rose: {
    ring: 'ring-rose-500',
    text: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-600',
    bgSoft: 'bg-rose-50 dark:bg-rose-500/10',
    dot: 'bg-rose-500',
  },
  blue: {
    ring: 'ring-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-600',
    bgSoft: 'bg-blue-50 dark:bg-blue-500/10',
    dot: 'bg-blue-500',
  },
  violet: {
    ring: 'ring-violet-500',
    text: 'text-violet-700 dark:text-violet-400',
    bg: 'bg-violet-600',
    bgSoft: 'bg-violet-50 dark:bg-violet-500/10',
    dot: 'bg-violet-500',
  },
  green: {
    ring: 'ring-green-500',
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-600',
    bgSoft: 'bg-green-50 dark:bg-green-500/10',
    dot: 'bg-green-500',
  },
  slate: {
    ring: 'ring-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-600',
    bgSoft: 'bg-slate-100 dark:bg-white/[0.06]',
    dot: 'bg-slate-500',
  },
};

const TYPE_LABEL_SHORT: Record<string, string> = {
  ORDER_CREATED: 'Venda',
  ORDER_PAID: 'Venda paga',
  ORDER_CANCELED: 'Venda cancelada',
  RECEIVABLE_CREATED: 'A receber',
  RECEIVABLE_PAID: 'Recebimento',
  RECEIVABLE_OVERDUE: 'Vencido',
  PAYABLE_CREATED: 'A pagar',
  PAYABLE_PAID: 'Pagamento',
  CASH_ENTRY: 'Entrada',
  CASH_EXIT: 'Saída',
  CUSTOMER_CREATED: 'Novo cliente',
  DELIVERY_CREATED: 'Entrega agendada',
  DELIVERY_DELIVERED: 'Entrega concluída',
  STOCK_LOW: 'Estoque crítico',
  WHATSAPP_MESSAGE_IN: 'Mensagem',
  WHATSAPP_CALL: 'Chamada',
  WHATSAPP_REMINDER_DUE: 'Lembrete',
  WHATSAPP_CHATBOT_FIRED: 'Chatbot',
};

function EventRow({ event }: { event: TimelineEvent }) {
  const Icon = ICON_MAP[event.iconKey] ?? Globe;
  const a = ACCENT[event.colorKey] ?? ACCENT.slate;
  const typeLabel = TYPE_LABEL_SHORT[event.type] ?? '';

  return (
    <li className="relative pl-12 pr-4 py-3 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
      {/* Bullet na linha do tempo */}
      <span
        className={`absolute left-[18px] top-[18px] w-3 h-3 rounded-full ${a.dot} ring-4 ring-white dark:ring-slate-900 z-10`}
      />
      {/* Ícone pequeno opcional */}
      <span
        className={`absolute left-[34px] top-[14px] w-6 h-6 rounded-md ${a.bgSoft} ${a.text} flex items-center justify-center`}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      </span>

      <div className="ml-8 flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 dark:text-white text-[14px] leading-tight">
              {event.title}
            </span>
            {typeLabel && (
              <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${a.bgSoft} ${a.text} font-medium`}>
                {typeLabel}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
              {event.description}
            </p>
          )}
          {event.actor && (
            <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1">
              por {event.actor}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {event.amount != null && (
            <span className={`font-semibold text-[14px] ${a.text}`}>
              {formatBRL(event.amount)}
            </span>
          )}
          <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            {timeOnly(event.at)}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {relativeShort(event.at)}
          </span>
        </div>
      </div>
    </li>
  );
}

export function TimelinePage() {
  const params = useParams<{ category?: string }>();
  const navigate = useNavigate();

  const view: ViewKey = (params.category as ViewKey) || 'hub';
  const config = VIEWS[view] ?? VIEWS.hub;

  const [period, setPeriod] = useState<Period>('today');
  const [search, setSearch] = useState('');

  const range = periodRange(period);
  const accent = ACCENT[config.accent];

  const { data, loading, error, refetch } = useQuery<{
    companyTimeline: TimelineEvent[];
  }>(GET_COMPANY_TIMELINE, {
    variables: {
      fromDate: range.from.toISOString(),
      toDate: range.to.toISOString(),
      categories: config.categories,
      limit: 300,
    },
    fetchPolicy: 'cache-and-network',
    pollInterval: 60_000,
  });

  const events = data?.companyTimeline ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) =>
      [e.title, e.description, e.actor].some(
        (s) => s && s.toLowerCase().includes(q),
      ),
    );
  }, [events, search]);

  // Agrupa por dia
  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of filtered) {
      const d = new Date(e.at);
      const key = d.toLocaleDateString('pt-BR');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  // KPIs por categoria (no Hub)
  const statsHub = useMemo(() => {
    const counts: Record<TimelineCategory, number> = {
      FINANCIAL: 0, COMMERCIAL: 0, OPERATIONAL: 0,
      COMMUNICATIONS: 0, ALERTS: 0, ACTIVITY: 0,
    };
    for (const e of events) for (const c of e.categories) counts[c] = (counts[c] ?? 0) + 1;
    return counts;
  }, [events]);

  // KPIs específicos pra cada categoria
  const categoryStats = useMemo(() => {
    if (view === 'financial') {
      const entries = events.filter((e) => e.type === 'CASH_ENTRY' || e.type === 'RECEIVABLE_PAID' || e.type === 'ORDER_PAID');
      const exits = events.filter((e) => e.type === 'CASH_EXIT' || e.type === 'PAYABLE_PAID');
      const totalIn = entries.reduce((s, e) => s + (e.amount ?? 0), 0);
      const totalOut = exits.reduce((s, e) => s + (e.amount ?? 0), 0);
      return [
        { label: 'Entradas', value: formatBRL(totalIn), accent: 'emerald' as const, count: entries.length },
        { label: 'Saídas', value: formatBRL(totalOut), accent: 'rose' as const, count: exits.length },
        { label: 'Resultado', value: formatBRL(totalIn - totalOut), accent: totalIn - totalOut >= 0 ? ('emerald' as const) : ('rose' as const) },
      ];
    }
    if (view === 'commercial') {
      const sales = events.filter((e) => e.type === 'ORDER_CREATED' || e.type === 'ORDER_PAID');
      const totalSales = sales.reduce((s, e) => s + (e.amount ?? 0), 0);
      const customers = events.filter((e) => e.type === 'CUSTOMER_CREATED').length;
      return [
        { label: 'Vendas', value: String(sales.length), accent: 'blue' as const },
        { label: 'Faturamento', value: formatBRL(totalSales), accent: 'emerald' as const },
        { label: 'Novos clientes', value: String(customers), accent: 'violet' as const },
      ];
    }
    if (view === 'operational') {
      const delivered = events.filter((e) => e.type === 'DELIVERY_DELIVERED').length;
      const created = events.filter((e) => e.type === 'DELIVERY_CREATED').length;
      const stockAlerts = events.filter((e) => e.type === 'STOCK_LOW').length;
      return [
        { label: 'Entregues', value: String(delivered), accent: 'emerald' as const },
        { label: 'Em rota', value: String(created), accent: 'amber' as const },
        { label: 'Estoque baixo', value: String(stockAlerts), accent: 'rose' as const },
      ];
    }
    if (view === 'communications') {
      const msgs = events.filter((e) => e.type === 'WHATSAPP_MESSAGE_IN').length;
      const calls = events.filter((e) => e.type === 'WHATSAPP_CALL').length;
      const bot = events.filter((e) => e.type === 'WHATSAPP_CHATBOT_FIRED').length;
      const reminders = events.filter((e) => e.type === 'WHATSAPP_REMINDER_DUE').length;
      return [
        { label: 'Mensagens', value: String(msgs), accent: 'green' as const },
        { label: 'Chamadas', value: String(calls), accent: 'violet' as const },
        { label: 'Chatbot', value: String(bot), accent: 'blue' as const },
        { label: 'Lembretes', value: String(reminders), accent: 'amber' as const },
      ];
    }
    if (view === 'alerts') {
      const overdue = events.filter((e) => e.type === 'RECEIVABLE_OVERDUE').length;
      const stock = events.filter((e) => e.type === 'STOCK_LOW').length;
      const canceled = events.filter((e) => e.type === 'ORDER_CANCELED').length;
      return [
        { label: 'AR vencidos', value: String(overdue), accent: 'rose' as const },
        { label: 'Estoque crítico', value: String(stock), accent: 'amber' as const },
        { label: 'Cancelamentos', value: String(canceled), accent: 'rose' as const },
      ];
    }
    return [];
  }, [view, events]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950">
      {/* Breadcrumb + Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 pt-4 pb-2">
          {view !== 'hub' && (
            <button
              onClick={() => navigate('/timeline')}
              className="inline-flex items-center gap-1 text-[12px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar para Hub
            </button>
          )}
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg ${accent.bgSoft} ${accent.text} flex items-center justify-center shrink-0`}>
              <config.Icon className="w-6 h-6" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 dark:text-slate-400">
                <span>Novidades do dia</span>
                {view !== 'hub' && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span>{config.label}</span>
                  </>
                )}
              </div>
              <h1 className="text-[22px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight mt-0.5">
                {view === 'hub' ? 'Tudo que aconteceu' : config.label}
              </h1>
              <p className="text-[13.5px] text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                {config.desc}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="h-9 px-3 rounded-md border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] inline-flex items-center gap-1.5 text-[12.5px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Tabs (categorias como navegação primária) */}
        <nav className="max-w-6xl mx-auto px-2 flex overflow-x-auto">
          {(Object.keys(VIEWS) as ViewKey[]).map((key) => {
            const v = VIEWS[key];
            const Icon = v.Icon;
            const active = view === key;
            const count = v.categories?.[0] ? statsHub[v.categories[0]] : events.length;
            return (
              <button
                key={key}
                onClick={() => navigate(key === 'hub' ? '/timeline' : `/timeline/${key}`)}
                className={`relative inline-flex items-center gap-2 px-4 py-3 text-[13px] whitespace-nowrap transition-colors ${
                  active
                    ? 'text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? ACCENT[v.accent].text : ''}`} />
                {v.label}
                {key !== 'hub' && count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    active ? ACCENT[v.accent].bgSoft + ' ' + ACCENT[v.accent].text : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="tl-tab"
                    className={`absolute bottom-0 left-0 right-0 h-[2px] ${ACCENT[v.accent].bg}`}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Toolbar — período + busca */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.04] rounded-md p-0.5">
            {(['today', 'yesterday', 'week', 'month'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-[12px] px-3 py-1.5 rounded transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nesta lista…"
              className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[12.5px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/10"
            />
          </div>
          <span className="text-[11.5px] text-slate-500 ml-auto">
            {filtered.length} de {events.length} eventos
          </span>
        </div>
      </div>

      {/* KPIs específicos por categoria */}
      {(view !== 'hub' && categoryStats.length > 0) && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] px-6 py-4">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categoryStats.map((s) => {
              const a = ACCENT[s.accent];
              return (
                <div
                  key={s.label}
                  className={`rounded-lg border ${a.ring.replace('ring-', 'border-')}/30 ${a.bgSoft} p-3`}
                >
                  <div className={`text-[10.5px] uppercase tracking-wide ${a.text} font-semibold`}>
                    {s.label}
                  </div>
                  <div className={`text-[20px] font-bold ${a.text} mt-0.5 tabular-nums`}>
                    {s.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hub — cards de cada categoria pra navegar */}
      {view === 'hub' && (
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {(Object.keys(VIEWS) as ViewKey[])
              .filter((k) => k !== 'hub')
              .map((k) => {
                const v = VIEWS[k];
                const Icon = v.Icon;
                const cat = v.categories?.[0];
                const count = cat ? statsHub[cat] ?? 0 : 0;
                const a = ACCENT[v.accent];
                return (
                  <button
                    key={k}
                    onClick={() => navigate(`/timeline/${k}`)}
                    className={`text-left p-4 rounded-xl border bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-white/20 transition-all hover:-translate-y-0.5 hover:shadow-md ${a.ring.replace('ring-', 'border-')}/20`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${a.bgSoft} ${a.text} flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="text-[13px] font-semibold text-slate-900 dark:text-white">
                      {v.label}
                    </div>
                    <div className={`text-[22px] font-bold ${a.text} mt-1 tabular-nums leading-none`}>
                      {count}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 leading-tight line-clamp-2">
                      {v.desc}
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Feed — timeline vertical com linha conectora */}
      <main className="max-w-6xl mx-auto px-6 py-4">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-lg p-4 text-sm mb-4">
            <strong>Erro ao carregar:</strong> {error.message}
          </div>
        )}

        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 py-16 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {search ? 'Nada corresponde à busca' : 'Sem eventos no período'}
            </h3>
            <p className="text-[13px] text-slate-500 mt-1">
              {search
                ? 'Tente outro termo ou limpe o filtro.'
                : 'Tente expandir o período ou volte mais tarde.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {grouped.map(([day, items]) => (
              <section
                key={day}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden"
              >
                <header className="px-4 py-2.5 bg-slate-50/60 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      {day}
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      {items.length} evento{items.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </header>
                <ul className="relative divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {/* Linha vertical da timeline */}
                  <span
                    aria-hidden
                    className="absolute left-[24px] top-3 bottom-3 w-px bg-slate-200 dark:bg-white/10"
                  />
                  {items.map((e) => (
                    <EventRow key={e.id} event={e} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
