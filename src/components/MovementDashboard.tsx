import { useMemo, useState } from 'react';
import {
    ArrowUpRight,
    Calendar,
    Plus,
    Receipt,
    ArrowUp,
    ArrowDown,
    Bell,
    AlertTriangle,
    Flame,
    Target,
    Activity,
    TrendingUp,
    GripVertical,
    EyeOff,
    Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS } from '../graphql/queries/dashboard';
import { GET_CASH_MOVEMENTS } from '../graphql/queries/queries';
import { GET_BANKS } from '../graphql/queries/banks';
import { LoadingSpinner } from './common/LoadingSpinner';
import { formatCurrency } from '../utils/formatValue';
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../hooks/useNotification';

// ============================================================
// SHARED LABELS
// ============================================================

const CATEGORY_LABEL: Record<string, string> = {
    SALE: 'Venda', CHANGE: 'Troco', OTHER_IN: 'Outros',
    EXPENSE: 'Despesa', WITHDRAWAL: 'Saque', PAYMENT: 'Pagamento',
};
const CATEGORY_COLOR: Record<string, string> = {
    SALE: '#10b981', CHANGE: '#14b8a6', OTHER_IN: '#22c55e',
    EXPENSE: '#ef4444', WITHDRAWAL: '#f97316', PAYMENT: '#e11d48',
};

function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (day > 0) return `há ${day}d`;
    if (hr > 0) return `há ${hr}h`;
    if (min > 0) return `há ${min} min`;
    return 'agora';
}

interface Move {
    id: string;
    type: 'ENTRY' | 'EXIT';
    category: string;
    value: number;
    description: string;
    date: string;
    typePayment?: string | null;
    bankId?: string | null;
}

interface DashboardData {
    filterDate: string;
    setFilterDate: (d: string) => void;
    navigate: (to: string) => void;
    handleLogout: () => void;
    entries: number;
    exits: number;
    balance: number;
    totalMes: number;
    totalMovements: number;
    comparison: { delta: number; entriesDelta: number; exitsDelta: number };
    dailyTrend: Array<{ date: string; entradas: number; saidas: number; saldo: number; label: string }>;
    categoryBreakdown: Array<{ category: string; label: string; color: string; count: number; total: number }>;
    todayBars: Array<{ name: string; valor: number; color: string }>;
    recentMoves: Move[];
    bankBalance: Array<{ name: string; color: string; total: number }>;
    bankMap: Map<string, { name: string; corHex: string }>;
    totalCatVolume: number;
    allMoves: Move[];
    user: { name?: string } | null;
}

const VERSIONS = [
    { id: 'magazine', label: 'Editorial', sub: 'Magazine pro' },
    { id: 'terminal', label: 'Terminal', sub: 'Bloomberg-like' },
    { id: 'rings', label: 'Anéis', sub: 'Apple Health' },
    { id: 'liveops', label: 'Live Ops', sub: 'Status & alertas' },
    { id: 'modular', label: 'Modular', sub: 'Notion blocks' },
] as const;

type VersionId = typeof VERSIONS[number]['id'];

// ============================================================
// MAIN COMPONENT (data + selector)
// ============================================================

export function MovementDashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState<string>(today);
    const [version, setVersion] = useState<VersionId>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('mov_dash_version') : null;
        return (saved as VersionId) || 'magazine';
    });
    const { notifyError } = useNotification();
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const userId = user?.id;
    const token = localStorage.getItem('accessToken');
    const shouldSkip = !userId || isAuthLoading;

    const { data, loading, error } = useQuery(GET_DASHBOARD_STATS, {
        variables: { input: { date: filterDate, userId } },
        skip: shouldSkip,
        pollInterval: 30000,
        context: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: movesData } = useQuery(GET_CASH_MOVEMENTS, { fetchPolicy: 'cache-and-network' });
    const { data: banksData } = useQuery(GET_BANKS, { fetchPolicy: 'cache-and-network' });

    const allMoves = (movesData?.cashMovements ?? []) as Move[];
    const bankMap = useMemo(() => {
        const m = new Map<string, { name: string; corHex: string }>();
        for (const b of (banksData?.banks ?? []) as any[]) m.set(b.id, b);
        return m;
    }, [banksData]);

    const dashboardStats = data?.dashboardStats;
    const entries = dashboardStats?.todayEntries || 0;
    const exits = dashboardStats?.todayExits || 0;
    const balance = dashboardStats?.todayBalance || 0;
    const totalMes = dashboardStats?.monthlyTotal || 0;
    const totalMovements = dashboardStats?.totalMovements || allMoves.length;

    const dailyTrend = useMemo(() => {
        const map = new Map<string, { date: string; entradas: number; saidas: number; saldo: number; label: string }>();
        const days: string[] = [];
        const t = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(t);
            d.setDate(t.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days.push(key);
            map.set(key, { date: key, entradas: 0, saidas: 0, saldo: 0, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) });
        }
        for (const m of allMoves) {
            if (!m.date) continue;
            const key = new Date(m.date).toISOString().slice(0, 10);
            const slot = map.get(key);
            if (!slot) continue;
            if (m.type === 'ENTRY') slot.entradas += Number(m.value);
            else slot.saidas += Number(m.value);
            slot.saldo = slot.entradas - slot.saidas;
        }
        return days.map((k) => map.get(k)!);
    }, [allMoves]);

    const comparison = useMemo(() => {
        const last7 = dailyTrend.slice(-7);
        const prev7 = dailyTrend.slice(0, 7);
        const sumE = (a: typeof dailyTrend) => a.reduce((acc, b) => acc + b.entradas, 0);
        const sumS = (a: typeof dailyTrend) => a.reduce((acc, b) => acc + b.saidas, 0);
        const cur = sumE(last7) - sumS(last7);
        const prev = sumE(prev7) - sumS(prev7);
        const delta = prev === 0 ? 0 : ((cur - prev) / Math.abs(prev)) * 100;
        const eDelta = sumE(prev7) === 0 ? 0 : ((sumE(last7) - sumE(prev7)) / Math.abs(sumE(prev7))) * 100;
        const sDelta = sumS(prev7) === 0 ? 0 : ((sumS(last7) - sumS(prev7)) / Math.abs(sumS(prev7))) * 100;
        return { delta, entriesDelta: eDelta, exitsDelta: sDelta };
    }, [dailyTrend]);

    const categoryBreakdown = useMemo(() => {
        const counter = new Map<string, { count: number; total: number }>();
        for (const m of allMoves) {
            if (!m.date) continue;
            const key = new Date(m.date).toISOString().slice(0, 10);
            if (key !== filterDate) continue;
            const cur = counter.get(m.category) ?? { count: 0, total: 0 };
            cur.count += 1;
            cur.total += Number(m.value);
            counter.set(m.category, cur);
        }
        return Array.from(counter.entries())
            .map(([cat, v]) => ({ category: cat, label: CATEGORY_LABEL[cat] ?? cat, color: CATEGORY_COLOR[cat] ?? '#94a3b8', count: v.count, total: v.total }))
            .sort((a, b) => b.total - a.total);
    }, [allMoves, filterDate]);

    const totalCatVolume = categoryBreakdown.reduce((acc, c) => acc + c.total, 0);

    const todayBars = useMemo(() => categoryBreakdown.slice(0, 6).map((c) => ({ name: c.label, valor: c.total, color: c.color })), [categoryBreakdown]);

    const recentMoves = useMemo(() => {
        return [...allMoves]
            .sort((a, b) => {
                const da = a.date ? new Date(a.date).getTime() : 0;
                const db = b.date ? new Date(b.date).getTime() : 0;
                return db - da;
            })
            .slice(0, 8);
    }, [allMoves]);

    const bankBalance = useMemo(() => {
        const map = new Map<string, { name: string; color: string; total: number }>();
        for (const m of allMoves) {
            if (!m.bankId) continue;
            const b = bankMap.get(m.bankId);
            if (!b) continue;
            const cur = map.get(m.bankId) ?? { name: b.name, color: b.corHex, total: 0 };
            cur.total += m.type === 'ENTRY' ? Number(m.value) : -Number(m.value);
            map.set(m.bankId, cur);
        }
        return Array.from(map.values()).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    }, [allMoves, bankMap]);

    if (isAuthLoading || loading) return <LoadingSpinner />;

    if (error) {
        const errorMessage = getGraphQLErrorMessages(error);
        notifyError(errorMessage as any);
        return (
            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl m-8">
                <p className="text-lg font-semibold text-rose-700 dark:text-rose-300 mb-2">Falha ao carregar painel</p>
                <p className="text-sm text-rose-600 dark:text-rose-400">{String(errorMessage)}</p>
            </div>
        );
    }

    const handleLogout = async () => { await logout(); };

    const props: DashboardData = {
        filterDate, setFilterDate, navigate, handleLogout,
        entries, exits, balance, totalMes, totalMovements,
        comparison, dailyTrend, categoryBreakdown, todayBars,
        recentMoves, bankBalance, bankMap, totalCatVolume,
        allMoves, user,
    };

    const selectVersion = (v: VersionId) => {
        setVersion(v);
        try { localStorage.setItem('mov_dash_version', v); } catch { /* ok */ }
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-12">
            {/* VERSION SELECTOR (top) */}
            <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Versão do painel</span>
                        <div className="inline-flex rounded-md border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-slate-900 p-0.5">
                            {VERSIONS.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => selectVersion(v.id)}
                                    className={`px-2.5 h-7 rounded text-[11.5px] font-medium transition-colors ${version === v.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                    title={v.sub}
                                >
                                    {v.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <span className="text-[11px] text-slate-400">
                        Sua escolha fica salva. Você pode trocar a qualquer momento.
                    </span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={version}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                >
                    {version === 'magazine' && <V1Magazine {...props} />}
                    {version === 'terminal' && <V2Terminal {...props} />}
                    {version === 'rings' && <V3Rings {...props} />}
                    {version === 'liveops' && <V4LiveOps {...props} />}
                    {version === 'modular' && <V5Modular {...props} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// ============================================================
// V1 — MAGAZINE EDITORIAL
// ============================================================

function V1Magazine(p: DashboardData) {
    return (
        <div>
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-8 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        Painel · {new Date(p.filterDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                    <h1 className="mt-2 text-[32px] sm:text-[40px] font-semibold text-slate-900 dark:text-white tracking-[-0.025em] leading-[1.05]">Movimentações</h1>
                    <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">Visão consolidada do caixa · atualiza a cada 30s</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <DateInput value={p.filterDate} onChange={p.setFilterDate} />
                    <PrimaryAction label="Nova movimentação" onClick={() => p.navigate('/formulario-movimentacao')} />
                </div>
            </header>

            {/* Hero number */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-8 mb-12">
                <div className="lg:col-span-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Saldo do dia</p>
                    <p className={`mt-3 text-[64px] sm:text-[80px] font-semibold tracking-[-0.04em] leading-none tabular-nums font-mono ${p.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                        <CountUp end={p.balance} decimal="," decimals={2} prefix="R$ " separator="." duration={0.8} />
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-[12.5px]">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium tabular-nums ${p.comparison.delta >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                            {p.comparison.delta >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(p.comparison.delta).toFixed(1)}%
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">vs. semana anterior</span>
                    </div>
                </div>
                <div className="lg:col-span-7 grid grid-cols-3 gap-8">
                    <BigStat label="Entradas" value={p.entries} delta={p.comparison.entriesDelta} color="#10b981" />
                    <BigStat label="Saídas" value={p.exits} delta={p.comparison.exitsDelta} color="#ef4444" invertDelta />
                    <BigStat label="Lançamentos" value={p.totalMovements} kind="count" sub={`Ticket ${formatCurrency((p.entries + p.exits) / Math.max(p.totalMovements, 1))}`} />
                </div>
            </div>

            {/* Hero chart */}
            <div className="mb-12 pb-12 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="flex items-baseline justify-between mb-4">
                    <div>
                        <h2 className="text-[18px] font-semibold text-slate-900 dark:text-white tracking-tight">Fluxo</h2>
                        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">Últimos 14 dias</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11.5px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Entradas</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Saídas</span>
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={p.dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="m1-en" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.28} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                                <linearGradient id="m1-ex" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-400" axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-400" axisLine={false} tickLine={false} width={42} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                            <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n === 'entradas' ? 'Entradas' : 'Saídas']} contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '8px 10px' }} labelStyle={{ color: '#94a3b8', fontSize: 11 }} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={1.75} fill="url(#m1-en)" />
                            <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={1.75} fill="url(#m1-ex)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <section>
                    <h2 className="text-[18px] font-semibold text-slate-900 dark:text-white tracking-tight mb-1">Onde o dinheiro está</h2>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mb-5">Saldo líquido por banco</p>
                    {p.bankBalance.length === 0 ? <Empty msg="Nenhum banco com movimentações" cta="Cadastrar bancos" onClick={() => p.navigate('/bancos')} /> : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {p.bankBalance.map((b) => (
                                <li key={b.name} className="py-3 flex items-center justify-between">
                                    <span className="flex items-center gap-3 text-[14px] text-slate-900 dark:text-white">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                                        {b.name}
                                    </span>
                                    <span className={`text-[15px] font-mono font-medium tabular-nums ${b.total >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {formatCurrency(b.total)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section>
                    <h2 className="text-[18px] font-semibold text-slate-900 dark:text-white tracking-tight mb-1">Atividade recente</h2>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mb-5">Últimos lançamentos</p>
                    {p.recentMoves.length === 0 ? <Empty msg="Sem movimentações ainda" cta="Registrar primeira" onClick={() => p.navigate('/formulario-movimentacao')} /> : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {p.recentMoves.slice(0, 6).map((m) => (
                                <li key={m.id} className="py-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[13.5px] text-slate-900 dark:text-white truncate">{m.description}</p>
                                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400">{CATEGORY_LABEL[m.category] ?? m.category} · {timeAgo(new Date(m.date))}</p>
                                    </div>
                                    <span className={`text-[14px] font-mono tabular-nums shrink-0 ${m.type === 'ENTRY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {m.type === 'ENTRY' ? '+' : '−'}{formatCurrency(Number(m.value)).replace('R$', '').trim()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <button onClick={() => p.navigate('/historico')} className="mt-4 text-[12.5px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1">
                        Ver histórico completo <ArrowUpRight className="w-3 h-3" />
                    </button>
                </section>
            </div>
        </div>
    );
}

// ============================================================
// V2 — BLOOMBERG TERMINAL
// ============================================================

function V2Terminal(p: DashboardData) {
    const tickerData = p.recentMoves.concat(p.recentMoves).slice(0, 12);
    return (
        <div className="bg-slate-950 text-slate-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 rounded-md border border-white/[0.06] font-mono">
            {/* Header bar */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-emerald-400">● LIVE</span>
                    <span className="text-slate-400">CASH MONITOR</span>
                    <span className="text-slate-500">{new Date().toLocaleTimeString('pt-BR')}</span>
                    <span className="text-slate-500">USR {p.user?.name?.toUpperCase() ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <DateInput value={p.filterDate} onChange={p.setFilterDate} dark />
                    <button onClick={() => p.navigate('/formulario-movimentacao')} className="h-7 px-2.5 text-[11px] font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 rounded">+ NEW</button>
                </div>
            </div>

            {/* Top KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-3">
                <TermStat label="BALANCE" value={p.balance} color={p.balance >= 0 ? 'emerald' : 'rose'} delta={p.comparison.delta} />
                <TermStat label="ENTRIES" value={p.entries} color="emerald" delta={p.comparison.entriesDelta} />
                <TermStat label="EXITS" value={p.exits} color="rose" delta={p.comparison.exitsDelta} invertDelta />
                <TermStat label="MTD" value={p.totalMes} color="cyan" />
                <TermStat label="COUNT" value={p.totalMovements} color="amber" kind="count" />
                <TermStat label="ACCTS" value={p.bankBalance.length} color="violet" kind="count" />
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Chart */}
                <div className="lg:col-span-8 bg-slate-900/60 border border-white/[0.06] rounded p-3">
                    <div className="flex items-center justify-between mb-2 text-[10.5px]">
                        <span className="text-slate-400 uppercase tracking-wider">CASHFLOW · 14D</span>
                        <span className="text-amber-400">14D ROI {p.comparison.delta >= 0 ? '+' : ''}{p.comparison.delta.toFixed(1)}%</span>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer>
                            <LineChart data={p.dailyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                                <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#fff', fontSize: 11, fontFamily: 'monospace' }} cursor={{ stroke: '#94a3b8', strokeDasharray: '2 2' }} formatter={(v: number) => formatCurrency(v)} />
                                <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={1.25} dot={{ r: 1.5, fill: '#10b981' }} />
                                <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={1.25} dot={{ r: 1.5, fill: '#ef4444' }} />
                                <Line type="monotone" dataKey="saldo" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Watchlist accounts */}
                <div className="lg:col-span-4 bg-slate-900/60 border border-white/[0.06] rounded p-3">
                    <div className="flex items-center justify-between mb-3 text-[10.5px]">
                        <span className="text-slate-400 uppercase tracking-wider">WATCHLIST · ACCOUNTS</span>
                        <span className="text-slate-500">{p.bankBalance.length}</span>
                    </div>
                    {p.bankBalance.length === 0 ? <p className="text-[11px] text-slate-500 py-6 text-center">NO DATA</p> : (
                        <ul className="space-y-1 text-[11.5px]">
                            {p.bankBalance.slice(0, 8).map((b) => (
                                <li key={b.name} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                                        <span className="truncate uppercase tracking-wide">{b.name}</span>
                                    </span>
                                    <span className={`tabular-nums ${b.total >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {b.total >= 0 ? '+' : ''}{formatCurrency(b.total).replace('R$', '').trim()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Categories */}
                <div className="lg:col-span-4 bg-slate-900/60 border border-white/[0.06] rounded p-3">
                    <div className="text-[10.5px] text-slate-400 uppercase tracking-wider mb-3">CATEGORIES · TODAY</div>
                    {p.categoryBreakdown.length === 0 ? <p className="text-[11px] text-slate-500 py-6 text-center">NO DATA</p> : (
                        <ul className="space-y-1 text-[11.5px]">
                            {p.categoryBreakdown.map((c) => (
                                <li key={c.category} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                                    <span className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                        <span className="uppercase tracking-wide">{c.label}</span>
                                        <span className="text-slate-500">×{c.count}</span>
                                    </span>
                                    <span className="tabular-nums text-amber-300">{formatCurrency(c.total).replace('R$', '').trim()}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Order book / recent ticker */}
                <div className="lg:col-span-8 bg-slate-900/60 border border-white/[0.06] rounded p-3">
                    <div className="text-[10.5px] text-slate-400 uppercase tracking-wider mb-3">EXECUTIONS · LIVE</div>
                    {p.recentMoves.length === 0 ? <p className="text-[11px] text-slate-500 py-6 text-center">NO DATA</p> : (
                        <table className="w-full text-[11px]">
                            <thead>
                                <tr className="text-slate-500 uppercase tracking-wider text-[9.5px] border-b border-white/[0.04]">
                                    <th className="text-left py-1.5">TIME</th>
                                    <th className="text-left py-1.5">SIDE</th>
                                    <th className="text-left py-1.5">CAT</th>
                                    <th className="text-left py-1.5">DESC</th>
                                    <th className="text-right py-1.5">QTY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {p.recentMoves.slice(0, 8).map((m) => (
                                    <tr key={m.id} className="border-b border-white/[0.03]">
                                        <td className="py-1.5 text-slate-500 tabular-nums">{m.date ? new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                                        <td className="py-1.5">
                                            <span className={`text-[9.5px] font-bold tracking-wider ${m.type === 'ENTRY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {m.type === 'ENTRY' ? 'BUY' : 'SELL'}
                                            </span>
                                        </td>
                                        <td className="py-1.5 text-slate-300 uppercase text-[10px]">{(CATEGORY_LABEL[m.category] ?? m.category).slice(0, 4)}</td>
                                        <td className="py-1.5 text-slate-200 truncate max-w-xs">{m.description}</td>
                                        <td className={`py-1.5 text-right tabular-nums ${m.type === 'ENTRY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {m.type === 'ENTRY' ? '+' : '−'}{formatCurrency(Number(m.value)).replace('R$', '').trim()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Bottom ticker */}
            <div className="mt-3 bg-slate-900/60 border border-white/[0.06] rounded overflow-hidden">
                <div className="flex items-center gap-6 py-2 px-3 text-[11px] whitespace-nowrap overflow-hidden">
                    <span className="text-amber-400 font-bold shrink-0">▶ TICKER</span>
                    <motion.div
                        className="flex gap-6 shrink-0"
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
                    >
                        {tickerData.concat(tickerData).map((m, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                <span className="text-slate-500 uppercase">{(CATEGORY_LABEL[m.category] ?? m.category).slice(0, 4)}</span>
                                <span className={m.type === 'ENTRY' ? 'text-emerald-400' : 'text-rose-400'}>
                                    {m.type === 'ENTRY' ? '↑' : '↓'} {formatCurrency(Number(m.value)).replace('R$', '').trim()}
                                </span>
                            </span>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// V3 — APPLE HEALTH RINGS
// ============================================================

function V3Rings(p: DashboardData) {
    // Goals (sane defaults)
    const dailyGoal = 1000;
    const monthGoal = 30000;
    const countGoal = 10;

    const ringEntries = Math.min(p.entries / dailyGoal, 1);
    const ringMonth = Math.min(p.totalMes / monthGoal, 1);
    const ringCount = Math.min(p.totalMovements / countGoal, 1);

    // streak: dias consecutivos com saldo positivo terminando hoje
    const streak = useMemo(() => {
        let count = 0;
        for (let i = p.dailyTrend.length - 1; i >= 0; i--) {
            const d = p.dailyTrend[i];
            if (d.entradas - d.saidas > 0) count++;
            else break;
        }
        return count;
    }, [p.dailyTrend]);

    // heatmap 12 semanas (84 dias)
    const heatmap = useMemo(() => {
        const days: Array<{ date: string; total: number; level: number }> = [];
        const t = new Date();
        const max = Math.max(1, ...p.allMoves.map((m) => Number(m.value)));
        for (let i = 83; i >= 0; i--) {
            const d = new Date(t);
            d.setDate(t.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const dayMoves = p.allMoves.filter((m) => m.date && new Date(m.date).toISOString().slice(0, 10) === key);
            const total = dayMoves.reduce((acc, m) => acc + (m.type === 'ENTRY' ? Number(m.value) : 0), 0);
            const level = total === 0 ? 0 : Math.min(4, Math.ceil((total / max) * 4));
            days.push({ date: key, total, level });
        }
        return days;
    }, [p.allMoves]);

    return (
        <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-8 rounded-md min-h-[80vh]">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Atividade</p>
                    <h1 className="mt-1 text-[28px] font-semibold text-slate-900 dark:text-white tracking-tight">{new Date(p.filterDate).toLocaleDateString('pt-BR', { weekday: 'long' })}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <DateInput value={p.filterDate} onChange={p.setFilterDate} />
                    <PrimaryAction label="Nova" onClick={() => p.navigate('/formulario-movimentacao')} />
                </div>
            </header>

            {/* Big rings */}
            <div className="flex flex-col items-center mb-10">
                <ActivityRings rings={[
                    { progress: ringEntries, color: '#ef4f5e', label: 'ENTRADAS' },
                    { progress: ringMonth, color: '#a3e635', label: 'MÊS' },
                    { progress: ringCount, color: '#22d3ee', label: 'MOVES' },
                ]} />
                {/* Legend */}
                <div className="grid grid-cols-3 gap-6 mt-6 w-full max-w-md">
                    <RingLegend color="#ef4f5e" label="Entradas" cur={p.entries} goal={dailyGoal} />
                    <RingLegend color="#a3e635" label="Mês" cur={p.totalMes} goal={monthGoal} />
                    <RingLegend color="#22d3ee" label="Moves" cur={p.totalMovements} goal={countGoal} kind="count" />
                </div>
            </div>

            {/* Streak + saldo + maior do dia */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-500/10 grid place-items-center text-orange-500">
                        <Flame className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Streak</p>
                        <p className="text-[24px] font-semibold tabular-nums text-slate-900 dark:text-white">{streak}<span className="text-[14px] text-slate-400 ml-1">dias</span></p>
                        <p className="text-[11px] text-slate-500">{streak > 0 ? 'no positivo' : 'comece agora!'}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl grid place-items-center ${p.balance >= 0 ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-500'}`}>
                        {p.balance >= 0 ? <TrendingUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Saldo</p>
                        <p className={`text-[20px] font-semibold tabular-nums font-mono ${p.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
                            {formatCurrency(p.balance)}
                        </p>
                        <p className="text-[11px] text-slate-500">hoje</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/10 grid place-items-center text-violet-500">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-500">Maior</p>
                        <p className="text-[20px] font-semibold tabular-nums font-mono text-slate-900 dark:text-white">
                            {formatCurrency(Math.max(0, ...p.allMoves.filter((m) => m.date && new Date(m.date).toISOString().slice(0, 10) === p.filterDate).map((m) => Number(m.value))))}
                        </p>
                        <p className="text-[11px] text-slate-500">do dia</p>
                    </div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 mb-6">
                <div className="flex items-baseline justify-between mb-4">
                    <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Calendário</h2>
                    <span className="text-[11px] text-slate-500">12 semanas</span>
                </div>
                <div className="grid grid-flow-col grid-rows-7 gap-1">
                    {heatmap.map((d) => {
                        const colors = [
                            'bg-slate-100 dark:bg-white/[0.04]',
                            'bg-emerald-200 dark:bg-emerald-900/40',
                            'bg-emerald-300 dark:bg-emerald-700/60',
                            'bg-emerald-500 dark:bg-emerald-500',
                            'bg-emerald-600 dark:bg-emerald-400',
                        ];
                        return (
                            <div
                                key={d.date}
                                className={`w-3 h-3 rounded-[3px] ${colors[d.level]}`}
                                title={`${new Date(d.date).toLocaleDateString('pt-BR')} · ${formatCurrency(d.total)}`}
                            />
                        );
                    })}
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                    <span>menos</span>
                    {[0, 1, 2, 3, 4].map((l) => (
                        <span key={l} className={`w-3 h-3 rounded-[3px] ${l === 0 ? 'bg-slate-100 dark:bg-white/[0.04]' : `bg-emerald-${l * 100 + 200}`}`} />
                    ))}
                    <span>mais</span>
                </div>
            </div>

            {/* Achievements */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { icon: Flame, label: 'Streak 5', desc: '5 dias seguidos', achieved: streak >= 5 },
                    { icon: Target, label: 'Meta dia', desc: 'Bateu meta diária', achieved: ringEntries >= 1 },
                    { icon: TrendingUp, label: 'Em alta', desc: 'Crescendo +10%', achieved: p.comparison.delta >= 10 },
                    { icon: Zap, label: 'Ativo', desc: '10+ moves', achieved: ringCount >= 1 },
                ].map((a) => {
                    const Icon = a.icon;
                    return (
                        <div key={a.label} className={`p-4 rounded-xl border ${a.achieved ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/[0.06] opacity-50'}`}>
                            <Icon className={`w-5 h-5 mb-2 ${a.achieved ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                            <p className="text-[12.5px] font-semibold text-slate-900 dark:text-white">{a.label}</p>
                            <p className="text-[11px] text-slate-500">{a.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ActivityRings({ rings }: { rings: { progress: number; color: string; label: string }[] }) {
    const size = 240;
    const center = size / 2;
    const sw = 18;
    const radii = [center - sw / 2, center - sw - 8 - sw / 2, center - sw * 2 - 16 - sw / 2];
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
            {rings.map((r, i) => {
                const radius = radii[i];
                const circ = 2 * Math.PI * radius;
                return (
                    <g key={i} transform={`rotate(-90 ${center} ${center})`}>
                        <circle cx={center} cy={center} r={radius} stroke={r.color} strokeOpacity={0.18} strokeWidth={sw} fill="none" />
                        <motion.circle
                            cx={center}
                            cy={center}
                            r={radius}
                            stroke={r.color}
                            strokeWidth={sw}
                            strokeLinecap="round"
                            fill="none"
                            initial={{ strokeDasharray: `0 ${circ}` }}
                            animate={{ strokeDasharray: `${r.progress * circ} ${circ}` }}
                            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </g>
                );
            })}
        </svg>
    );
}

function RingLegend({ color, label, cur, goal, kind }: { color: string; label: string; cur: number; goal: number; kind?: 'count' }) {
    return (
        <div>
            <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-slate-500">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /> {label}
            </div>
            <p className="text-[15px] font-semibold mt-1 tabular-nums text-slate-900 dark:text-white font-mono">
                {kind === 'count' ? cur : formatCurrency(cur)}
                <span className="text-[11px] text-slate-400 font-normal ml-1">/ {kind === 'count' ? goal : formatCurrency(goal)}</span>
            </p>
            <p className="text-[10.5px] text-slate-500 mt-0.5">{((cur / goal) * 100).toFixed(0)}%</p>
        </div>
    );
}

// ============================================================
// V4 — LIVE OPS
// ============================================================

function V4LiveOps(p: DashboardData) {
    const dailyGoal = 1000, weekGoal = 7000, monthGoal = 30000;
    const dayPct = Math.min(100, (p.entries / dailyGoal) * 100);
    const weekRevenue = p.dailyTrend.slice(-7).reduce((a, b) => a + b.entradas, 0);
    const weekPct = Math.min(100, (weekRevenue / weekGoal) * 100);
    const monthPct = Math.min(100, (p.totalMes / monthGoal) * 100);

    const alerts: { kind: 'critical' | 'warning' | 'info'; msg: string }[] = [];
    if (p.balance < 0) alerts.push({ kind: 'critical', msg: `Saldo negativo: ${formatCurrency(p.balance)}` });
    if (dayPct < 50) alerts.push({ kind: 'warning', msg: `Meta diária: apenas ${dayPct.toFixed(0)}% atingida` });
    p.bankBalance.filter((b) => b.total < 0).forEach((b) => alerts.push({ kind: 'warning', msg: `${b.name}: ${formatCurrency(b.total)}` }));
    if (alerts.length === 0) alerts.push({ kind: 'info', msg: 'Tudo nominal · sem alertas críticos' });

    const overallStatus = alerts.some((a) => a.kind === 'critical') ? 'critical' : alerts.some((a) => a.kind === 'warning') ? 'warning' : 'healthy';

    return (
        <div>
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Operações · {new Date().toLocaleTimeString('pt-BR')}</p>
                    <h1 className="mt-1 text-[28px] font-semibold text-slate-900 dark:text-white tracking-tight">Status do caixa</h1>
                </div>
                <div className="flex items-center gap-2">
                    <DateInput value={p.filterDate} onChange={p.setFilterDate} />
                    <PrimaryAction label="Nova" onClick={() => p.navigate('/formulario-movimentacao')} />
                </div>
            </header>

            {/* Global status bar */}
            <div className={`mb-6 p-4 rounded-xl border ${
                overallStatus === 'critical' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40' :
                overallStatus === 'warning' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' :
                'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40'
            }`}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <span className={`relative flex w-3 h-3`}>
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                                overallStatus === 'critical' ? 'bg-rose-500' : overallStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                            <span className={`relative inline-flex w-3 h-3 rounded-full ${
                                overallStatus === 'critical' ? 'bg-rose-500' : overallStatus === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                        </span>
                        <div>
                            <p className={`text-[14px] font-semibold ${
                                overallStatus === 'critical' ? 'text-rose-700 dark:text-rose-300' :
                                overallStatus === 'warning' ? 'text-amber-700 dark:text-amber-300' :
                                'text-emerald-700 dark:text-emerald-300'
                            }`}>
                                {overallStatus === 'critical' ? 'Atenção crítica' : overallStatus === 'warning' ? 'Atenção necessária' : 'Saudável'}
                            </p>
                            <p className="text-[11.5px] text-slate-600 dark:text-slate-300">
                                {alerts.filter(a => a.kind !== 'info').length} alerta(s) · {p.totalMovements} movs hoje
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6 text-[12px]">
                        <Metric inline label="Saldo" value={formatCurrency(p.balance)} color={p.balance >= 0 ? 'emerald' : 'rose'} />
                        <Metric inline label="Entradas" value={formatCurrency(p.entries)} color="emerald" />
                        <Metric inline label="Saídas" value={formatCurrency(p.exits)} color="rose" />
                    </div>
                </div>
            </div>

            {/* Goals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <GoalCard label="Meta diária" cur={p.entries} goal={dailyGoal} pct={dayPct} period="hoje" />
                <GoalCard label="Meta semanal" cur={weekRevenue} goal={weekGoal} pct={weekPct} period="7 dias" />
                <GoalCard label="Meta mensal" cur={p.totalMes} goal={monthGoal} pct={monthPct} period="mês" />
            </div>

            {/* Alerts panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                        <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Bell className="w-3.5 h-3.5" /> Alertas
                        </h2>
                        <span className="text-[11px] text-slate-500">{alerts.length}</span>
                    </div>
                    <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {alerts.map((a, i) => (
                            <li key={i} className="px-5 py-3 flex items-center gap-3">
                                <span className={`w-7 h-7 rounded-md grid place-items-center shrink-0 ${
                                    a.kind === 'critical' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                    a.kind === 'warning' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                    'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                    {a.kind === 'critical' ? <AlertTriangle className="w-3.5 h-3.5" /> : a.kind === 'warning' ? <AlertTriangle className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                                </span>
                                <p className="text-[12.5px] text-slate-900 dark:text-slate-100">{a.msg}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl">
                    <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06]">
                        <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white tracking-tight">Saúde dos bancos</h2>
                    </div>
                    {p.bankBalance.length === 0 ? <p className="text-[12px] text-slate-400 py-8 text-center">Sem dados</p> : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {p.bankBalance.slice(0, 6).map((b) => {
                                const status = b.total < 0 ? 'critical' : b.total < 100 ? 'warning' : 'healthy';
                                return (
                                    <li key={b.name} className="px-5 py-3 flex items-center justify-between">
                                        <span className="flex items-center gap-2 min-w-0">
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                status === 'critical' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                            <span className="text-[12.5px] text-slate-900 dark:text-slate-100 truncate">{b.name}</span>
                                        </span>
                                        <span className={`text-[12px] font-mono tabular-nums ${b.total >= 0 ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {formatCurrency(b.total)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>

            {/* Live executions feed */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                    <h2 className="text-[13px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5" /> Eventos recentes
                    </h2>
                    <button onClick={() => p.navigate('/historico')} className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white">Ver tudo</button>
                </div>
                {p.recentMoves.length === 0 ? <p className="text-[12px] text-slate-400 py-12 text-center">Sem atividade recente</p> : (
                    <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {p.recentMoves.slice(0, 5).map((m) => (
                            <li key={m.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded ${m.type === 'ENTRY' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400'}`}>
                                        {m.date ? new Date(m.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </span>
                                    <p className="text-[12.5px] text-slate-900 dark:text-slate-100 truncate">{m.description}</p>
                                </div>
                                <span className={`text-[12.5px] font-mono tabular-nums shrink-0 ${m.type === 'ENTRY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {m.type === 'ENTRY' ? '+' : '−'}{formatCurrency(Number(m.value)).replace('R$', '').trim()}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function GoalCard({ label, cur, goal, pct, period }: { label: string; cur: number; goal: number; pct: number; period: string }) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl p-4">
            <div className="flex items-baseline justify-between mb-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
                <span className={`text-[11px] font-mono tabular-nums ${pct >= 100 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {pct.toFixed(0)}%
                </span>
            </div>
            <p className="text-[18px] font-mono font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(cur)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">de {formatCurrency(goal)} · {period}</p>
            <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-rose-500'}`}
                />
            </div>
        </div>
    );
}

function Metric({ label, value, color, inline }: { label: string; value: string; color: string; inline?: boolean }) {
    const cls = color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : color === 'rose' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white';
    return (
        <div className={inline ? 'text-right' : ''}>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`text-[14px] font-mono font-semibold tabular-nums ${cls}`}>{value}</p>
        </div>
    );
}

// ============================================================
// V5 — NOTION MODULAR
// ============================================================

function V5Modular(p: DashboardData) {
    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Bom dia';
        if (h < 18) return 'Boa tarde';
        return 'Boa noite';
    }, []);

    const [hidden, setHidden] = useState<Set<string>>(new Set());
    const toggle = (id: string) => {
        setHidden((s) => {
            const n = new Set(s);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });
    };

    const blocks: Array<{ id: string; node: React.ReactNode }> = [
        {
            id: 'saldo',
            node: (
                <ModularBlock id="saldo" title="Saldo de hoje" icon="●" onHide={toggle}>
                    <div className="flex items-baseline gap-3">
                        <span className={`text-[36px] font-semibold font-mono tabular-nums tracking-tight ${p.balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
                            <CountUp end={p.balance} decimal="," decimals={2} prefix="R$ " separator="." duration={0.7} />
                        </span>
                        <span className={`text-[12px] tabular-nums ${p.comparison.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {p.comparison.delta >= 0 ? '↑' : '↓'} {Math.abs(p.comparison.delta).toFixed(0)}%
                        </span>
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1">vs. semana anterior</p>
                </ModularBlock>
            ),
        },
        {
            id: 'fluxo',
            node: (
                <ModularBlock id="fluxo" title="Fluxo dos últimos 14 dias" icon="📈" onHide={toggle}>
                    <div className="h-32 -mx-2">
                        <ResponsiveContainer>
                            <AreaChart data={p.dailyTrend}>
                                <defs><linearGradient id="m5-en" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                                <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 11 }} formatter={(v: number) => formatCurrency(v)} />
                                <Area dataKey="entradas" stroke="#10b981" strokeWidth={1.5} fill="url(#m5-en)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ModularBlock>
            ),
        },
        {
            id: 'recentes',
            node: (
                <ModularBlock id="recentes" title="Atividade recente" icon="⏱" onHide={toggle}>
                    {p.recentMoves.length === 0 ? <p className="text-[12px] text-slate-500 py-3">Nenhuma movimentação ainda</p> : (
                        <ul className="space-y-2">
                            {p.recentMoves.slice(0, 5).map((m) => (
                                <li key={m.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={m.type === 'ENTRY' ? 'text-emerald-500' : 'text-rose-500'}>{m.type === 'ENTRY' ? '↗' : '↘'}</span>
                                        <span className="text-slate-900 dark:text-white truncate">{m.description}</span>
                                    </div>
                                    <span className={`font-mono tabular-nums shrink-0 ${m.type === 'ENTRY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {m.type === 'ENTRY' ? '+' : '−'}{formatCurrency(Number(m.value)).replace('R$', '').trim()}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </ModularBlock>
            ),
        },
        {
            id: 'bancos',
            node: (
                <ModularBlock id="bancos" title="Saldo por banco" icon="🏦" onHide={toggle}>
                    {p.bankBalance.length === 0 ? <p className="text-[12px] text-slate-500 py-3">Vincule um banco às movimentações</p> : (
                        <ul className="space-y-2">
                            {p.bankBalance.slice(0, 5).map((b) => (
                                <li key={b.name} className="flex items-center justify-between text-[12.5px]">
                                    <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} /> {b.name}</span>
                                    <span className={`font-mono tabular-nums ${b.total >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(b.total)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </ModularBlock>
            ),
        },
        {
            id: 'categorias',
            node: (
                <ModularBlock id="categorias" title="Top categorias hoje" icon="🏷" onHide={toggle}>
                    {p.categoryBreakdown.length === 0 ? <p className="text-[12px] text-slate-500 py-3">Sem categorias hoje</p> : (
                        <ul className="space-y-2">
                            {p.categoryBreakdown.slice(0, 4).map((c) => {
                                const pct = p.totalCatVolume > 0 ? (c.total / p.totalCatVolume) * 100 : 0;
                                return (
                                    <li key={c.category}>
                                        <div className="flex items-center justify-between text-[12.5px] mb-1">
                                            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} /> {c.label}</span>
                                            <span className="font-mono tabular-nums">{formatCurrency(c.total)}</span>
                                        </div>
                                        <div className="h-1 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: c.color }} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </ModularBlock>
            ),
        },
        {
            id: 'tarefas',
            node: (
                <ModularBlock id="tarefas" title="Tarefas do dia" icon="☑" onHide={toggle}>
                    <ul className="space-y-2 text-[12.5px]">
                        {[
                            { done: p.totalMovements > 0, text: 'Registrar primeira movimentação do dia' },
                            { done: p.balance >= 0, text: 'Manter saldo positivo' },
                            { done: p.bankBalance.length > 0, text: 'Vincular movimentações a bancos' },
                            { done: false, text: 'Conferir histórico do dia anterior' },
                        ].map((t, i) => (
                            <li key={i} className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded border grid place-items-center text-[10px] ${t.done ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900' : 'border-slate-300 dark:border-white/15'}`}>
                                    {t.done ? '✓' : ''}
                                </span>
                                <span className={t.done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}>{t.text}</span>
                            </li>
                        ))}
                    </ul>
                </ModularBlock>
            ),
        },
    ];

    const visible = blocks.filter((b) => !hidden.has(b.id));

    return (
        <div className="max-w-3xl mx-auto">
            {/* Doc-style header */}
            <div className="mb-2">
                <p className="text-[12px] text-slate-400">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <h1 className="text-[36px] font-semibold text-slate-900 dark:text-white tracking-tight mt-1">{greeting}, {p.user?.name?.split(' ')[0] ?? 'João'}</h1>
                <p className="text-[14px] text-slate-500 dark:text-slate-400 mt-2">
                    Aqui está o resumo do seu caixa. Clique no <EyeOff className="w-3.5 h-3.5 inline -mt-0.5" /> para ocultar blocos ou use <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/15">Adicionar bloco</kbd> abaixo.
                </p>
            </div>

            <div className="my-5 flex items-center gap-2">
                <DateInput value={p.filterDate} onChange={p.setFilterDate} />
                <PrimaryAction label="Nova movimentação" onClick={() => p.navigate('/formulario-movimentacao')} />
            </div>

            <div className="space-y-2 mt-6">
                {visible.map((b) => <div key={b.id}>{b.node}</div>)}

                {hidden.size > 0 && (
                    <div className="px-3 py-3 rounded-md text-[11.5px] text-slate-400 border border-dashed border-slate-200 dark:border-white/10 hover:border-slate-300 transition-colors">
                        <p className="mb-1.5">Blocos ocultos ({hidden.size}):</p>
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from(hidden).map((id) => {
                                const b = blocks.find((x) => x.id === id);
                                if (!b) return null;
                                return (
                                    <button key={id} onClick={() => toggle(id)} className="px-2 py-0.5 text-[11px] rounded border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white">+ {id}</button>
                                );
                            })}
                        </div>
                    </div>
                )}

                <button className="w-full text-left px-3 py-3 rounded-md text-[12.5px] text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02] hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5" /> Adicionar bloco (em breve · arrastar e soltar)
                </button>
            </div>
        </div>
    );
}

function ModularBlock({ id: _id, title, icon, onHide, children }: { id: string; title: string; icon: string; onHide: (id: string) => void; children: React.ReactNode }) {
    return (
        <div className="group relative px-3 py-3 -mx-3 rounded-md hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
            <div className="flex items-center gap-2 mb-2">
                <button className="opacity-0 group-hover:opacity-100 p-0.5 -ml-5 text-slate-300 cursor-grab" title="Arrastar">
                    <GripVertical className="w-3.5 h-3.5" />
                </button>
                <span className="text-[14px]">{icon}</span>
                <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white">{title}</h3>
                <button
                    onClick={() => onHide(_id)}
                    className="ml-auto opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Ocultar"
                >
                    <EyeOff className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="pl-6">{children}</div>
        </div>
    );
}

// ============================================================
// SHARED MICRO COMPONENTS
// ============================================================

function DateInput({ value, onChange, dark }: { value: string; onChange: (v: string) => void; dark?: boolean }) {
    return (
        <div className="relative">
            <Calendar className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`h-9 pl-8 pr-2.5 text-[12.5px] rounded-md focus:outline-none transition-colors ${
                    dark
                        ? 'bg-slate-900 text-slate-200 border border-white/10 focus:border-white/30'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] focus:border-slate-400 dark:focus:border-white/30'
                }`}
            />
        </div>
    );
}

function PrimaryAction({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-md shadow-sm transition-colors"
        >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
            {label}
        </motion.button>
    );
}

function BigStat({ label, value, delta, color, kind, sub, invertDelta }: { label: string; value: number; delta?: number; color?: string; kind?: 'count'; sub?: string; invertDelta?: boolean }) {
    const showDelta = typeof delta === 'number' && Math.abs(delta) >= 0.1;
    const positive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) >= 0;
    return (
        <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-[28px] font-semibold tabular-nums font-mono text-slate-900 dark:text-white tracking-tight" style={color ? { color } : {}}>
                {kind === 'count' ? <CountUp end={value} duration={0.7} separator="." /> : <CountUp end={value} decimal="," decimals={2} prefix="R$ " separator="." duration={0.7} />}
            </p>
            {showDelta && (
                <p className={`mt-1 text-[11px] tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {(delta as number) >= 0 ? '+' : ''}{(delta as number).toFixed(0)}% vs. semana
                </p>
            )}
            {sub && !showDelta && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
        </div>
    );
}

function TermStat({ label, value, color, delta, kind, invertDelta }: { label: string; value: number; color: string; delta?: number; kind?: 'count'; invertDelta?: boolean }) {
    const showDelta = typeof delta === 'number' && Math.abs(delta) >= 0.1;
    const positive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) >= 0;
    const cls = color === 'emerald' ? 'text-emerald-400' : color === 'rose' ? 'text-rose-400' : color === 'cyan' ? 'text-cyan-400' : color === 'amber' ? 'text-amber-400' : color === 'violet' ? 'text-violet-400' : 'text-white';
    return (
        <div className="bg-slate-900/60 border border-white/[0.06] rounded p-2.5">
            <p className="text-[9.5px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
            <p className={`mt-1 text-[16px] font-semibold tabular-nums ${cls}`}>
                {kind === 'count' ? value.toLocaleString('pt-BR') : formatCurrency(value).replace('R$', '').trim()}
            </p>
            {showDelta && (
                <p className={`text-[10px] tabular-nums ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(delta as number) >= 0 ? '+' : ''}{(delta as number).toFixed(1)}%
                </p>
            )}
        </div>
    );
}

function Empty({ msg, cta, onClick }: { msg: string; cta: string; onClick: () => void }) {
    return (
        <div className="py-8 text-center">
            <Receipt className="w-7 h-7 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-[13px] text-slate-700 dark:text-slate-300">{msg}</p>
            <button onClick={onClick} className="mt-3 text-[12px] text-slate-700 dark:text-slate-200 underline-offset-4 hover:underline">
                {cta}
            </button>
        </div>
    );
}
