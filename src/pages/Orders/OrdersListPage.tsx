import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Calendar,
    Eye,
    FileText,
    Plus,
    Printer,
    Search,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';
import { GET_ORDERS } from '../../graphql/queries/orders';

type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED' | 'REFUNDED';
type PaymentMethod = 'CASH' | 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BOLETO' | 'TRANSFER' | 'OTHER';

interface OrderRow {
    id: string;
    number: number;
    customerName?: string | null;
    customer?: { id: string; name: string; document?: string | null } | null;
    status: OrderStatus;
    paymentMethod?: PaymentMethod | null;
    subtotal?: number | null;
    discount?: number | null;
    total: number;
    createdAt: string;
    items?: { id: string; productName: string; quantity: number }[] | null;
}

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

const STATUS_LABEL: Record<OrderStatus, string> = {
    DRAFT: 'Rascunho',
    CONFIRMED: 'Confirmado',
    PAID: 'Pago',
    CANCELED: 'Cancelado',
    REFUNDED: 'Reembolsado',
};

const STATUS_TONE: Record<OrderStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    CONFIRMED: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
    PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    CANCELED: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
    REFUNDED: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
    CASH: 'Dinheiro',
    PIX: 'PIX',
    CREDIT_CARD: 'Crédito',
    DEBIT_CARD: 'Débito',
    BOLETO: 'Boleto',
    TRANSFER: 'Transferência',
    OTHER: 'Outro',
};

type RangeFilter = 'today' | 'month' | '90d' | 'all';

export function OrdersListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
    const [rangeFilter, setRangeFilter] = useState<RangeFilter>('all');

    const { data, loading } = useQuery<{ orders: OrderRow[] }>(GET_ORDERS, {
        fetchPolicy: 'cache-and-network',
    });

    const orders = data?.orders ?? [];

    const filtered = useMemo(() => {
        const now = new Date();
        const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const start90 = startDay - 90 * 24 * 60 * 60 * 1000;
        const q = search.trim().toLowerCase();

        return orders.filter((o) => {
            if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
            const ts = new Date(o.createdAt).getTime();
            if (rangeFilter === 'today' && ts < startDay) return false;
            if (rangeFilter === 'month' && ts < startMonth) return false;
            if (rangeFilter === '90d' && ts < start90) return false;
            if (q) {
                const customer = (o.customer?.name ?? o.customerName ?? '').toLowerCase();
                const number = String(o.number);
                if (!customer.includes(q) && !number.includes(q)) return false;
            }
            return true;
        });
    }, [orders, search, statusFilter, rangeFilter]);

    const stats = useMemo(() => {
        const now = new Date();
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        let monthCount = 0;
        let monthRevenue = 0;
        let totalRevenue = 0;
        let paidCount = 0;
        for (const o of orders) {
            if (o.status === 'CANCELED' || o.status === 'REFUNDED') continue;
            totalRevenue += Number(o.total);
            if (o.status === 'PAID') paidCount++;
            if (new Date(o.createdAt).getTime() >= startMonth) {
                monthCount++;
                monthRevenue += Number(o.total);
            }
        }
        return { monthCount, monthRevenue, totalRevenue, paidCount, totalCount: orders.length };
    }, [orders]);

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                        Voltar
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center shadow-sm">
                            <FileText className="w-4 h-4 text-white" />
                        </span>
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                            Pedidos
                        </h1>
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Histórico completo de vendas — visualize, imprima e acompanhe
                    </p>
                </div>
                <button
                    onClick={() => navigate('/vendas')}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Nova venda
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Vendas no mês" value={String(stats.monthCount)} sub={formatBRL(stats.monthRevenue)} icon={<Calendar className="w-3.5 h-3.5" />} tone="blue" />
                <StatCard label="Total de pedidos" value={String(stats.totalCount)} sub="todos os tempos" icon={<ShoppingCart className="w-3.5 h-3.5" />} tone="slate" />
                <StatCard label="Pagos" value={String(stats.paidCount)} sub="status PAID" icon={<TrendingUp className="w-3.5 h-3.5" />} tone="emerald" />
                <StatCard label="Receita total" value={formatBRL(stats.totalRevenue)} sub="líquida (sem cancelados)" icon={<TrendingUp className="w-3.5 h-3.5" />} tone="indigo" />
            </div>

            {/* Filtros */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row gap-3 sm:items-center"
            >
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por número do pedido ou cliente…"
                        className="w-full h-10 pl-9 pr-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
                    className="h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] text-slate-700 dark:text-slate-200"
                >
                    <option value="ALL">Todos os status</option>
                    <option value="DRAFT">Rascunho</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="PAID">Pago</option>
                    <option value="CANCELED">Cancelado</option>
                    <option value="REFUNDED">Reembolsado</option>
                </select>
                <select
                    value={rangeFilter}
                    onChange={(e) => setRangeFilter(e.target.value as RangeFilter)}
                    className="h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13px] text-slate-700 dark:text-slate-200"
                >
                    <option value="all">Sempre</option>
                    <option value="today">Hoje</option>
                    <option value="month">Este mês</option>
                    <option value="90d">Últimos 90 dias</option>
                </select>
            </motion.div>

            {/* Tabela */}
            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10">
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Itens</th>
                                <th className="px-4 py-3">Pagamento</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        Carregando pedidos…
                                    </td>
                                </tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                        Nenhum pedido encontrado com esses filtros.
                                    </td>
                                </tr>
                            )}
                            {filtered.map((o) => {
                                const itemsCount = o.items?.reduce((acc, it) => acc + Number(it.quantity ?? 0), 0) ?? 0;
                                return (
                                    <tr key={o.id} className="border-b border-slate-100 dark:border-white/[0.04] last:border-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 font-mono text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                                            #{o.number}
                                        </td>
                                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
                                            {o.customer?.name ?? o.customerName ?? <span className="text-slate-400 italic">Avulso</span>}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                                            {new Date(o.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">{itemsCount}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                                            {o.paymentMethod ? PAYMENT_LABEL[o.paymentMethod] : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${STATUS_TONE[o.status]}`}>
                                                {STATUS_LABEL[o.status]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                                            {formatBRL(Number(o.total))}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    onClick={() => window.open(`/pedidos/${o.id}/imprimir`, '_blank')}
                                                    title="Imprimir"
                                                    className="inline-flex items-center gap-1 h-7 px-2 rounded text-[11.5px] font-semibold bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    <Printer className="w-3 h-3" />
                                                    Imprimir
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/pedidos/${o.id}/imprimir`)}
                                                    title="Visualizar"
                                                    className="w-7 h-7 grid place-items-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filtered.length > 0 && (
                    <div className="px-4 py-2.5 border-t border-slate-200 dark:border-white/10 text-[11.5px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>{filtered.length} pedido{filtered.length === 1 ? '' : 's'}</span>
                        <span className="tabular-nums">
                            Soma exibida: <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {formatBRL(filtered.reduce((acc, o) => acc + Number(o.total), 0))}
                            </span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    sub,
    icon,
    tone,
}: {
    label: string;
    value: string;
    sub: string;
    icon: React.ReactNode;
    tone: 'blue' | 'emerald' | 'indigo' | 'slate';
}) {
    const toneMap: Record<string, string> = {
        blue: 'from-blue-500/15 to-blue-500/5 border-blue-500/20 text-blue-700 dark:text-blue-300',
        emerald: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        indigo: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20 text-indigo-700 dark:text-indigo-300',
        slate: 'from-slate-500/10 to-slate-500/5 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300',
    };
    return (
        <div className={`rounded-xl border bg-gradient-to-br ${toneMap[tone]} p-3.5`}>
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider opacity-80">
                {icon}
                {label}
            </div>
            <p className="mt-1.5 text-[20px] font-bold leading-none tabular-nums text-slate-900 dark:text-white">{value}</p>
            <p className="mt-1 text-[11.5px] text-slate-600 dark:text-slate-400">{sub}</p>
        </div>
    );
}
