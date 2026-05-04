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
    Activity,
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

export function MovementDashboard() {
    const navigate = useNavigate();
    const today = new Date().toISOString().split('T')[0];
    const [filterDate, setFilterDate] = useState<string>(today);
    const { notifyError } = useNotification();
    const { user, isLoading: isAuthLoading } = useAuth();
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

    const streak = useMemo(() => {
        let count = 0;
        for (let i = dailyTrend.length - 1; i >= 0; i--) {
            const d = dailyTrend[i];
            if (d.entradas - d.saidas > 0) count++;
            else break;
        }
        return count;
    }, [dailyTrend]);

    const heatmap = useMemo(() => {
        const days: Array<{ date: string; total: number; level: number }> = [];
        const t = new Date();
        const max = Math.max(1, ...allMoves.map((m) => Number(m.value)));
        for (let i = 83; i >= 0; i--) {
            const d = new Date(t);
            d.setDate(t.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const dayMoves = allMoves.filter((m) => m.date && new Date(m.date).toISOString().slice(0, 10) === key);
            const total = dayMoves.reduce((acc, m) => acc + (m.type === 'ENTRY' ? Number(m.value) : 0), 0);
            const level = total === 0 ? 0 : Math.min(4, Math.ceil((total / max) * 4));
            days.push({ date: key, total, level });
        }
        return days;
    }, [allMoves]);

    // metas
    const dailyGoal = 1000;
    const weekGoal = 7000;
    const monthGoal = 30000;
    const dayPct = Math.min(100, (entries / dailyGoal) * 100);
    const weekRevenue = dailyTrend.slice(-7).reduce((a, b) => a + b.entradas, 0);
    const weekPct = Math.min(100, (weekRevenue / weekGoal) * 100);
    const monthPct = Math.min(100, (totalMes / monthGoal) * 100);

    // alertas
    const alerts: { kind: 'critical' | 'warning' | 'info'; msg: string }[] = [];
    if (balance < 0) alerts.push({ kind: 'critical', msg: `Saldo negativo: ${formatCurrency(balance)}` });
    if (dayPct < 50 && entries > 0) alerts.push({ kind: 'warning', msg: `Meta diária: ${dayPct.toFixed(0)}% atingida` });
    bankBalance.filter((b) => b.total < 0).forEach((b) => alerts.push({ kind: 'warning', msg: `${b.name}: ${formatCurrency(b.total)}` }));

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

    return (
        <div className="w-full max-w-[1400px] mx-auto pb-12">
            {/* HEADER */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 mb-6 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        Painel · {new Date(filterDate).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                    <h1 className="mt-2 text-[26px] sm:text-[30px] font-semibold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                        Movimentações
                    </h1>
                    <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
                        Visão consolidada do caixa · atualiza a cada 30s
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <DateInput value={filterDate} onChange={setFilterDate} />
                    <PrimaryAction label="Nova movimentação" onClick={() => navigate('/formulario-movimentacao')} />
                </div>
            </header>

            {/* HERO: saldo + 3 stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-10 gap-y-6 mb-8 pb-8 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="lg:col-span-5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Saldo do dia</p>
                    <p className={`mt-2.5 text-[52px] sm:text-[64px] font-semibold tracking-[-0.04em] leading-none tabular-nums font-mono ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                        <CountUp end={balance} decimal="," decimals={2} prefix="R$ " separator="." duration={0.8} />
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[12px]">
                        <DeltaPill delta={comparison.delta} />
                        <span className="text-slate-500 dark:text-slate-400">vs. semana anterior</span>
                    </div>
                </div>
                <div className="lg:col-span-7 grid grid-cols-3 gap-6">
                    <BigStat label="Entradas" value={entries} delta={comparison.entriesDelta} />
                    <BigStat label="Saídas" value={exits} delta={comparison.exitsDelta} invertDelta />
                    <BigStat label="Lançamentos" value={totalMovements} kind="count" sub={`Ticket ${formatCurrency((entries + exits) / Math.max(totalMovements, 1))}`} />
                </div>
            </div>

            {/* ALERTS (se existirem) */}
            {alerts.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2.5">
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                        <h2 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">Alertas</h2>
                        <span className="text-[11px] text-slate-400">{alerts.length}</span>
                    </div>
                    <ul className="space-y-1.5">
                        {alerts.map((a, i) => (
                            <li
                                key={i}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${a.kind === 'critical'
                                    ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/30'
                                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/30'
                                    }`}
                            >
                                <AlertTriangle
                                    className={`w-3.5 h-3.5 shrink-0 ${a.kind === 'critical' ? 'text-rose-500' : 'text-amber-500'
                                        }`}
                                />
                                <p className="text-[12.5px] text-slate-800 dark:text-slate-200">{a.msg}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* METAS (3 colunas) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <GoalCard label="Meta diária" cur={entries} goal={dailyGoal} pct={dayPct} period="hoje" />
                <GoalCard label="Meta semanal" cur={weekRevenue} goal={weekGoal} pct={weekPct} period="7 dias" />
                <GoalCard label="Meta mensal" cur={totalMes} goal={monthGoal} pct={monthPct} period="mês" />
            </div>

            {/* FLUXO 14 DIAS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl mb-6 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-baseline justify-between">
                    <div>
                        <h2 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">Fluxo</h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Últimos 14 dias</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Entradas</span>
                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Saídas</span>
                    </div>
                </div>
                <div className="h-64 p-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="d-en" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.28} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="d-ex" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.22} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
                            <Tooltip
                                formatter={(v: number, n: string) => [formatCurrency(v), n === 'entradas' ? 'Entradas' : 'Saídas']}
                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                                labelStyle={{ color: '#cbd5e1' }}
                                cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                            <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={1.75} fill="url(#d-en)" />
                            <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={1.75} fill="url(#d-ex)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* BANCOS + CATEGORIAS (2 colunas) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                {/* Bancos */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-baseline justify-between">
                        <div>
                            <h2 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">Saldo por banco</h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Líquido (entradas − saídas)</p>
                        </div>
                        <span className="text-[11px] text-slate-400">{bankBalance.length}</span>
                    </div>
                    {bankBalance.length === 0 ? (
                        <Empty msg="Nenhum banco com movimentações" cta="Cadastrar bancos" onClick={() => navigate('/bancos')} />
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {bankBalance.slice(0, 6).map((b) => (
                                <li key={b.name} className="px-5 py-2.5 flex items-center justify-between">
                                    <span className="flex items-center gap-2.5 text-[13px] text-slate-900 dark:text-white min-w-0">
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                                        <span className="truncate">{b.name}</span>
                                    </span>
                                    <span className={`text-[13px] font-mono font-medium tabular-nums shrink-0 ${b.total >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {formatCurrency(b.total)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Categorias */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-baseline justify-between">
                        <div>
                            <h2 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">Top categorias</h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Distribuição do dia</p>
                        </div>
                        <span className="text-[11px] text-slate-400">{categoryBreakdown.length}</span>
                    </div>
                    {categoryBreakdown.length === 0 ? (
                        <Empty msg="Sem categorias hoje" cta="Registrar movimentação" onClick={() => navigate('/formulario-movimentacao')} />
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                            {categoryBreakdown.slice(0, 6).map((c) => {
                                const pct = totalCatVolume > 0 ? (c.total / totalCatVolume) * 100 : 0;
                                return (
                                    <li key={c.category} className="px-5 py-2.5">
                                        <div className="flex items-center justify-between mb-1.5 text-[13px]">
                                            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                                                {c.label}
                                                <span className="text-[10.5px] text-slate-400">×{c.count}</span>
                                            </span>
                                            <span className="font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                                                {formatCurrency(c.total)}
                                            </span>
                                        </div>
                                        <div className="h-1 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: c.color }}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>

            {/* HEATMAP + STREAK */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-baseline justify-between">
                        <div>
                            <h2 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">Calendário de atividade</h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">12 semanas · entradas por dia</p>
                        </div>
                    </div>
                    <div className="p-5">
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
                        <div className="flex items-center gap-1.5 mt-3 text-[10.5px] text-slate-400">
                            <span>menos</span>
                            <span className="w-3 h-3 rounded-[3px] bg-slate-100 dark:bg-white/[0.04]" />
                            <span className="w-3 h-3 rounded-[3px] bg-emerald-200 dark:bg-emerald-900/40" />
                            <span className="w-3 h-3 rounded-[3px] bg-emerald-300 dark:bg-emerald-700/60" />
                            <span className="w-3 h-3 rounded-[3px] bg-emerald-500" />
                            <span className="w-3 h-3 rounded-[3px] bg-emerald-600 dark:bg-emerald-400" />
                            <span>mais</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06]">
                        <h2 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">Resumo</h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Indicadores rápidos</p>
                    </div>
                    <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        <li className="px-5 py-3 flex items-center justify-between">
                            <span className="flex items-center gap-2 text-[12.5px] text-slate-600 dark:text-slate-300">
                                <Flame className="w-3.5 h-3.5 text-slate-400" /> Streak
                            </span>
                            <span className="text-[13px] font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                                {streak}<span className="text-[11px] text-slate-400 ml-0.5">d</span>
                            </span>
                        </li>
                        <li className="px-5 py-3 flex items-center justify-between">
                            <span className="text-[12.5px] text-slate-600 dark:text-slate-300">Total no mês</span>
                            <span className="text-[13px] font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                                {formatCurrency(totalMes)}
                            </span>
                        </li>
                        <li className="px-5 py-3 flex items-center justify-between">
                            <span className="text-[12.5px] text-slate-600 dark:text-slate-300">Ticket médio</span>
                            <span className="text-[13px] font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                                {formatCurrency((entries + exits) / Math.max(totalMovements, 1))}
                            </span>
                        </li>
                        <li className="px-5 py-3 flex items-center justify-between">
                            <span className="text-[12.5px] text-slate-600 dark:text-slate-300">Lançamentos hoje</span>
                            <span className="text-[13px] font-mono font-medium tabular-nums text-slate-900 dark:text-white">
                                {totalMovements}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* ATIVIDADE RECENTE */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                            <h2 className="text-[12.5px] font-semibold text-slate-900 dark:text-white">Atividade recente</h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Últimos lançamentos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/historico')}
                        className="text-[11.5px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1"
                    >
                        Ver tudo <ArrowUpRight className="w-3 h-3" />
                    </button>
                </div>
                {recentMoves.length === 0 ? (
                    <Empty msg="Sem movimentações ainda" cta="Registrar primeira" onClick={() => navigate('/formulario-movimentacao')} />
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                        {recentMoves.map((m) => (
                            <li key={m.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.type === 'ENTRY' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                    />
                                    <div className="min-w-0">
                                        <p className="text-[13px] text-slate-900 dark:text-white truncate">{m.description}</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            {CATEGORY_LABEL[m.category] ?? m.category} · {m.date ? timeAgo(new Date(m.date)) : '—'}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`text-[13px] font-mono font-medium tabular-nums shrink-0 ${m.type === 'ENTRY' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                                >
                                    {m.type === 'ENTRY' ? '+' : '−'} {formatCurrency(Number(m.value))}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

// ============================================================
// SHARED MICRO COMPONENTS
// ============================================================

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-9 pl-8 pr-2.5 text-[12.5px] rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] focus:outline-none focus:border-slate-400 dark:focus:border-white/30 transition-colors"
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

function DeltaPill({ delta, invert }: { delta: number; invert?: boolean }) {
    const positive = invert ? delta < 0 : delta >= 0;
    if (Math.abs(delta) < 0.1) {
        return (
            <span className="inline-flex items-center gap-0.5 text-[11.5px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
                — 0%
            </span>
        );
    }
    return (
        <span
            className={`inline-flex items-center gap-0.5 text-[11.5px] font-medium tabular-nums ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}
        >
            {delta >= 0 ? <ArrowUp className="w-3 h-3" strokeWidth={2.5} /> : <ArrowDown className="w-3 h-3" strokeWidth={2.5} />}
            {Math.abs(delta).toFixed(1)}%
        </span>
    );
}

function BigStat({
    label,
    value,
    delta,
    kind,
    sub,
    invertDelta,
}: {
    label: string;
    value: number;
    delta?: number;
    kind?: 'count';
    sub?: string;
    invertDelta?: boolean;
}) {
    const showDelta = typeof delta === 'number' && Math.abs(delta) >= 0.1;
    return (
        <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-[24px] font-semibold tabular-nums font-mono text-slate-900 dark:text-white tracking-tight">
                {kind === 'count' ? (
                    <CountUp end={value} duration={0.7} separator="." />
                ) : (
                    <CountUp end={value} decimal="," decimals={2} prefix="R$ " separator="." duration={0.7} />
                )}
            </p>
            {showDelta && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <DeltaPill delta={delta!} invert={invertDelta} />
                    <span className="text-slate-400 dark:text-slate-500">vs. semana</span>
                </div>
            )}
            {sub && !showDelta && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>}
        </div>
    );
}

function GoalCard({
    label,
    cur,
    goal,
    pct,
    period,
}: {
    label: string;
    cur: number;
    goal: number;
    pct: number;
    period: string;
}) {
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4">
            <div className="flex items-baseline justify-between mb-2">
                <p className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">{label}</p>
                <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {pct.toFixed(0)}%
                </span>
            </div>
            <p className="text-[18px] font-mono font-semibold tabular-nums text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(cur)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">de {formatCurrency(goal)} · {period}</p>
            <div className="mt-3 h-1 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${pct >= 100
                        ? 'bg-emerald-500'
                        : pct >= 70
                            ? 'bg-slate-700 dark:bg-slate-300'
                            : 'bg-slate-400 dark:bg-slate-500'
                        }`}
                />
            </div>
        </div>
    );
}

function Empty({ msg, cta, onClick }: { msg: string; cta: string; onClick: () => void }) {
    return (
        <div className="py-10 text-center">
            <Receipt className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-[12.5px] text-slate-700 dark:text-slate-300">{msg}</p>
            <button
                onClick={onClick}
                className="mt-2.5 text-[11.5px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline-offset-4 hover:underline"
            >
                {cta}
            </button>
        </div>
    );
}
