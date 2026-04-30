import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    AlertTriangle,
    Archive,
    BadgeCheck,
    Boxes,
    Layers,
    Package,
    PackageX,
    Plus,
    TrendingDown,
    TrendingUp,
    Warehouse,
} from 'lucide-react';
import { LIST_PRODUCTS_WITH_IMAGES } from '../../graphql/mutations/product-with-images';
import { ProductImage } from '../../components/ProductImage';

interface ProductData {
    id: string;
    nameProduct: string;
    sku: string | null;
    quantity: number;
    minStock: number;
    unit: string;
    costPrice: number;
    salePrice: number;
    status: string;
    images: { id: string; url: string; isPrimary: boolean; order: number }[];
}

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export function InventoryHub() {
    const navigate = useNavigate();
    const { data, loading } = useQuery<{ products: ProductData[] }>(
        LIST_PRODUCTS_WITH_IMAGES,
        { variables: { take: 500, skip: 0 }, fetchPolicy: 'cache-and-network' },
    );

    const products = data?.products ?? [];

    const stats = useMemo(() => {
        const total = products.length;
        const out = products.filter((p) => p.quantity === 0).length;
        const low = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
        const healthy = total - out - low;
        const totalUnits = products.reduce((s, p) => s + p.quantity, 0);
        const totalCost = products.reduce((s, p) => s + p.costPrice * p.quantity, 0);
        const totalRetail = products.reduce((s, p) => s + p.salePrice * p.quantity, 0);
        const potentialProfit = totalRetail - totalCost;
        const margin = totalRetail > 0 ? ((potentialProfit / totalRetail) * 100) : 0;
        return {
            total,
            out,
            low,
            healthy,
            totalUnits,
            totalCost,
            totalRetail,
            potentialProfit,
            margin,
        };
    }, [products]);

    // Top 10 produtos por valor imobilizado
    const topByValue = useMemo(() => {
        return [...products]
            .map((p) => ({
                name: p.nameProduct.length > 22 ? `${p.nameProduct.slice(0, 21)}…` : p.nameProduct,
                value: p.costPrice * p.quantity,
                qty: p.quantity,
                unit: p.unit,
            }))
            .filter((p) => p.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [products]);

    // Gráfico pizza: saúde do estoque
    const healthDistribution = useMemo(() => {
        return [
            { name: 'Saudável', value: stats.healthy, color: '#10B981' },
            { name: 'Estoque baixo', value: stats.low, color: '#F59E0B' },
            { name: 'Sem estoque', value: stats.out, color: '#EF4444' },
        ].filter((d) => d.value > 0);
    }, [stats]);

    // Critical products (most urgent first)
    const critical = useMemo(() => {
        return [...products]
            .filter((p) => p.quantity <= p.minStock)
            .sort((a, b) => {
                if (a.quantity === 0 && b.quantity !== 0) return -1;
                if (b.quantity === 0 && a.quantity !== 0) return 1;
                const ra = a.minStock > 0 ? a.quantity / a.minStock : 0;
                const rb = b.minStock > 0 ? b.quantity / b.minStock : 0;
                return ra - rb;
            })
            .slice(0, 6);
    }, [products]);

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-violet-500" />
                        Central de Estoque
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Visão geral do inventário, valor imobilizado e produtos críticos
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/estoque/alertas')}
                        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md"
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Alertas
                    </button>
                    <button
                        onClick={() => navigate('/produtos/cadastrar')}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Novo produto
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                    label="Itens no catálogo"
                    value={stats.total.toString()}
                    helper={`${stats.totalUnits.toLocaleString('pt-BR')} unidades em estoque`}
                    icon={<Boxes className="w-4 h-4" />}
                    accent="sky"
                />
                <KpiCard
                    label="Valor imobilizado"
                    value={formatBRL(stats.totalCost)}
                    helper="Capital parado em estoque (custo)"
                    icon={<Archive className="w-4 h-4" />}
                    accent="violet"
                />
                <KpiCard
                    label="Receita potencial"
                    value={formatBRL(stats.totalRetail)}
                    helper={`Margem média ${stats.margin.toFixed(1)}%`}
                    icon={<TrendingUp className="w-4 h-4" />}
                    accent="emerald"
                />
                <KpiCard
                    label="Lucro potencial"
                    value={formatBRL(stats.potentialProfit)}
                    helper={`Se vender todo o estoque`}
                    icon={<BadgeCheck className="w-4 h-4" />}
                    accent="amber"
                />
            </div>

            {/* Saúde do estoque cards */}
            <div className="grid grid-cols-3 gap-3">
                <HealthCard
                    label="Saudável"
                    value={stats.healthy}
                    total={stats.total}
                    color="emerald"
                    icon={<BadgeCheck className="w-4 h-4" />}
                />
                <HealthCard
                    label="Estoque baixo"
                    value={stats.low}
                    total={stats.total}
                    color="amber"
                    icon={<TrendingDown className="w-4 h-4" />}
                />
                <HealthCard
                    label="Sem estoque"
                    value={stats.out}
                    total={stats.total}
                    color="rose"
                    icon={<PackageX className="w-4 h-4" />}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                {/* Top produtos por valor imobilizado */}
                <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                        <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-4 h-4 text-violet-500" />
                            Top produtos por valor imobilizado
                        </h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Onde está concentrado o capital do estoque
                        </p>
                    </header>
                    {topByValue.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <Package className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
                            <p className="text-[12px]">Nenhum produto com estoque</p>
                        </div>
                    ) : (
                        <div className="p-4">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={topByValue}
                                    layout="vertical"
                                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString())}
                                    />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={140} />
                                    <Tooltip
                                        formatter={(v: number, _n, p: any) => [
                                            formatBRL(v),
                                            `${p.payload.qty} ${p.payload.unit}`,
                                        ]}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                                    />
                                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Distribuição de saúde */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                    <header className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                        <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">
                            Distribuição de saúde
                        </h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Por situação do estoque
                        </p>
                    </header>
                    <div className="p-4">
                        {healthDistribution.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                                <Package className="w-7 h-7 mb-2 opacity-60" strokeWidth={1.5} />
                                <p className="text-[12px]">Sem dados</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={healthDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        paddingAngle={3}
                                        dataKey="value"
                                        label={(e) => e.value}
                                    >
                                        {healthDistribution.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="mt-2 space-y-1.5">
                            {healthDistribution.map((d) => (
                                <div key={d.name} className="flex items-center justify-between text-[12px]">
                                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                                        {d.name}
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-semibold tabular-nums">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Produtos mais críticos */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <div>
                        <h3 className="text-[13.5px] font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            Produtos mais críticos
                        </h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Reposição urgente em ordem de prioridade
                        </p>
                    </div>
                    {critical.length > 0 && (
                        <button
                            onClick={() => navigate('/estoque/alertas')}
                            className="text-[11.5px] font-medium text-violet-600 dark:text-violet-400 hover:underline"
                        >
                            Ver relatório completo →
                        </button>
                    )}
                </header>
                {loading && critical.length === 0 ? (
                    <div className="px-5 py-12 text-center text-[13px] text-slate-500">Carregando...</div>
                ) : critical.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <BadgeCheck className="w-10 h-10 mx-auto text-emerald-300 dark:text-emerald-700" />
                        <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">
                            Estoque saudável. Nenhum produto abaixo do mínimo!
                        </p>
                    </div>
                ) : (
                    <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                        {critical.map((p) => {
                            const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
                            const isOut = p.quantity === 0;
                            const ratio = p.minStock > 0 ? Math.min(100, (p.quantity / p.minStock) * 100) : 0;
                            return (
                                <li key={p.id}>
                                    <button
                                        onClick={() => navigate(`/produtos/${p.id}`)}
                                        className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                    >
                                        <ProductImage
                                            src={cover}
                                            alt={p.nameProduct}
                                            className="w-10 h-10 rounded-md object-cover shrink-0"
                                            fallbackClassName="w-10 h-10 rounded-md shrink-0"
                                            iconSize={18}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
                                                {p.nameProduct}
                                            </p>
                                            <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        isOut
                                                            ? 'bg-rose-500'
                                                            : ratio <= 50
                                                              ? 'bg-amber-500'
                                                              : 'bg-yellow-500'
                                                    }`}
                                                    style={{ width: `${Math.max(2, ratio)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                    isOut
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                                                }`}
                                            >
                                                {isOut ? 'Sem estoque' : `${p.quantity} ${p.unit}`}
                                            </span>
                                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                                                mín {p.minStock}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* Atalhos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ActionButton
                    icon={<Plus className="w-5 h-5" />}
                    title="Cadastrar produto"
                    subtitle="Adicione novo item ao catálogo"
                    onClick={() => navigate('/produtos/cadastrar')}
                    accent="violet"
                />
                <ActionButton
                    icon={<AlertTriangle className="w-5 h-5" />}
                    title="Relatório de alertas"
                    subtitle="Sugestão de reposição + CSV"
                    onClick={() => navigate('/estoque/alertas')}
                    accent="amber"
                />
                <ActionButton
                    icon={<Boxes className="w-5 h-5" />}
                    title="Listar produtos"
                    subtitle="Catálogo completo"
                    onClick={() => navigate('/produtos')}
                    accent="sky"
                />
            </div>
        </div>
    );
}

function KpiCard({
    label,
    value,
    helper,
    icon,
    accent,
}: {
    label: string;
    value: string;
    helper: string;
    icon: React.ReactNode;
    accent: 'sky' | 'emerald' | 'amber' | 'violet';
}) {
    const palette = {
        sky: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        violet: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    };
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4">
            <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-md ring-1 flex items-center justify-center ${palette[accent]}`}>
                    {icon}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
                    {label}
                </span>
            </div>
            <p className="mt-3 text-[20px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums">
                {value}
            </p>
            <p className="mt-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
    );
}

function HealthCard({
    label,
    value,
    total,
    color,
    icon,
}: {
    label: string;
    value: number;
    total: number;
    color: 'emerald' | 'amber' | 'rose';
    icon: React.ReactNode;
}) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;
    const palette = {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
    };
    const text = {
        emerald: 'text-emerald-600 dark:text-emerald-400',
        amber: 'text-amber-600 dark:text-amber-400',
        rose: 'text-rose-600 dark:text-rose-400',
    };
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4">
            <div className={`flex items-center gap-2 ${text[color]}`}>
                {icon}
                <span className="text-[12.5px] font-semibold">{label}</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
                <p className={`text-[28px] font-bold leading-none tabular-nums ${text[color]}`}>{value}</p>
                <span className="text-[12px] text-slate-500 dark:text-slate-400">de {total}</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] overflow-hidden">
                <div className={`h-full rounded-full ${palette[color]}`} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">{pct}% do total</p>
        </div>
    );
}

function ActionButton({
    icon,
    title,
    subtitle,
    onClick,
    accent,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
    accent: 'sky' | 'amber' | 'violet';
}) {
    const palette = {
        sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    };
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 hover:border-slate-300 dark:hover:border-white/[0.15] hover:shadow-sm transition-all group"
        >
            <div className="flex items-start gap-3">
                <span className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${palette[accent]} group-hover:scale-105 transition-transform`}>
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <h4 className="text-[13.5px] font-medium text-slate-900 dark:text-white">{title}</h4>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
                </div>
            </div>
        </button>
    );
}
