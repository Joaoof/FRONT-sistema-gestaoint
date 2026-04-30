// src/pages/DeliveryReportsPage.tsx
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck,
    CheckCircle,
    AlertTriangle,
    Clock,
    Download,
    RefreshCw,
    Calendar,
    MapPin,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart as RechartsBarChart,
    Bar,
} from 'recharts';
import { useQuery } from '@apollo/client';
import { GET_DELIVERIES, GET_DELIVERIES_SUMMARY } from '../graphql/queries/deliveries';

type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

interface Delivery {
    id: string;
    status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELED';
    destination: string | null;
    scheduledDate: string | null;
    deliveredAt: string | null;
    startedAt: string | null;
    createdAt: string;
}

interface DeliveriesSummary {
    pending: number;
    inTransit: number;
    delivered: number;
    canceled: number;
    todayDelivered: number;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function periodStart(period: Period): Date {
    const now = new Date();
    const d = new Date(now);
    switch (period) {
        case 'today':
            d.setHours(0, 0, 0, 0);
            return d;
        case 'week':
            d.setDate(d.getDate() - 6);
            d.setHours(0, 0, 0, 0);
            return d;
        case 'month':
            d.setDate(1);
            d.setHours(0, 0, 0, 0);
            return d;
        case 'year':
            d.setMonth(0, 1);
            d.setHours(0, 0, 0, 0);
            return d;
        case 'custom':
        default:
            d.setFullYear(d.getFullYear() - 1);
            return d;
    }
}

function extractRegion(destination: string | null): string {
    if (!destination) return '—';
    const ufMatch = destination.match(/\b([A-Z]{2})\b/);
    if (ufMatch) return ufMatch[1];
    const parts = destination.split(/[,\-]/).map((p) => p.trim()).filter(Boolean);
    return parts[parts.length - 1]?.slice(0, 12) || '—';
}

export function DeliveryReportsPage() {
    const [period, setPeriod] = useState<Period>('month');

    const {
        data: deliveriesData,
        loading: loadingDeliveries,
        refetch: refetchDeliveries,
    } = useQuery<{ deliveries: Delivery[] }>(GET_DELIVERIES, {
        fetchPolicy: 'cache-and-network',
    });

    const {
        data: summaryData,
        loading: loadingSummary,
        refetch: refetchSummary,
    } = useQuery<{ deliveriesSummary: DeliveriesSummary }>(GET_DELIVERIES_SUMMARY, {
        fetchPolicy: 'cache-and-network',
    });

    const loading = loadingDeliveries || loadingSummary;

    const deliveries = deliveriesData?.deliveries ?? [];
    const summary = summaryData?.deliveriesSummary;

    const periodDeliveries = useMemo(() => {
        const start = periodStart(period);
        return deliveries.filter((d) => new Date(d.createdAt) >= start);
    }, [deliveries, period]);

    const monthlyDeliveries = useMemo(() => {
        const counts = Array(12).fill(0) as number[];
        const previous = Array(12).fill(0) as number[];
        const currentYear = new Date().getFullYear();
        for (const d of deliveries) {
            const dt = new Date(d.createdAt);
            const m = dt.getMonth();
            if (dt.getFullYear() === currentYear) counts[m] += 1;
            if (dt.getFullYear() === currentYear - 1) previous[m] += 1;
        }
        return MONTH_LABELS.map((month, i) => ({
            month,
            deliveries: counts[i],
            previous: previous[i],
        }));
    }, [deliveries]);

    const deliveryStatus = useMemo(() => {
        if (!summary) return [];
        return [
            { name: 'Entregues', value: summary.delivered, color: '#10B981' },
            { name: 'Em rota', value: summary.inTransit, color: '#3B82F6' },
            { name: 'Pendentes', value: summary.pending, color: '#F59E0B' },
            { name: 'Canceladas', value: summary.canceled, color: '#EF4444' },
        ].filter((s) => s.value > 0);
    }, [summary]);

    const topDestinations = useMemo(() => {
        const counts = new Map<string, number>();
        for (const d of periodDeliveries) {
            const region = extractRegion(d.destination);
            counts.set(region, (counts.get(region) ?? 0) + 1);
        }
        const total = Array.from(counts.values()).reduce((s, v) => s + v, 0) || 1;
        return Array.from(counts.entries())
            .map(([name, value]) => ({ name, value: Math.round((value / total) * 100), count: value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [periodDeliveries]);

    const kpis = useMemo(() => {
        const total = periodDeliveries.length;
        const delivered = periodDeliveries.filter((d) => d.status === 'DELIVERED').length;
        const onTimeRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
        const late = periodDeliveries.filter((d) => {
            if (!d.scheduledDate || !d.deliveredAt) return false;
            return new Date(d.deliveredAt) > new Date(d.scheduledDate);
        }).length;

        const durations: number[] = [];
        for (const d of periodDeliveries) {
            if (d.startedAt && d.deliveredAt) {
                const diffMs = new Date(d.deliveredAt).getTime() - new Date(d.startedAt).getTime();
                if (diffMs > 0) durations.push(diffMs / (1000 * 60 * 60));
            }
        }
        const avgHours = durations.length > 0
            ? durations.reduce((s, v) => s + v, 0) / durations.length
            : 0;

        return [
            { value: String(total), label: 'Entregas no período', icon: <Truck className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400' },
            { value: `${onTimeRate}%`, label: 'Taxa de conclusão', icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600 dark:text-emerald-400' },
            { value: String(late), label: 'Atrasos', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-orange-600' },
            { value: avgHours > 0 ? `${avgHours.toFixed(1)}h` : '—', label: 'Tempo médio', icon: <Clock className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400' },
        ];
    }, [periodDeliveries]);

    const insights = useMemo(() => {
        const arr: { type: 'success' | 'info' | 'warning'; text: string }[] = [];
        if (topDestinations[0]) {
            arr.push({ type: 'success', text: `🚚 ${topDestinations[0].name} é o destino mais frequente (${topDestinations[0].value}%)` });
        }
        if (summary && summary.canceled > 0) {
            arr.push({ type: 'warning', text: `⚠️ ${summary.canceled} entrega(s) cancelada(s) no histórico` });
        }
        if (summary && summary.todayDelivered > 0) {
            arr.push({ type: 'info', text: `📦 ${summary.todayDelivered} entrega(s) finalizada(s) hoje` });
        }
        return arr;
    }, [topDestinations, summary]);

    const handleRefresh = () => {
        refetchDeliveries();
        refetchSummary();
    };

    const handleExport = () => {
        const headers = ['ID', 'Status', 'Destino', 'Agendada', 'Iniciada', 'Entregue', 'Criada em'];
        const rows = periodDeliveries.map((d) => [
            d.id,
            d.status,
            d.destination ?? '',
            d.scheduledDate ?? '',
            d.startedAt ?? '',
            d.deliveredAt ?? '',
            d.createdAt,
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `entregas_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 relative overflow-hidden">
            <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 30%, #3B82F6 1px, transparent 1px),
                        radial-gradient(circle at 80% 10%, #10B981 1px, transparent 1px),
                        radial-gradient(circle at 40% 70%, #F59E0B 1px, transparent 1px),
                        radial-gradient(circle at 90% 60%, #EF4444 1px, transparent 1px),
                        linear-gradient(45deg, transparent 98%, #6B7280 99%)
                    `,
                    backgroundSize: '200px 200px',
                }}
            />

            <div className="relative z-10">
                <div className="mx-4 lg:mx-8 mb-6 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Relatórios de entregas</h1>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Análises de logística e desempenho operacional</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={handleRefresh}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
                                Atualizar
                            </button>
                            <button
                                onClick={handleExport}
                                className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                                Exportar CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mx-4 lg:mx-8 mb-6 flex flex-wrap gap-3">
                    {(['today', 'week', 'month', 'year', 'custom'] as Period[]).map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setPeriod(preset)}
                            className={`px-4 py-2 text-sm rounded-lg transition capitalize ${period === preset
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/15 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200'
                                }`}
                        >
                            {preset === 'today' && 'Hoje'}
                            {preset === 'week' && '7 dias'}
                            {preset === 'month' && 'Mês'}
                            {preset === 'year' && 'Ano'}
                            {preset === 'custom' && <Calendar className="w-4 h-4 inline" />}
                        </button>
                    ))}
                </div>

                {loading && deliveries.length === 0 ? (
                    <div className="space-y-6 mx-4 lg:mx-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 h-24 rounded-2xl animate-pulse border border-gray-200 dark:border-white/10" />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mx-4 lg:mx-8 mb-6">
                            {kpis.map((kpi, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    className="bg-white/80 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                                >
                                    <div className={`inline-flex p-2 rounded-xl mb-2 ${kpi.color.replace('text-', 'bg-').replace('600', '100').replace('400', '500/10')}`}>
                                        {kpi.icon}
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">{kpi.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {insights.length > 0 && (
                            <div className="mx-4 lg:mx-8 mb-6 space-y-2">
                                <AnimatePresence>
                                    {insights.map((insight, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: i * 0.15 }}
                                            className={`p-3 rounded-lg text-sm font-medium ${insight.type === 'success'
                                                ? 'bg-green-50 dark:bg-emerald-950/40 text-green-800 dark:text-emerald-200 border border-green-200 dark:border-emerald-900/40'
                                                : insight.type === 'warning'
                                                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-900/40'
                                                    : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-900/40'
                                                }`}
                                        >
                                            {insight.text}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-4 lg:mx-8 mb-6">
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                                <h3 className="text-base font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                                    <Truck className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                    Entregas por mês
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlyDeliveries}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                        <XAxis dataKey="month" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: number) => [value, 'Entregas']}
                                            labelFormatter={(label) => `Mês: ${label}`}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="deliveries" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} animationDuration={1000} name={String(new Date().getFullYear())} />
                                        <Line type="monotone" dataKey="previous" stroke="#9CA3AF" strokeDasharray="5 5" dot={false} name={String(new Date().getFullYear() - 1)} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
                                <h3 className="text-base font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                                    Status das entregas
                                </h3>
                                {deliveryStatus.length === 0 ? (
                                    <div className="h-[300px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                        Sem entregas registradas ainda
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={deliveryStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={2}
                                                dataKey="value"
                                                nameKey="name"
                                                animationDuration={1200}
                                            >
                                                {deliveryStatus.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10 p-6 lg:col-span-2">
                                <h3 className="text-base font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                                    <MapPin className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                                    Principais destinos
                                </h3>
                                {topDestinations.length === 0 ? (
                                    <div className="h-[300px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                        Sem dados para o período selecionado
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsBarChart data={topDestinations} layout="vertical" margin={{ left: 80 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                content={({ payload }) => {
                                                    if (payload && payload[0]) {
                                                        const data = payload[0].payload as { name: string; value: number; count: number };
                                                        return (
                                                            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-white/10">
                                                                <p className="text-gray-900 dark:text-white"><strong>{data.name}</strong>: {data.value}%</p>
                                                                <p className="text-sm text-gray-600 dark:text-slate-300">{data.count} entrega(s)</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                                                {topDestinations.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
