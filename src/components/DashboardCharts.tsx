import { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    PolarAngleAxis,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Activity,
    BarChart3,
    DollarSign,
    PieChart as PieIcon,
    Receipt,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';
import {
    GET_ACCOUNTS_PAYABLE,
    GET_ACCOUNTS_RECEIVABLE,
} from '../graphql/queries/accounts';
import { GET_ORDERS } from '../graphql/queries/orders';
import { LIST_PRODUCTS_WITH_IMAGES } from '../graphql/mutations/product-with-images';
import {
    AccountPayableData,
    AccountReceivableData,
    formatBRL,
} from '../types/accounts';

interface OrderData {
    id: string;
    number: number;
    status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED' | 'REFUNDED';
    paymentMethod: string;
    total: number;
    createdAt: string;
    items: { productId: string; productName: string; quantity: number; total: number }[];
}

interface ProductData {
    id: string;
    nameProduct: string;
    quantity: number;
    minStock: number;
    costPrice: number;
    salePrice: number;
    status: string;
}

const STATUS_COLORS = {
    PENDING: '#F59E0B',
    PAID: '#10B981',
    OVERDUE: '#EF4444',
    CANCELED: '#94A3B8',
    CONFIRMED: '#3B82F6',
    DRAFT: '#A78BFA',
    REFUNDED: '#FB7185',
};

const PAYMENT_COLORS: Record<string, string> = {
    CASH: '#10B981',
    PIX: '#06B6D4',
    CREDIT_CARD: '#8B5CF6',
    DEBIT_CARD: '#3B82F6',
    BOLETO: '#F59E0B',
    TRANSFER: '#EC4899',
    OTHER: '#94A3B8',
};

const PAYMENT_LABELS: Record<string, string> = {
    CASH: 'Dinheiro',
    PIX: 'PIX',
    CREDIT_CARD: 'Crédito',
    DEBIT_CARD: 'Débito',
    BOLETO: 'Boleto',
    TRANSFER: 'Transf.',
    OTHER: 'Outro',
};

function CardShell({
    title,
    subtitle,
    icon,
    children,
    onClick,
}: {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <section
            onClick={onClick}
            className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden ${onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-white/[0.15] transition-colors' : ''}`}
        >
            <header className="flex items-start justify-between gap-2 px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2 min-w-0">
                    {icon}
                    <div className="min-w-0">
                        <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">{title}</h3>
                        {subtitle && (
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{subtitle}</p>
                        )}
                    </div>
                </div>
            </header>
            <div className="p-4">{children}</div>
        </section>
    );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400 dark:text-slate-600">
            {icon}
            <p className="mt-2 text-[12px]">{label}</p>
        </div>
    );
}

export function DashboardCharts() {
    const navigate = useNavigate();
    const { data: ordersData } = useQuery<{ orders: OrderData[] }>(GET_ORDERS, {
        variables: { take: 1000 },
        fetchPolicy: 'cache-and-network',
    });
    const { data: receivablesData } = useQuery<{ accountsReceivable: AccountReceivableData[] }>(
        GET_ACCOUNTS_RECEIVABLE,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: payablesData } = useQuery<{ accountsPayable: AccountPayableData[] }>(
        GET_ACCOUNTS_PAYABLE,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: productsData } = useQuery<{ products: ProductData[] }>(LIST_PRODUCTS_WITH_IMAGES, {
        variables: { take: 200, skip: 0 },
        fetchPolicy: 'cache-and-network',
    });

    const orders = ordersData?.orders ?? [];
    const receivables = receivablesData?.accountsReceivable ?? [];
    const payables = payablesData?.accountsPayable ?? [];
    const products = productsData?.products ?? [];

    // Vendas dos últimos 30 dias por dia
    const salesLast30Days = useMemo(() => {
        const days: { date: string; label: string; total: number; count: number }[] = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().slice(0, 10);
            days.push({
                date: key,
                label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                total: 0,
                count: 0,
            });
        }
        const map = new Map(days.map((d) => [d.date, d]));
        for (const o of orders) {
            if (o.status === 'CANCELED' || o.status === 'REFUNDED') continue;
            const key = new Date(o.createdAt).toISOString().slice(0, 10);
            const day = map.get(key);
            if (day) {
                day.total += o.total;
                day.count += 1;
            }
        }
        return days;
    }, [orders]);

    // Top 5 produtos mais vendidos
    const topProducts = useMemo(() => {
        const totals = new Map<string, { name: string; revenue: number; qty: number }>();
        for (const o of orders) {
            if (o.status === 'CANCELED' || o.status === 'REFUNDED') continue;
            for (const item of o.items) {
                const existing = totals.get(item.productId);
                if (existing) {
                    existing.revenue += item.total;
                    existing.qty += item.quantity;
                } else {
                    totals.set(item.productId, {
                        name: item.productName,
                        revenue: item.total,
                        qty: item.quantity,
                    });
                }
            }
        }
        return [...totals.values()]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
            .map((p) => ({
                name: p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name,
                revenue: p.revenue,
                qty: p.qty,
            }));
    }, [orders]);

    // Pizza: status das contas a receber
    const receivablesStatus = useMemo(() => {
        const counts = { PENDING: 0, PAID: 0, OVERDUE: 0, CANCELED: 0 };
        const today = new Date();
        for (const r of receivables) {
            if (r.status === 'PAID') counts.PAID += Number(r.amount);
            else if (r.status === 'CANCELED') counts.CANCELED += Number(r.amount);
            else if (r.status === 'OVERDUE' || (r.status === 'PENDING' && new Date(r.dueDate) < today))
                counts.OVERDUE += Number(r.amount);
            else counts.PENDING += Number(r.amount);
        }
        return [
            { name: 'Pago', value: counts.PAID, color: STATUS_COLORS.PAID },
            { name: 'Pendente', value: counts.PENDING, color: STATUS_COLORS.PENDING },
            { name: 'Vencido', value: counts.OVERDUE, color: STATUS_COLORS.OVERDUE },
            { name: 'Cancelado', value: counts.CANCELED, color: STATUS_COLORS.CANCELED },
        ].filter((d) => d.value > 0);
    }, [receivables]);

    // Pizza: vendas por método de pagamento
    const paymentMix = useMemo(() => {
        const counts = new Map<string, number>();
        for (const o of orders) {
            if (o.status === 'CANCELED' || o.status === 'REFUNDED') continue;
            counts.set(o.paymentMethod, (counts.get(o.paymentMethod) ?? 0) + o.total);
        }
        return [...counts.entries()]
            .map(([k, v]) => ({
                name: PAYMENT_LABELS[k] ?? k,
                value: v,
                color: PAYMENT_COLORS[k] ?? '#94A3B8',
            }))
            .sort((a, b) => b.value - a.value);
    }, [orders]);

    // Saúde do estoque (radial)
    const stockHealth = useMemo(() => {
        const total = products.length;
        if (total === 0) return { value: 0, healthy: 0, low: 0, out: 0, total: 0 };
        const out = products.filter((p) => p.quantity === 0).length;
        const low = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
        const healthy = total - out - low;
        const value = Math.round((healthy / total) * 100);
        return { value, healthy, low, out, total };
    }, [products]);

    // Pizza: distribuição de status dos produtos (estoque saudável vs crítico)
    const stockDistribution = useMemo(() => {
        const out = products.filter((p) => p.quantity === 0).length;
        const low = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
        const healthy = products.length - out - low;
        return [
            { name: 'Saudável', value: healthy, color: '#10B981' },
            { name: 'Estoque baixo', value: low, color: '#F59E0B' },
            { name: 'Sem estoque', value: out, color: '#EF4444' },
        ].filter((d) => d.value > 0);
    }, [products]);

    // Fluxo de caixa: receitas previstas vs despesas previstas (próximos 30 dias)
    const cashFlowForecast = useMemo(() => {
        const days: { label: string; receita: number; despesa: number }[] = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0);
            days.push({
                label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                receita: 0,
                despesa: 0,
            });
        }
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        for (const r of receivables) {
            if (r.status === 'PAID' || r.status === 'CANCELED') continue;
            const due = new Date(r.dueDate);
            const diff = Math.floor((due.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 30) days[diff].receita += Number(r.finalAmount);
        }
        for (const p of payables) {
            if (p.status === 'PAID' || p.status === 'CANCELED') continue;
            const due = new Date(p.dueDate);
            const diff = Math.floor((due.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 30) days[diff].despesa += Number(p.finalAmount);
        }
        return days;
    }, [receivables, payables]);

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                {/* Vendas dos últimos 30 dias */}
                <div className="xl:col-span-2">
                    <CardShell
                        title="Vendas — últimos 30 dias"
                        subtitle={`${orders.filter((o) => o.status !== 'CANCELED' && o.status !== 'REFUNDED').length} pedidos no total`}
                        icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
                    >
                        {salesLast30Days.every((d) => d.total === 0) ? (
                            <EmptyState
                                icon={<ShoppingCart className="w-7 h-7 opacity-60" strokeWidth={1.5} />}
                                label="Nenhuma venda nos últimos 30 dias"
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <AreaChart data={salesLast30Days} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                                            <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval={5} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString())}
                                    />
                                    <Tooltip
                                        formatter={(v: number) => formatBRL(v)}
                                        labelFormatter={(label, payload) => {
                                            const item = payload?.[0]?.payload;
                                            return `${label} — ${item?.count ?? 0} pedido(s)`;
                                        }}
                                        contentStyle={{
                                            borderRadius: 8,
                                            border: '1px solid #e2e8f0',
                                            fontSize: 12,
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        fill="url(#salesGradient)"
                                        name="Vendas"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardShell>
                </div>

                {/* Saúde do estoque */}
                <CardShell
                    title="Saúde do estoque"
                    subtitle={`${stockHealth.total} produtos no catálogo`}
                    icon={<Activity className="w-4 h-4 text-violet-500" />}
                    onClick={() => navigate('/produtos')}
                >
                    {stockHealth.total === 0 ? (
                        <EmptyState
                            icon={<BarChart3 className="w-7 h-7 opacity-60" strokeWidth={1.5} />}
                            label="Nenhum produto cadastrado"
                        />
                    ) : (
                        <div className="relative">
                            <ResponsiveContainer width="100%" height={200}>
                                <RadialBarChart
                                    innerRadius="68%"
                                    outerRadius="100%"
                                    data={[{ name: 'Saúde', value: stockHealth.value, fill: stockHealth.value >= 70 ? '#10B981' : stockHealth.value >= 40 ? '#F59E0B' : '#EF4444' }]}
                                    startAngle={90}
                                    endAngle={-270}
                                >
                                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                                    <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#f1f5f9' }} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                                    {stockHealth.value}%
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">saudável</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px]">
                                <div>
                                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{stockHealth.healthy}</p>
                                    <p className="text-slate-500 dark:text-slate-400">OK</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">{stockHealth.low}</p>
                                    <p className="text-slate-500 dark:text-slate-400">Baixo</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">{stockHealth.out}</p>
                                    <p className="text-slate-500 dark:text-slate-400">Zerado</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardShell>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                {/* Top 5 produtos */}
                <div className="xl:col-span-2">
                    <CardShell
                        title="Top 5 produtos por receita"
                        subtitle="Mais vendidos nas últimas vendas"
                        icon={<BarChart3 className="w-4 h-4 text-sky-500" />}
                    >
                        {topProducts.length === 0 ? (
                            <EmptyState
                                icon={<ShoppingCart className="w-7 h-7 opacity-60" strokeWidth={1.5} />}
                                label="Nenhuma venda registrada"
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart
                                    data={topProducts}
                                    layout="vertical"
                                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString())}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        width={120}
                                    />
                                    <Tooltip
                                        formatter={(v: number, _n, p: any) => [formatBRL(v), `${p.payload.qty} un.`]}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                                    />
                                    <Bar dataKey="revenue" fill="#0EA5E9" radius={[0, 6, 6, 0]} name="Receita" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardShell>
                </div>

                {/* Distribuição de estoque */}
                <CardShell
                    title="Distribuição do estoque"
                    icon={<PieIcon className="w-4 h-4 text-fuchsia-500" />}
                    onClick={() => navigate('/estoque/alertas')}
                >
                    {stockDistribution.length === 0 ? (
                        <EmptyState
                            icon={<PieIcon className="w-7 h-7 opacity-60" strokeWidth={1.5} />}
                            label="Sem dados"
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={stockDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {stockDistribution.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                <Legend
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: 11 }}
                                    formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </CardShell>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                {/* Forecast de fluxo de caixa */}
                <div className="xl:col-span-2">
                    <CardShell
                        title="Fluxo de caixa previsto — próximos 30 dias"
                        subtitle="A receber vs a pagar conforme vencimentos"
                        icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                    >
                        {cashFlowForecast.every((d) => d.receita === 0 && d.despesa === 0) ? (
                            <EmptyState
                                icon={<DollarSign className="w-7 h-7 opacity-60" strokeWidth={1.5} />}
                                label="Sem contas com vencimento próximo"
                            />
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={cashFlowForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval={4} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString())}
                                    />
                                    <Tooltip
                                        formatter={(v: number) => formatBRL(v)}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <Bar dataKey="receita" fill="#10B981" radius={[4, 4, 0, 0]} name="A receber" />
                                    <Bar dataKey="despesa" fill="#EF4444" radius={[4, 4, 0, 0]} name="A pagar" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardShell>
                </div>

                {/* Mix de pagamento */}
                <CardShell
                    title="Mix de pagamento"
                    subtitle="Receita por forma de pagamento"
                    icon={<Receipt className="w-4 h-4 text-violet-500" />}
                >
                    {paymentMix.length === 0 ? (
                        <EmptyState
                            icon={<Receipt className="w-7 h-7 opacity-60" strokeWidth={1.5} />}
                            label="Sem vendas registradas"
                        />
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={paymentMix} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={(e) => e.name}>
                                    {paymentMix.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(v: number) => formatBRL(v)}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </CardShell>
            </div>

            {/* Status das contas a receber */}
            <CardShell
                title="Status das contas a receber"
                subtitle="Distribuição de valores por situação"
                icon={<PieIcon className="w-4 h-4 text-amber-500" />}
                onClick={() => navigate('/listar-contas-receber')}
            >
                {receivablesStatus.length === 0 ? (
                    <EmptyState
                        icon={<Receipt className="w-7 h-7 opacity-60" strokeWidth={1.5} />}
                        label="Sem contas a receber"
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={receivablesStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#64748b' }}
                                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString())}
                                />
                                <Tooltip
                                    formatter={(v: number) => formatBRL(v)}
                                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {receivablesStatus.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 self-center">
                            {receivablesStatus.map((s) => {
                                const total = receivablesStatus.reduce((sum, x) => sum + x.value, 0);
                                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                                return (
                                    <div key={s.name}>
                                        <div className="flex items-center justify-between text-[12.5px] mb-1">
                                            <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                                {s.name}
                                            </span>
                                            <span className="text-slate-900 dark:text-white font-semibold tabular-nums">
                                                {formatBRL(s.value)}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                                        </div>
                                        <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 text-right">{pct}%</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardShell>
        </div>
    );
}
