import { FileText, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// ==============================
// Tipos
// ==============================
interface SummaryCardProps {
    label: string;
    value: number;
    color: 'red' | 'yellow' | 'green';
    progress?: number;
}

interface Payable {
    id: string;
    supplier: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid' | 'overdue';
    category: string;
}

// ==============================
// Componente: SummaryCard (SaaS pattern)
// ==============================
function SummaryCard({ label, value, color, progress }: SummaryCardProps) {
    const tones = {
        red: {
            accent: 'bg-rose-500',
            iconBg: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
            bar: 'bg-rose-500',
        },
        yellow: {
            accent: 'bg-amber-500',
            iconBg: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
            bar: 'bg-amber-500',
        },
        green: {
            accent: 'bg-emerald-500',
            iconBg: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
            bar: 'bg-emerald-500',
        },
    } as const;

    const t = tones[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 hover:border-slate-300 dark:hover:border-white/15 hover:shadow-sm transition-all"
        >
            <span className={`absolute inset-x-0 top-0 h-[2px] ${t.accent} opacity-70`} aria-hidden />
            <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-md ring-1 flex items-center justify-center ${t.iconBg}`}>
                    {color === 'red' ? <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} /> :
                     color === 'yellow' ? <FileText className="w-3.5 h-3.5" strokeWidth={2} /> :
                     <FileText className="w-3.5 h-3.5" strokeWidth={2} />}
                </span>
                <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            </p>
            {progress !== undefined && (
                <div className="mt-3">
                    <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`${t.bar} h-1.5 rounded-full transition-all duration-500`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-[11px] mt-1.5 text-slate-500 dark:text-slate-400 tabular-nums">{progress}% pagos</p>
                </div>
            )}
        </motion.div>
    );
}

// ==============================
// Componente: ActionButton (compartilhado)
// ==============================
function ActionButton({
    icon: Icon,
    label,
    variant = 'primary',
    onClick,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    variant?: 'primary' | 'secondary';
    onClick: () => void;
}) {
    const baseClasses = 'flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200';
    const variants = {
        primary: 'bg-red-600 hover:bg-red-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variants[variant]} hover:shadow-md`}
        >
            <Icon className="w-5 h-5" />
            {label}
        </button>
    );
}

// ==============================
// Componente: RecentPayablesTable
// ==============================
function RecentPayablesTable() {
    const mockData: Payable[] = [
        { id: '1', supplier: 'Fornecedor Tech', amount: 1800, dueDate: '2025-04-10', status: 'pending', category: 'TI' },
        { id: '2', supplier: 'Energia Elétrica S/A', amount: 950, dueDate: '2024-04-05', status: 'overdue', category: 'Energia' },
        { id: '3', supplier: 'Aluguel Imobiliária', amount: 3200, dueDate: '2025-04-01', status: 'paid', category: 'Aluguel' },
        { id: '4', supplier: 'Internet Fibra Ltda', amount: 420, dueDate: '2025-04-12', status: 'pending', category: 'Internet' },
        { id: '5', supplier: 'Contabilidade ABC', amount: 1200, dueDate: '2025-04-08', status: 'paid', category: 'Serviços' },
    ];

    const getStatusLabel = (status: Payable['status']) => ({
        pending: 'Pendente',
        paid: 'Pago',
        overdue: 'Atrasado',
    })[status];

    const getStatusColor = (status: Payable['status']) => ({
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
    })[status];

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && status !== 'paid';

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Fornecedor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Categoria
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Vencimento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                            Status
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200">
                    {mockData.map((item) => (
                        <tr
                            key={item.id}
                            className={`hover:bg-gray-50 dark:bg-slate-950 transition-colors ${isOverdue(item.dueDate) ? 'bg-red-50 dark:bg-red-950/40' : ''}`}
                        >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.supplier}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">{item.category}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                }).format(item.amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">
                                {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-sm">
                                <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                                >
                                    {getStatusLabel(item.status)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ==============================
// Dashboard Principal
// ==============================
export function AccountsPayableDashboard() {
    const navigate = useNavigate();

    const [data] = useState({
        total: 7800,
        pending: 5200,
        paid: 2600,
    });

    const [loading] = useState(false);

    useEffect(() => {
        // Futuramente: fetch('/api/payables/summary')
    }, []);

    const paidPercentage = data.total > 0 ? Math.round((data.paid / data.total) * 100) : 0;

    if (loading) {
        return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Carregando...</div>;
    }

    return (
        <div className="space-y-6 w-full">
            {/* Header SaaS */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Contas a pagar</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Gestão de fornecedores, despesas e pagamentos</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/app/fiscal/payables/list')}
                        className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
                    >
                        <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Ver todas
                    </button>
                    <button
                        onClick={() => navigate('/app/fiscal/payables/create')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
                    >
                        <FileText className="w-3.5 h-3.5" strokeWidth={2} />
                        Nova conta
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
                <SummaryCard label="Total a pagar" value={data.total} color="red" />
                <SummaryCard label="Pendentes" value={data.pending} color="yellow" progress={100 - paidPercentage} />
                <SummaryCard label="Pagos" value={data.paid} color="green" progress={paidPercentage} />
            </motion.div>

            {/* Últimas contas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Últimas contas a pagar</h2>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Movimentações recentes</p>
                </div>
                <div className="p-4">
                    <RecentPayablesTable />
                </div>
            </div>
        </div>
    );
}