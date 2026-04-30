import { DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { EditReceivableModal } from './EditReceivableModal';
import { Receivable } from '../../../types';

// ==============================
// Tipos
// ==============================
interface SummaryCardProps {
    label: string;
    value: number;
    color: 'blue' | 'yellow' | 'green';
    progress?: number; // opcional: para mostrar % (ex: nos pendentes)
}


// ==============================
// Componente: SummaryCard (SaaS pattern)
// ==============================
function SummaryCard({ label, value, color, progress }: SummaryCardProps) {
    const tones = {
        blue: {
            accent: 'bg-sky-500',
            iconBg: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
            bar: 'bg-sky-500',
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
                    {color === 'blue' ? <DollarSign className="w-3.5 h-3.5" strokeWidth={2} /> :
                     color === 'yellow' ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} /> :
                     <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />}
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
                    <p className="text-[11px] mt-1.5 text-slate-500 dark:text-slate-400 tabular-nums">{progress}% recebido</p>
                </div>
            )}
        </motion.div>
    );
}

// ==============================
// Componente: ActionButton
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
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
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

function RecentReceivablesTable() {
    const [data, setData] = useState<Receivable[]>([
        { id: '1', client: 'Maria Silva', amount: 1200, dueDate: '2025-04-10', status: 'pending', interestRate: 0.033 },
        { id: '2', client: 'Empresa Tech Ltda', amount: 4500, dueDate: '2024-04-05', status: 'overdue', interestRate: 0.05 },
        { id: '3', client: 'João Oliveira', amount: 2300, dueDate: '2025-04-15', status: 'paid' },
        { id: '4', client: 'Clínica Saúde+', amount: 3100, dueDate: '2025-04-12', status: 'pending', interestRate: 0.033 },
        { id: '5', client: 'Luiza Mendes', amount: 1400, dueDate: '2025-04-08', status: 'paid' },
    ]);

    const [editing, setEditing] = useState<Receivable | null>(null);

    const handleSave = (updated: Receivable) => {
        setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setEditing(null);
    };

    const getStatusLabel = (status: Receivable['status']) => ({
        pending: 'Pendente',
        paid: 'Pago',
        overdue: 'Atrasado',
    })[status];

    const getStatusColor = (status: Receivable['status']) => ({
        pending: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
    })[status];

    // Função: calcular juros compostos por dia de atraso
    const calculateOverdueAmount = (amount: number, dueDate: string, interestRate = 0.033) => {
        const today = new Date();
        const due = new Date(dueDate);
        const daysLate = Math.max(0, Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));

        if (daysLate === 0) return amount;

        // Juros compostos: valor * (1 + taxa)^dias
        return amount * Math.pow(1 + interestRate / 100, daysLate);
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    return (
        <>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Cliente
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Valor Original
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Vencimento
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Valor com Juros
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200">
                        {data.map((item) => {
                            const isOverdue = new Date(item.dueDate) < new Date() && item.status !== 'paid';
                            const finalAmount = isOverdue
                                ? calculateOverdueAmount(item.amount, item.dueDate, item.interestRate)
                                : item.amount;

                            return (
                                <tr key={item.id} className={`hover:bg-gray-50 dark:bg-slate-950 transition-colors ${isOverdue ? 'bg-red-50 dark:bg-red-950/40' : ''}`}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{item.client}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">{formatDate(item.dueDate)}</td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {finalAmount !== item.amount ? (
                                            <span className="text-red-600 dark:text-red-400">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalAmount)}
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}
                                        >
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <button
                                            onClick={() => setEditing(item)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal de Edição */}
            {editing && (
                <EditReceivableModal
                    receivable={editing}
                    onSave={handleSave}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

// ==============================
// Dashboard Principal
// ==============================
export function AccountsReceivableDashboard() {
    const navigate = useNavigate();

    // Dados dinâmicos (futuramente virão do backend)
    const [data] = useState({
        total: 12500,
        pending: 8200,
        paid: 4300,
    });

    // Simulação de carregamento (opcional)
    const [loading] = useState(false);

    useEffect(() => {
        // Aqui você faria: fetch('/api/receivables/summary')
        // setData(response.data);
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
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Contas a receber</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Gestão de recebíveis: clientes, vencimentos e pagamentos</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/app/fiscal/receivables/list')}
                        className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
                    >
                        <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Ver todas
                    </button>
                    <button
                        onClick={() => navigate('/app/fiscal/receivables/create')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
                    >
                        <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
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
                <SummaryCard label="Total a receber" value={data.total} color="blue" />
                <SummaryCard label="Pendentes" value={data.pending} color="yellow" progress={100 - paidPercentage} />
                <SummaryCard label="Recebidos" value={data.paid} color="green" progress={paidPercentage} />
            </motion.div>

            {/* Últimas contas */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Últimas contas cadastradas</h2>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Recebíveis recentes</p>
                </div>
                <div className="p-4">
                    <RecentReceivablesTable />
                </div>
            </div>
        </div>
    );
}