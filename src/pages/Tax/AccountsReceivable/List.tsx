import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { DollarSign, Search, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GET_ACCOUNTS_RECEIVABLE } from '../../../graphql/queries/accounts';
import {
    AccountReceivableData,
    AccountStatus,
    formatBRL,
    formatDate,
    STATUS_BADGE,
    STATUS_LABEL,
} from '../../../types/accounts';
import { EditReceivableModal } from './EditReceivableModal';

type StatusFilter = 'all' | AccountStatus;

export function ReceivablesList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
    const [editing, setEditing] = useState<AccountReceivableData | null>(null);

    const { data, loading, refetch } = useQuery<{ accountsReceivable: AccountReceivableData[] }>(
        GET_ACCOUNTS_RECEIVABLE,
        {
            variables: {
                search: searchTerm || undefined,
                status: filterStatus === 'all' ? undefined : filterStatus,
            },
            fetchPolicy: 'cache-and-network',
        },
    );

    const records = data?.accountsReceivable ?? [];

    const renderStatusIcon = (s: AccountStatus) => {
        if (s === 'PAID') return <CheckCircle className="w-3 h-3 mr-1" />;
        if (s === 'OVERDUE') return <AlertTriangle className="w-3 h-3 mr-1" />;
        if (s === 'CANCELED') return <X className="w-3 h-3 mr-1" />;
        return <Clock className="w-3 h-3 mr-1" />;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight dark:text-white">Contas a Receber</h1>
                    <p className="text-gray-600 dark:text-slate-300">Lista completa de recebíveis</p>
                </div>
                <button
                    onClick={() => navigate('/fiscal-receber-cria')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <DollarSign className="w-4 h-4" />
                    Nova Conta
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cliente ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
                        className="p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                    >
                        <option value="all">Todos</option>
                        <option value="PENDING">Pendentes</option>
                        <option value="PAID">Pagos</option>
                        <option value="OVERDUE">Vencidos</option>
                        <option value="CANCELED">Cancelados</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-slate-950">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Produto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Juros</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Vencimento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-white/[0.06]">
                            {loading && records.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-6 text-center text-gray-500 dark:text-slate-400">Carregando...</td></tr>
                            ) : records.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-6 text-center text-gray-500 dark:text-slate-400">Nenhuma conta encontrada.</td></tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${r.daysOverdue > 0 && r.status !== 'PAID' ? 'bg-red-50/60 dark:bg-red-950/40' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {r.customer?.name ?? '—'}
                                            {r.customer?.document && (
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400">{r.customer.document}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-200">{r.description}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {r.product ? (
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(`/produtos/${r.product!.id}`, '_blank')}
                                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {r.product.nameProduct}
                                                </button>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                                            {formatBRL(r.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums">
                                            {r.interestAccrued > 0 ? (
                                                <span className="text-red-600 dark:text-red-400" title={`${r.daysOverdue} dia(s) de atraso`}>+ {formatBRL(r.interestAccrued)}</span>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium tabular-nums">
                                            <span className={r.interestAccrued > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}>
                                                {formatBRL(r.finalAmount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-200">{formatDate(r.dueDate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                                                {renderStatusIcon(r.status)}
                                                {STATUS_LABEL[r.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button onClick={() => setEditing(r)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Editar</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
        </div>
    );
}
