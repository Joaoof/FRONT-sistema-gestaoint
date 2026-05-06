import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Bookmark,
  Bot,
  Calendar,
  DollarSign,
  Globe,
  Heart,
  Loader2,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Send,
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
import { useCompany } from '../contexts/CompanyContext';

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
  hub: { label: 'Hub', desc: 'Tudo da empresa', Icon: Sparkles, color: 'violet', categories: null },
  financial: { label: 'Financeiro', desc: 'Pagamentos e fluxo de caixa', Icon: Wallet, color: 'emerald', categories: ['FINANCIAL'] },
  commercial: { label: 'Comercial', desc: 'Vendas e novos clientes', Icon: ShoppingCart, color: 'blue', categories: ['COMMERCIAL'] },
  operational: { label: 'Operacional', desc: 'Entregas e estoque', Icon: Truck, color: 'amber', categories: ['OPERATIONAL'] },
  communications: { label: 'Comunicações', desc: 'WhatsApp e chamadas', Icon: MessageCircle, color: 'green', categories: ['COMMUNICATIONS'] },
  alerts: { label: 'Alertas', desc: 'O que precisa de atenção', Icon: AlertTriangle, color: 'rose', categories: ['ALERTS'] },
  activity: { label: 'Atividade', desc: 'Quem fez o que', Icon: Users, color: 'slate', categories: ['ACTIVITY'] },
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

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

const ICON_MAP: Record<string, typeof Sparkles> = {
  sale: ShoppingCart, receivable: TrendingUp, payable: TrendingDown,
  cash: DollarSign, customer: UserPlus, delivery: Truck,
  stock: Package, message: MessageCircle, call: Phone,
  reminder: Bell, chatbot: Bot,
};

// Gradientes vibrantes estilo Instagram pro banner do post
const GRADIENT_MAP: Record<string, string> = {
  emerald: 'from-emerald-400 via-green-500 to-teal-600',
  amber: 'from-amber-400 via-orange-500 to-red-500',
  rose: 'from-rose-400 via-pink-500 to-fuchsia-600',
  blue: 'from-blue-400 via-indigo-500 to-purple-600',
  violet: 'from-violet-500 via-purple-500 to-pink-500',
  green: 'from-green-400 via-emerald-500 to-teal-600',
  slate: 'from-slate-500 via-slate-600 to-slate-700',
};

const CHIP_BG: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
};

const TYPE_HASHTAG: Record<string, string> = {
  ORDER_CREATED: '#novavenda',
  ORDER_PAID: '#vendapaga',
  ORDER_CANCELED: '#cancelamento',
  RECEIVABLE_CREATED: '#contaareceber',
  RECEIVABLE_PAID: '#recebido',
  RECEIVABLE_OVERDUE: '#atrasado',
  PAYABLE_CREATED: '#contaapagar',
  PAYABLE_PAID: '#pago',
  CASH_ENTRY: '#entrada',
  CASH_EXIT: '#saida',
  CUSTOMER_CREATED: '#novocliente',
  DELIVERY_CREATED: '#entrega',
  DELIVERY_DELIVERED: '#entregaconcluida',
  STOCK_LOW: '#estoque',
  WHATSAPP_MESSAGE_IN: '#whatsapp',
  WHATSAPP_CALL: '#chamada',
  WHATSAPP_REMINDER_DUE: '#lembrete',
  WHATSAPP_CHATBOT_FIRED: '#chatbot',
};

function PostCard({ event, companyName }: { event: TimelineEvent; companyName: string }) {
  const Icon = ICON_MAP[event.iconKey] ?? Globe;
  const gradient = GRADIENT_MAP[event.colorKey] ?? GRADIENT_MAP.slate;
  const chip = CHIP_BG[event.colorKey] ?? CHIP_BG.slate;
  const hashtag = TYPE_HASHTAG[event.type] ?? '#sistema';

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [animateLike, setAnimateLike] = useState(false);

  const handleLike = () => {
    setLiked((v) => !v);
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 700);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/[0.08] overflow-hidden shadow-sm"
    >
      {/* Header — username + ações */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${gradient} p-[2px] shrink-0`}>
          <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm">
            {companyName.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[14px] text-slate-900 dark:text-white truncate">
              {companyName}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-[13px] text-slate-500">{relativeTime(event.at)}</span>
          </div>
          {event.actor && (
            <div className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
              por {event.actor}
            </div>
          )}
        </div>
        <button
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
          title="Mais"
        >
          <span className="block leading-none text-lg">⋯</span>
        </button>
      </div>

      {/* Banner — gradient com ícone grande estilo "post" */}
      <div className={`relative aspect-[5/4] sm:aspect-[4/3] bg-gradient-to-br ${gradient} flex flex-col items-center justify-center text-white px-6 py-8`}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 20 }}
          className="bg-white/20 backdrop-blur-sm rounded-full p-5 mb-4 ring-2 ring-white/30"
        >
          <Icon className="w-12 h-12" strokeWidth={1.75} />
        </motion.div>
        {event.amount != null && (
          <div className="text-[36px] sm:text-[44px] font-bold leading-none drop-shadow-sm">
            {formatBRL(event.amount)}
          </div>
        )}
        <div className="text-center mt-3">
          <div className="text-[16px] sm:text-[18px] font-semibold leading-tight">
            {event.title}
          </div>
        </div>
        {/* Animação coração ao curtir */}
        <AnimatePresence>
          {animateLike && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-32 h-32 text-white drop-shadow-2xl" fill="currentColor" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action bar — like, comment, share, save */}
      <div className="px-3 pt-3 pb-1 flex items-center gap-1">
        <button
          onClick={handleLike}
          className="p-2 hover:opacity-60 transition-opacity"
          aria-label="Curtir"
        >
          <Heart
            className={`w-6 h-6 transition-all ${
              liked ? 'text-rose-500 scale-110' : 'text-slate-700 dark:text-slate-200'
            }`}
            fill={liked ? 'currentColor' : 'none'}
            strokeWidth={liked ? 0 : 2}
          />
        </button>
        <button className="p-2 hover:opacity-60 transition-opacity" aria-label="Comentar">
          <MessageCircle className="w-6 h-6 text-slate-700 dark:text-slate-200" strokeWidth={2} />
        </button>
        <button className="p-2 hover:opacity-60 transition-opacity" aria-label="Compartilhar">
          <Send className="w-[22px] h-[22px] text-slate-700 dark:text-slate-200" strokeWidth={2} />
        </button>
        <button
          onClick={() => setSaved((v) => !v)}
          className="p-2 hover:opacity-60 transition-opacity ml-auto"
          aria-label="Salvar"
        >
          <Bookmark
            className={`w-6 h-6 transition-colors ${
              saved ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'
            }`}
            fill={saved ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Caption */}
      <div className="px-4 pb-1">
        {liked && (
          <div className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1">
            Você curtiu
          </div>
        )}
        <div className="text-[13.5px] leading-snug">
          <span className="font-semibold text-slate-900 dark:text-white">
            {companyName}
          </span>{' '}
          <span className="text-slate-700 dark:text-slate-300">
            {event.description ?? event.title}
          </span>
        </div>
        <div className="mt-1.5">
          <span className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${chip}`}>
            {hashtag}
          </span>
        </div>
        <div className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          {new Date(event.at).toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Comment input fake (visual) */}
      <div className="px-4 py-3 mt-1 border-t border-slate-100 dark:border-white/[0.06] flex items-center gap-2 text-[13px] text-slate-400">
        <span className="text-lg">😀</span>
        <input
          placeholder="Adicione um comentário…"
          className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
      </div>
    </motion.article>
  );
}

export function TimelinePage() {
  const { company } = useCompany();
  const companyName = company?.name ?? 'Sua empresa';
  const [view, setView] = useState<ViewMode>('hub');
  const [period, setPeriod] = useState<Period>('today');

  const range = periodRange(period);
  const config = VIEWS[view];

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
    pollInterval: 30_000,
  });

  const events = data?.companyTimeline ?? [];

  const statsHub = useMemo(() => {
    const counts: Record<TimelineCategory, number> = {
      FINANCIAL: 0, COMMERCIAL: 0, OPERATIONAL: 0,
      COMMUNICATIONS: 0, ALERTS: 0, ACTIVITY: 0,
    };
    for (const e of events) for (const c of e.categories) counts[c] = (counts[c] ?? 0) + 1;
    return counts;
  }, [events]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] px-4 sm:px-6 py-4 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-[700px] mx-auto flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRADIENT_MAP[config.color]} flex items-center justify-center text-white shrink-0`}>
            <config.Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-bold text-slate-900 dark:text-white">
              {config.label}
            </h1>
            <p className="text-[12px] text-slate-500">{config.desc}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300"
            title="Atualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Stories-like row — 7 categorias com avatares circulares estilo IG stories */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] px-3 py-3 overflow-x-auto">
        <div className="max-w-[700px] mx-auto flex gap-3">
          {(Object.keys(VIEWS) as ViewMode[]).map((key) => {
            const v = VIEWS[key];
            const Icon = v.Icon;
            const active = view === key;
            const cat = v.categories?.[0];
            const count = cat ? statsHub[cat] ?? 0 : events.length;
            return (
              <button
                key={key}
                onClick={() => setView(key)}
                className="flex flex-col items-center gap-1.5 shrink-0 group"
              >
                <div className="relative">
                  <div className={`w-[68px] h-[68px] rounded-full p-[3px] ${
                    active
                      ? `bg-gradient-to-br ${GRADIENT_MAP[v.color]}`
                      : 'bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 dark:from-white/20 dark:via-white/30 dark:to-white/20'
                  } group-hover:scale-105 transition-transform`}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                      <Icon className={`w-7 h-7 ${active ? CHIP_BG[v.color].split(' ')[1] : 'text-slate-500'}`} strokeWidth={2} />
                    </div>
                  </div>
                  {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] ${
                  active ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {v.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros de período */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] px-3 py-2.5">
        <div className="max-w-[700px] mx-auto flex gap-1.5 overflow-x-auto">
          {(['today', 'yesterday', 'week', 'month'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[12px] px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                period === p
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                  : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400 self-center">
            {events.length} post{events.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Feed */}
      <main className="max-w-[700px] mx-auto px-3 py-4 space-y-4">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 rounded-lg p-4 text-sm">
            <strong>Erro ao carregar:</strong>{' '}
            {error.message}
          </div>
        )}
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Carregando posts…
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/[0.08] py-16 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-white text-lg">
              Sem posts ainda
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Tudo que acontece no sistema vira post aqui.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              Tente expandir o período ou registrar uma nova venda.
            </p>
          </div>
        ) : (
          events.map((e) => (
            <PostCard key={e.id} event={e} companyName={companyName} />
          ))
        )}

        {/* Footer — fim do feed */}
        {events.length > 0 && !loading && (
          <div className="text-center py-8 text-[12px] text-slate-400">
            <Sparkles className="w-5 h-5 mx-auto mb-2 opacity-50" />
            Você está em dia com tudo
          </div>
        )}
      </main>
    </div>
  );
}
