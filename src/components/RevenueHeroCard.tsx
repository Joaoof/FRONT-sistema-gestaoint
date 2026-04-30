import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import {
    ArrowUpRight,
    Calendar,
    DollarSign,
    LineChart,
    Package,
    PiggyBank,
    Plus,
    ShoppingCart,
    Sparkles,
    TrendingUp,
    Warehouse,
} from 'lucide-react';
import { GET_ORDERS, GET_ORDERS_SUMMARY } from '../graphql/queries/orders';
import { LIST_PRODUCTS_WITH_IMAGES } from '../graphql/mutations/product-with-images';

interface OrderRow {
    id: string;
    number: number;
    status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED' | 'REFUNDED';
    total: number;
    createdAt: string;
    customerName?: string | null;
    customer?: { name: string } | null;
    items?: OrderItemRow[] | null;
}

interface ProductRow {
    id: string;
    nameProduct: string;
    quantity?: number | null;
    costPrice?: number | null;
    salePrice?: number | null;
    createdAt: string;
}

interface OrderItemRow {
    productId?: string | null;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface OrdersSummary {
    todayCount: number;
    todayTotal: number;
    monthCount: number;
    monthTotal: number;
}

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n);

const formatBRLShort = (n: number) => {
    if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1).replace('.', ',')}k`;
    return formatBRL(n);
};

/** Animação do contador de moeda. */
function useAnimatedNumber(target: number, duration = 1200) {
    const [value, setValue] = useState(0);
    const startRef = useRef<number | null>(null);
    const fromRef = useRef(0);

    useEffect(() => {
        fromRef.current = value;
        startRef.current = null;
        let raf = 0;
        const step = (ts: number) => {
            if (startRef.current === null) startRef.current = ts;
            const elapsed = ts - startRef.current;
            const t = Math.min(1, elapsed / duration);
            // ease out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            const next = fromRef.current + (target - fromRef.current) * eased;
            setValue(next);
            if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration]);

    return value;
}

export function RevenueHeroCard() {
    const navigate = useNavigate();

    const { data: summaryData } = useQuery<{ ordersSummary: OrdersSummary }>(
        GET_ORDERS_SUMMARY,
        { fetchPolicy: 'cache-and-network', pollInterval: 30_000 },
    );
    const { data: ordersData } = useQuery<{ orders: OrderRow[] }>(GET_ORDERS, {
        fetchPolicy: 'cache-and-network',
        pollInterval: 30_000,
    });
    const { data: productsData } = useQuery<{ products: ProductRow[] }>(LIST_PRODUCTS_WITH_IMAGES, {
        variables: { take: 200, skip: 0 },
        fetchPolicy: 'cache-and-network',
    });

    const summary = summaryData?.ordersSummary ?? { todayCount: 0, todayTotal: 0, monthCount: 0, monthTotal: 0 };
    const orders = ordersData?.orders ?? [];
    const products = productsData?.products ?? [];

    // Mapa de produtos para joins client-side (custo, etc.)
    const productById = useMemo(() => {
        const m = new Map<string, ProductRow>();
        for (const p of products) m.set(p.id, p);
        return m;
    }, [products]);

    // Métricas calculadas
    const stats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        let prevMonthRevenue = 0;
        let todayProfit = 0;

        for (const o of orders) {
            if (o.status === 'CANCELED' || o.status === 'REFUNDED') continue;
            const ts = new Date(o.createdAt).getTime();
            if (ts >= startOfMonth) {
                // dentro do mês corrente
            } else if (ts >= startOfPrevMonth) {
                prevMonthRevenue += o.total;
            }
            if (ts >= startOfDay) {
                // Lucro = receita líquida - custo dos itens (a partir do costPrice do produto)
                const items = o.items ?? [];
                let cost = 0;
                for (const it of items) {
                    const prod = it.productId ? productById.get(it.productId) : undefined;
                    const unitCost = Number(prod?.costPrice ?? 0);
                    cost += unitCost * Number(it.quantity ?? 0);
                }
                todayProfit += Number(o.total) - cost;
            }
        }

        // Estoque
        let stockCost = 0;
        let inStockCount = 0;
        for (const p of products) {
            const qty = Number(p.quantity ?? 0);
            const cp = Number(p.costPrice ?? 0);
            stockCost += qty * cp;
            if (qty > 0) inStockCount++;
        }

        const monthRevenue = summary.monthTotal;
        const monthDelta = prevMonthRevenue > 0
            ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
            : monthRevenue > 0
                ? 100
                : 0;

        return {
            monthRevenue,
            prevMonthRevenue,
            monthDelta,
            todayProfit,
            stockCost,
            inStockCount,
            totalProducts: products.length,
        };
    }, [orders, products, productById, summary]);

    // Sparkline: últimos 30 dias
    const sparkData = useMemo(() => {
        const days: { ts: number; label: string; total: number }[] = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        for (let i = 29; i >= 0; i--) {
            const d = new Date(start);
            d.setDate(d.getDate() - i);
            days.push({
                ts: d.getTime(),
                label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                total: 0,
            });
        }
        const map = new Map(days.map((d) => [d.ts, d]));
        for (const o of orders) {
            if (o.status === 'CANCELED' || o.status === 'REFUNDED') continue;
            const d = new Date(o.createdAt);
            d.setHours(0, 0, 0, 0);
            const day = map.get(d.getTime());
            if (day) day.total += o.total;
        }
        return days;
    }, [orders]);

    // Últimas 3 vendas (para o feed lateral)
    const latestOrders = useMemo(() => {
        return [...orders]
            .filter((o) => o.status !== 'CANCELED' && o.status !== 'REFUNDED')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
    }, [orders]);

    // Últimos produtos cadastrados (para feed lateral)
    const latestProducts = useMemo(() => {
        return [...products]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
    }, [products]);

    const animatedRevenue = useAnimatedNumber(stats.monthRevenue);
    const animatedToday = useAnimatedNumber(summary.todayTotal);

    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-indigo-700 via-blue-600 to-sky-500 text-white shadow-xl"
        >
            {/* Glow animado de fundo */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/15 blur-3xl animate-pulse" />
                <div
                    className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-cyan-400/30 blur-3xl animate-pulse"
                    style={{ animationDelay: '1s' }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-3xl animate-pulse"
                    style={{ animationDelay: '2s' }}
                />
            </div>

            {/* Pattern grid sutil */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 lg:p-8">
                {/* COLUNA 1 e 2 — KPI principal */}
                <div className="lg:col-span-2 space-y-5">
                    <header className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-semibold uppercase tracking-wider">
                                <span className="relative w-1.5 h-1.5">
                                    <span className="absolute inset-0 rounded-full bg-emerald-300" />
                                    <span className="absolute inset-0 rounded-full bg-emerald-300 animate-ping" />
                                </span>
                                Ao vivo
                            </span>
                            <span className="text-[12px] text-white/80 hidden sm:inline">
                                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <button
                            onClick={() => navigate('/vendas')}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white/15 hover:bg-white/25 backdrop-blur-sm text-[12px] font-semibold transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Nova venda
                        </button>
                    </header>

                    <div>
                        <p className="text-[12.5px] font-medium uppercase tracking-[0.08em] text-white/70 flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" />
                            Faturamento do mês
                        </p>
                        <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                            <motion.h2
                                key={Math.round(stats.monthRevenue)}
                                initial={{ scale: 0.95, opacity: 0.6 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="text-[40px] sm:text-[52px] font-bold leading-none tabular-nums tracking-tight"
                            >
                                {formatBRL(animatedRevenue)}
                            </motion.h2>
                            {stats.monthRevenue !== 0 && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12.5px] font-bold ${
                                        stats.monthDelta >= 0
                                            ? 'bg-emerald-400/30 text-emerald-100'
                                            : 'bg-rose-400/30 text-rose-100'
                                    }`}
                                >
                                    <TrendingUp className={`w-3.5 h-3.5 ${stats.monthDelta < 0 ? 'rotate-180' : ''}`} />
                                    {stats.monthDelta >= 0 ? '+' : ''}{stats.monthDelta.toFixed(1)}%
                                </motion.span>
                            )}
                        </div>
                        <p className="text-[13px] text-white/70 mt-1.5">
                            {summary.monthCount} venda{summary.monthCount === 1 ? '' : 's'} no mês ·{' '}
                            mês passado: <span className="font-semibold text-white">{formatBRLShort(stats.prevMonthRevenue)}</span>
                        </p>
                    </div>

                    {/* Sparkline */}
                    <div className="h-24 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={sparkData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.6} />
                                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1 }}
                                    contentStyle={{
                                        background: 'rgba(15,23,42,0.92)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        color: '#fff',
                                    }}
                                    labelStyle={{ color: '#cbd5e1' }}
                                    formatter={(v: number) => [formatBRL(v), 'Vendas']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#FFFFFF"
                                    strokeWidth={2}
                                    fill="url(#heroGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-[10.5px] text-white/60 mt-1 px-2">Últimos 30 dias</p>
                    </div>

                    {/* Mini stats em linha */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <MiniStat
                            label="Vendas hoje"
                            value={formatBRLShort(animatedToday)}
                            sub={`${summary.todayCount} venda${summary.todayCount === 1 ? '' : 's'}`}
                            icon={<Calendar className="w-3.5 h-3.5" />}
                        />
                        <MiniStat
                            label="Lucro do dia"
                            value={formatBRLShort(stats.todayProfit)}
                            sub="receita − custo"
                            icon={<LineChart className="w-3.5 h-3.5" />}
                        />
                        <MiniStat
                            label="Custo de estoque"
                            value={formatBRLShort(stats.stockCost)}
                            sub="capital parado"
                            icon={<PiggyBank className="w-3.5 h-3.5" />}
                        />
                        <MiniStat
                            label="Em estoque"
                            value={String(stats.inStockCount)}
                            sub={`de ${stats.totalProducts} no catálogo`}
                            icon={<Warehouse className="w-3.5 h-3.5" />}
                        />
                    </div>
                </div>

                {/* COLUNA 3 — Feeds */}
                <div className="space-y-4">
                    {/* Últimas vendas */}
                    <FeedCard
                        title="Últimas vendas"
                        icon={<ShoppingCart className="w-3.5 h-3.5" />}
                        emptyText="Nenhuma venda registrada"
                        empty={latestOrders.length === 0}
                        onClickAll={() => navigate('/vendas')}
                    >
                        {latestOrders.map((o, idx) => (
                            <motion.li
                                key={o.id}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className="flex items-center gap-2 py-1.5"
                            >
                                <span className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-[10px] font-bold tabular-nums shrink-0">
                                    #{o.number}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-medium truncate">
                                        {o.customer?.name ?? o.customerName ?? 'Cliente avulso'}
                                    </p>
                                    <p className="text-[10.5px] text-white/60">
                                        {new Date(o.createdAt).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <span className="text-[12px] font-bold tabular-nums shrink-0">
                                    {formatBRLShort(o.total)}
                                </span>
                            </motion.li>
                        ))}
                    </FeedCard>

                    {/* Últimos produtos cadastrados */}
                    <FeedCard
                        title="Cadastros recentes"
                        icon={<Sparkles className="w-3.5 h-3.5" />}
                        emptyText="Nenhum produto cadastrado"
                        empty={latestProducts.length === 0}
                        onClickAll={() => navigate('/produtos')}
                    >
                        {latestProducts.map((p, idx) => (
                            <motion.li
                                key={p.id}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + 0.1 * idx }}
                                className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-white/5 rounded px-1 -mx-1"
                                onClick={() => navigate(`/produtos/${p.id}`)}
                            >
                                <span className="w-7 h-7 rounded-md bg-white/15 flex items-center justify-center shrink-0">
                                    <Package className="w-3.5 h-3.5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-medium truncate">{p.nameProduct}</p>
                                    <p className="text-[10.5px] text-white/60">
                                        cadastrado{' '}
                                        {new Date(p.createdAt).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-white/50 shrink-0" />
                            </motion.li>
                        ))}
                    </FeedCard>
                </div>
            </div>
        </motion.section>
    );
}

function MiniStat({
    label,
    value,
    sub,
    icon,
}: {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/10">
            <div className="flex items-center gap-1.5 text-white/80 text-[10.5px] font-medium uppercase tracking-wider">
                {icon}
                {label}
            </div>
            <p className="mt-1 text-[18px] font-bold leading-none tabular-nums">{value}</p>
            <p className="text-[10.5px] text-white/60 mt-1">{sub}</p>
        </div>
    );
}

function FeedCard({
    title,
    icon,
    children,
    empty,
    emptyText,
    onClickAll,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    empty: boolean;
    emptyText: string;
    onClickAll?: () => void;
}) {
    return (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/10 p-3">
            <header className="flex items-center justify-between mb-1">
                <h3 className="text-[11.5px] font-semibold uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                    {icon}
                    {title}
                </h3>
                {onClickAll && (
                    <button
                        type="button"
                        onClick={onClickAll}
                        className="text-[10.5px] text-white/70 hover:text-white"
                    >
                        ver →
                    </button>
                )}
            </header>
            {empty ? (
                <p className="text-[11.5px] text-white/60 py-3 text-center">{emptyText}</p>
            ) : (
                <ul className="divide-y divide-white/10">{children}</ul>
            )}
        </div>
    );
}
