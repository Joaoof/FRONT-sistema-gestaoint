import { DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { EditReceivableModal } from './EditReceivableModal';
import {
    GET_ACCOUNTS_RECEIVABLE,
    GET_ACCOUNTS_RECEIVABLE_SUMMARY,
} from '../../../graphql/queries/accounts';
import {
    AccountReceivableData,
    AccountSummary,
    formatBRL,
    formatDate,
    STATUS_BADGE,
    STATUS_LABEL,
} from '../../../types/accounts';

interface SummaryCardProps {
    label: string;
    value: number;
    color: 'blue' | 'yellow' | 'green';
    progress?: number;
}

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
                    {color === 'blue' ? <DollarSign className="w-3.5 h-3.5" strokeWidth={2} /> : <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />}
                </span>
                <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formatBRL(value)}
            </p>
            {progress !== undefined && (
                <div className="mt-3">
                    <div className="w-full bg-slate-100 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                        <div className={`${t.bar} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[11px] mt-1.5 text-slate-500 dark:text-slate-400 tabular-nums">{progress}% recebido</p>
                </div>
            )}
        </motion.div>
    );
}

function RecentReceivablesTable() {
    const { data, loading, refetch } = useQuery<{ accountsReceivable: AccountReceivableData[] }>(
        GET_ACCOUNTS_RECEIVABLE,
        { fetchPolicy: 'cache-and-network' },
    );
    const [editing, setEditing] = useState<AccountReceivableData | null>(null);

    const records = data?.accountsReceivable ?? [];

    if (loading && records.length === 0) {
        return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Carregando contas...</div>;
    }

    if (records.length === 0) {
        return <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Nenhuma conta cadastrada.</div>;
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-white/[0.06]">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Produto</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Valor original</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Vencimento</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Juros</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total c/ juros</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-white/[0.06]">
                        {records.map((item) => {
                            const isOverdue = item.daysOverdue > 0 && item.status !== 'PAID';
                            return (
                                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${isOverdue ? 'bg-red-50/60 dark:bg-red-950/40' : ''}`}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                        {item.customer?.name ?? '—'}
                                        {item.customer?.document && (
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.customer.document}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">
                                        {item.product ? (
                                            <button
                                                type="button"
                                                onClick={() => window.open(`/produtos/${item.product!.id}`, '_blank')}
                                                className="text-blue-600 dark:text-blue-400 hover:underline"
                                            >
                                                {item.product.nameProduct}
                                            </button>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200 tabular-nums">{formatBRL(item.amount)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-slate-200">{formatDate(item.dueDate)}</td>
                                    <td className="px-4 py-3 text-sm tabular-nums">
                                        {item.interestAccrued > 0 ? (
                                            <span className="text-red-600 dark:text-red-400" title={`${item.daysOverdue} dia(s) de atraso`}>
                                                + {formatBRL(item.interestAccrued)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium tabular-nums">
                                        <span className={item.interestAccrued > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}>
                                            {formatBRL(item.finalAmount)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[item.status]}`}>
                                            {STATUS_LABEL[item.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <button onClick={() => setEditing(item)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-medium">Editar</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {editing && (
                <EditReceivableModal
                    receivable={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        refetch();
                    }}
                />
            )}
        </>
    );
}

export function AccountsReceivableDashboard() {
    const navigate = useNavigate();
    const { data, loading } = useQuery<{ accountsReceivableSummary: AccountSummary }>(
        GET_ACCOUNTS_RECEIVABLE_SUMMARY,
        { fetchPolicy: 'cache-and-network' },
    );

    const summary = data?.accountsReceivableSummary ?? { total: 0, pending: 0, paid: 0, overdue: 0, countTotal: 0 };
    const paidPercentage = summary.total > 0 ? Math.round((summary.paid / summary.total) * 100) : 0;

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Contas a receber</h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Gestão de recebíveis: clientes, vencimentos, juros e produtos vinculados</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => navigate('/listar-contas-receber')}
                        className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md transition-colors"
                    >
                        <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                        Ver todas
                    </button>
                    <button
                        onClick={() => navigate('/fiscal-receber-cria')}
                        className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 rounded-md shadow-sm transition-colors"
                    >
                        <DollarSign className="w-3.5 h-3.5" strokeWidth={2} />
                        Nova conta
                    </button>
                </div>
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                className="grid grid-cols-1 md:grid-cols-4 gap-3"
            >
                <SummaryCard label="Total a receber" value={summary.total} color="blue" />
                <SummaryCard label="Pendentes" value={summary.pending} color="yellow" progress={100 - paidPercentage} />
                <SummaryCard label="Recebidos" value={summary.paid} color="green" progress={paidPercentage} />
                <SummaryCard label="Vencidos" value={summary.overdue} color="yellow" />
            </motion.div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                    <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">Contas cadastradas</h2>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {loading ? 'Carregando...' : `${summary.countTotal} registros`}
                    </p>
                </div>
                <div className="p-4">
                    <RecentReceivablesTable />
                </div>
            </div>
        </div>
    );
}
