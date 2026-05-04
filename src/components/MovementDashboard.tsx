import { useMemo, useState } from 'react';
import {
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Plus,
    LogOut,
    Receipt,
    History,
    Landmark,
    Sparkles,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell,
} from 'recharts';
import { motion } from 'framer-motion';
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

const PAYMENT_LABEL: Record<string, string> = {
    CASH: 'Dinheiro',
    PIX: 'PIX',
    CREDIT_CARD: 'Crédito',
    DEBIT_CARD: 'Débito',
    BANK_TRANSFER: 'Transferência',
    BANK_SLIP: 'Boleto',
    CHECK: 'Cheque',
    OTHER: 'Outros',
};

const CATEGORY_LABEL: Record<string, string> = {
    SALE: 'Venda',
    CHANGE: 'Troco',
    OTHER_IN: 'Outros',
    EXPENSE: 'Despesa',
    WITHDRAWAL: 'Saque',
    PAYMENT: 'Pagamento',
};

const CATEGORY_COLOR: Record<string, string> = {
    SALE: '#10b981',
    CHANGE: '#14b8a6',
    OTHER_IN: '#22c55e',
    EXPENSE: '#ef4444',
    WITHDRAWAL: '#f97316',
    PAYMENT: '#e11d48',
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

export function MovementDashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState<string>(today);
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

    const { data: movesData } = useQuery(GET_CASH_MOVEMENTS, {
        fetchPolicy: 'cache-and-network',
    });
    const allMoves = (movesData?.cashMovements ?? []) as Array<{
        id: string;
        type: 'ENTRY' | 'EXIT';
        category: string;
        value: number;
        description: string;
        date: string;
        typePayment?: string | null;
        bankId?: string | null;
    }>;

    const { data: banksData } = useQuery(GET_BANKS, {
        fetchPolicy: 'cache-and-network',
    });
    const bankMap = useMemo(() => {
        const m = new Map<string, { name: string; corHex: string }>();
        for (const b of (banksData?.banks ?? []) as any[]) m.set(b.id, b);
        return m;
    }, [banksData]);

    // ============= analytics =============
    const dashboardStats = data?.dashboardStats;
    const entries = dashboardStats?.todayEntries || 0;
    const exits = dashboardStats?.todayExits || 0;
    const balance = dashboardStats?.todayBalance || 0;
    const totalMes = dashboardStats?.monthlyTotal || 0;
    const totalMovements = dashboardStats?.totalMovements || allMoves.length;

    // 14 dias de tendência derivada das movimentações (real, não mock)
    const dailyTrend = useMemo(() => {
        const map = new Map<string, { date: string; entradas: number; saidas: number; saldo: number; label: string }>();
        const days: string[] = [];
        const t = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(t);
            d.setDate(t.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            days.push(key);
            map.set(key, {
                date: key,
                entradas: 0,
                saidas: 0,
                saldo: 0,
                label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            });
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

    // comparação 7 dias atuais vs 7 anteriores
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

    // top categorias do filtro do dia
    const categoryBreakdown = useMemo(() => {
        const counter = new Map<string, { count: number; total: number }>();
        for (const m of allMoves) {
            if (!m.date) continue;
            const key = new Date(m.date).toISOString().slice(0, 10);
            if (key !== filterDate) continue;
            const cat = m.category;
            const cur = counter.get(cat) ?? { count: 0, total: 0 };
            cur.count += 1;
            cur.total += Number(m.value);
            counter.set(cat, cur);
        }
        return Array.from(counter.entries())
            .map(([cat, v]) => ({
                category: cat,
                label: CATEGORY_LABEL[cat] ?? cat,
                color: CATEGORY_COLOR[cat] ?? '#94a3b8',
                count: v.count,
                total: v.total,
            }))
            .sort((a, b) => b.total - a.total);
    }, [allMoves, filterDate]);

    const totalCatVolume = categoryBreakdown.reduce((acc, c) => acc + c.total, 0);

    // bar chart "hoje": valor por categoria — mais útil que entries vs exits do dia
    const todayBars = useMemo(() => {
        return categoryBreakdown.slice(0, 6).map((c) => ({
            name: c.label,
            valor: c.total,
            color: c.color,
        }));
    }, [categoryBreakdown]);

    // recent activity (últimas 6, ordenadas por data desc)
    const recentMoves = useMemo(() => {
        return [...allMoves]
            .sort((a, b) => {
                const da = a.date ? new Date(a.date).getTime() : 0;
                const db = b.date ? new Date(b.date).getTime() : 0;
                return db - da;
            })
            .slice(0, 6);
    }, [allMoves]);

    // saldo por banco
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

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-12">
            {/* HEADER */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        Painel · {new Date(filterDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                    <h1 className="mt-2 text-[32px] sm:text-[36px] font-semibold text-slate-900 dark:text-white tracking-[-0.02em] leading-[1.05]">
                        Movimentações
                    </h1>
                    <p className="mt-2 text-[13px] text-slate-500 dark:text-slate-400">
                        Visão consolidada do caixa em tempo real · atualizado a cada 30 s
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="h-9 pl-8 pr-2.5 text-[12.5px] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-md focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors"
                        />
                    </div>
                    <motion.button
                        onClick={() => navigate('/formulario-movimentacao')}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-md shadow-sm transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                        Nova movimentação
                    </motion.button>
                    <button
                        onClick={handleLogout}
                        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 text-[12px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
                        title="Sair"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                    </button>
                </div>
            </header>

            {/* HERO: saldo + KPIs */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-6 mb-10">
                <div className="lg:col-span-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Saldo do dia</p>
                    <p className={`mt-3 text-[56px] sm:text-[64px] font-semibold tracking-[-0.035em] leading-none tabular-nums font-mono ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                        <CountUp end={balance} decimal="," decimals={2} prefix="R$ " separator="." duration={0.8} />
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-[12.5px]">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium tabular-nums ${comparison.delta >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                            {comparison.delta >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                            {Math.abs(comparison.delta).toFixed(1)}%
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">vs. semana anterior</span>
                    </div>

                    {/* progress entries vs exits do dia */}
                    {(entries > 0 || exits > 0) && (
                        <div className="mt-5">
                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                                <span className="text-slate-500 dark:text-slate-400">Composição do dia</span>
                                <span className="text-slate-400 tabular-nums">{formatCurrency(entries + exits)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-rose-100 dark:bg-rose-950/30 overflow-hidden flex">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(entries / (entries + exits)) * 100}%` }}
                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                    className="h-full bg-emerald-500"
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] mt-1.5">
                                <span className="text-emerald-600 dark:text-emerald-400">{((entries / (entries + exits)) * 100).toFixed(0)}% entradas</span>
                                <span className="text-rose-600 dark:text-rose-400">{((exits / (entries + exits)) * 100).toFixed(0)}% saídas</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                    <KpiCell
                        label="Entradas"
                        value={entries}
                        delta={comparison.entriesDelta}
                        spark={dailyTrend.slice(-7).map((d) => ({ v: d.entradas }))}
                        color="#10b981"
                    />
                    <KpiCell
                        label="Saídas"
                        value={exits}
                        delta={comparison.exitsDelta}
                        spark={dailyTrend.slice(-7).map((d) => ({ v: d.saidas }))}
                        color="#ef4444"
                        invertDelta
                    />
                    <KpiCell
                        label="Lançamentos"
                        value={totalMovements}
                        kind="count"
                        sub={categoryBreakdown.length > 0 ? `${categoryBreakdown.length} categoria(s)` : 'Sem dados hoje'}
                    />
                    <KpiCell
                        label="Total no mês"
                        value={totalMes}
                        sub="Receita acumulada"
                        muted
                    />
                    <KpiCell
                        label="Maior do dia"
                        value={Math.max(0, ...allMoves.filter((m) => m.date && new Date(m.date).toISOString().slice(0, 10) === filterDate).map((m) => Number(m.value)))}
                        sub="Movimentação"
                        muted
                    />
                    <KpiCell
                        label="Bancos ativos"
                        value={bankBalance.length}
                        kind="count"
                        sub={bankBalance.length > 0 ? 'com movimentações' : 'cadastre em /bancos'}
                    />
                </div>
            </section>

            {/* GRÁFICOS PRINCIPAIS */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-px mb-10 bg-slate-200 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                {/* Tendência 14 dias */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5">
                    <div className="flex items-baseline justify-between mb-1">
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Fluxo</h2>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">últimos 14 dias</span>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">Comparativo diário entre entradas e saídas</p>
                    <div className="h-60 -ml-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="dgrad-en" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="dgrad-ex" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-400" axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-400" axisLine={false} tickLine={false} width={42} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                                <Tooltip
                                    formatter={(value: number, name: string) => [formatCurrency(value), name === 'entradas' ? 'Entradas' : 'Saídas']}
                                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '8px 10px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 2 }}
                                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={1.75} fill="url(#dgrad-en)" isAnimationActive animationDuration={500} />
                                <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={1.75} fill="url(#dgrad-ex)" isAnimationActive animationDuration={500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Hoje por categoria */}
                <div className="bg-white dark:bg-slate-900 p-5">
                    <div className="flex items-baseline justify-between mb-1">
                        <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Categorias do dia</h2>
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">Distribuição em {new Date(filterDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                    {categoryBreakdown.length === 0 ? (
                        <div className="py-12 text-center text-[12.5px] text-slate-400">Sem movimentações</div>
                    ) : (
                        <ul className="space-y-2.5">
                            {categoryBreakdown.map((c) => {
                                const pct = totalCatVolume > 0 ? (c.total / totalCatVolume) * 100 : 0;
                                return (
                                    <li key={c.category}>
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200">
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                                {c.label}
                                                <span className="text-[10.5px] text-slate-400">{c.count}</span>
                                            </span>
                                            <span className="font-mono text-[12.5px] tabular-nums text-slate-900 dark:text-white">{formatCurrency(c.total)}</span>
                                        </div>
                                        <div className="h-[3px] rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: c.color }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </section>

            {/* SECUNDÁRIA: bar chart por categoria + bancos */}
            {(todayBars.length > 0 || bankBalance.length > 0) && (
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-px mb-10 bg-slate-200 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                    {/* Bar chart */}
                    {todayBars.length > 0 && (
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5">
                            <div className="flex items-baseline justify-between mb-1">
                                <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Volume por categoria</h2>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">{new Date(filterDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">Top {todayBars.length} categorias do dia</p>
                            <div className="h-56 -ml-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={todayBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="2 4" stroke="currentColor" className="text-slate-200 dark:text-white/[0.05]" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-400" axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} className="text-slate-400" axisLine={false} tickLine={false} width={42} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                                        <Tooltip
                                            formatter={(v: number) => formatCurrency(v)}
                                            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '8px 10px' }}
                                            labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                                            cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                                        />
                                        <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                                            {todayBars.map((b, i) => (
                                                <Cell key={i} fill={b.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Bancos */}
                    <div className="bg-white dark:bg-slate-900 p-5">
                        <div className="flex items-baseline justify-between mb-1">
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Por banco</h2>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{bankBalance.length}</span>
                        </div>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">Saldo líquido por conta</p>
                        {bankBalance.length === 0 ? (
                            <div className="py-12 text-center">
                                <Landmark className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                                <p className="text-[12.5px] text-slate-500 dark:text-slate-400">Nenhuma movimentação vinculada a banco ainda</p>
                                <button
                                    onClick={() => navigate('/bancos')}
                                    className="mt-3 text-[12px] text-slate-700 dark:text-slate-200 underline-offset-4 hover:underline"
                                >
                                    Ir para bancos
                                </button>
                            </div>
                        ) : (
                            <ul className="space-y-2.5">
                                {bankBalance.slice(0, 6).map((b) => (
                                    <li key={b.name} className="flex items-center justify-between py-1">
                                        <span className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-200 min-w-0">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                                            <span className="truncate">{b.name}</span>
                                        </span>
                                        <span className={`font-mono text-[12.5px] tabular-nums ${b.total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {b.total >= 0 ? '+' : '−'}{formatCurrency(Math.abs(b.total)).replace('R$', '').trim()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {/* ATIVIDADE RECENTE + AÇÕES */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent activity */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                        <div>
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Atividade recente</h2>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">Últimas movimentações registradas</p>
                        </div>
                        <button
                            onClick={() => navigate('/historico')}
                            className="text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
                        >
                            Ver tudo <ArrowUpRight className="w-3 h-3" />
                        </button>
                    </div>
                    {recentMoves.length === 0 ? (
                        <div className="py-16 text-center">
                            <Receipt className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                            <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">Sem movimentações</p>
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">Comece registrando uma entrada ou saída</p>
                            <button
                                onClick={() => navigate('/formulario-movimentacao')}
                                className="mt-4 inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[12px] font-medium"
                            >
                                <Plus className="w-3.5 h-3.5" /> Nova
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {recentMoves.map((m, idx) => {
                                const sub = m.category;
                                const bank = m.bankId ? bankMap.get(m.bankId) : null;
                                return (
                                    <motion.li
                                        key={m.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.25, delay: idx * 0.02 }}
                                        className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={`w-8 h-8 rounded-md grid place-items-center shrink-0 ${m.type === 'ENTRY' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                {m.type === 'ENTRY' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">{m.description}</p>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                    <span>{CATEGORY_LABEL[sub] ?? sub}</span>
                                                    {m.typePayment && (
                                                        <>
                                                            <span className="text-slate-300 dark:text-slate-600">·</span>
                                                            <span>{PAYMENT_LABEL[m.typePayment] ?? m.typePayment}</span>
                                                        </>
                                                    )}
                                                    {bank && (
                                                        <>
                                                            <span className="text-slate-300 dark:text-slate-600">·</span>
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bank.corHex }} />
                                                                {bank.name}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="text-slate-300 dark:text-slate-600">·</span>
                                                    <span>{m.date ? timeAgo(new Date(m.date)) : '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[13.5px] font-mono font-medium tabular-nums shrink-0 ml-3 ${m.type === 'ENTRY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {m.type === 'ENTRY' ? '+' : '−'}{formatCurrency(Number(m.value)).replace('R$', '').trim()}
                                        </span>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* Quick actions + insight */}
                <div className="space-y-3">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white tracking-tight">Atalhos</h2>
                        </div>
                        <div className="p-2">
                            {[
                                { label: 'Nova entrada', sub: 'Venda, troco ou outros', icon: ArrowDownRight, accent: 'emerald', to: '/formulario-movimentacao' },
                                { label: 'Nova saída', sub: 'Despesa, saque ou pagamento', icon: ArrowUpRight, accent: 'rose', to: '/formulario-movimentacao' },
                                { label: 'Histórico completo', sub: 'Filtrar e exportar', icon: History, accent: 'slate', to: '/historico' },
                                { label: 'Bancos', sub: 'Cadastros e saldos', icon: Landmark, accent: 'slate', to: '/bancos' },
                            ].map((a) => {
                                const Icon = a.icon;
                                return (
                                    <button
                                        key={a.label}
                                        onClick={() => navigate(a.to)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group text-left"
                                    >
                                        <span className={`w-8 h-8 rounded-md grid place-items-center shrink-0 ${a.accent === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : a.accent === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'}`}>
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12.5px] font-medium text-slate-900 dark:text-white">{a.label}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{a.sub}</p>
                                        </div>
                                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Insight */}
                    {(entries > 0 || exits > 0) && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-900 dark:border-white rounded-xl p-5"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-60">Insight</span>
                            </div>
                            <p className="text-[13.5px] leading-snug">
                                {balance >= 0 ? (
                                    <>
                                        Saldo positivo de <span className="font-semibold tabular-nums">{formatCurrency(balance)}</span> hoje
                                        {comparison.delta > 0 && <>, {comparison.delta.toFixed(0)}% acima da semana anterior</>}.
                                    </>
                                ) : (
                                    <>
                                        Saldo negativo de <span className="font-semibold tabular-nums">{formatCurrency(Math.abs(balance))}</span> — saídas superam entradas em {((exits - entries) / Math.max(entries, 1) * 100).toFixed(0)}%.
                                    </>
                                )}
                            </p>
                            {categoryBreakdown.length > 0 && (
                                <p className="text-[12px] mt-2 opacity-60">
                                    Categoria líder: <span className="font-medium opacity-100">{categoryBreakdown[0].label}</span> com {formatCurrency(categoryBreakdown[0].total)}.
                                </p>
                            )}
                        </motion.div>
                    )}
                </div>
            </section>
        </div>
    );
}

// ============= componentes auxiliares =============

function KpiCell({
    label,
    value,
    delta,
    sub,
    spark,
    color,
    invertDelta,
    muted,
    kind,
}: {
    label: string;
    value: number;
    delta?: number;
    sub?: string;
    spark?: { v: number }[];
    color?: string;
    invertDelta?: boolean;
    muted?: boolean;
    kind?: 'count';
}) {
    const showDelta = typeof delta === 'number' && Math.abs(delta) >= 0.1;
    const positive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) >= 0;
    return (
        <div>
            <div className="flex items-center justify-between">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{label}</p>
                {showDelta && (
                    <span className={`text-[10.5px] tabular-nums font-medium ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {(delta as number) >= 0 ? '+' : ''}{(delta as number).toFixed(0)}%
                    </span>
                )}
            </div>
            <p
                className={`mt-2 text-[22px] font-semibold tracking-tight tabular-nums font-mono leading-none ${muted ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}
                style={color && !muted ? { color } : {}}
            >
                {kind === 'count' ? (
                    <CountUp end={value} duration={0.7} separator="." />
                ) : (
                    <CountUp end={value} decimal="," decimals={2} prefix="R$ " separator="." duration={0.7} />
                )}
            </p>
            {spark && spark.length > 0 && (
                <div className="h-7 mt-2 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`dspk-${label}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color || '#64748b'} stopOpacity={0.35} />
                                    <stop offset="100%" stopColor={color || '#64748b'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={color || '#64748b'} strokeWidth={1.25} fill={`url(#dspk-${label})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
            {sub && <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
    );
}
