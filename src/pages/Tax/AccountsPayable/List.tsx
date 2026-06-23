import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { FileText, Search, Clock, CheckCircle, AlertTriangle, X, CheckCircle2, LayoutList, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { GET_ACCOUNTS_PAYABLE } from '../../../graphql/queries/accounts';
import { UPDATE_ACCOUNT_PAYABLE } from '../../../graphql/mutations/accounts';
import {
    AccountPayableData,
    AccountStatus,
    formatBRL,
    formatDate,
    STATUS_BADGE,
    STATUS_LABEL,
} from '../../../types/accounts';
import { EditPayableModal } from './EditPayableModal';
import { SnoozeMenu } from '../../../components/snooze/SnoozeMenu';

type StatusFilter = 'all' | AccountStatus;

export function PayablesList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
    const [editing, setEditing] = useState<AccountPayableData | null>(null);
    const [groupBySupplier, setGroupBySupplier] = useState(false);

    const { data, loading, refetch } = useQuery<{ accountsPayable: AccountPayableData[] }>(
        GET_ACCOUNTS_PAYABLE,
        {
            variables: {
                search: searchTerm || undefined,
                status: filterStatus === 'all' ? undefined : filterStatus,
            },
            fetchPolicy: 'cache-and-network',
        },
    );

    const records = data?.accountsPayable ?? [];

    const [markPaid, { loading: paying }] = useMutation(UPDATE_ACCOUNT_PAYABLE, {
        onCompleted: () => {
            toast.success('Pago! 🎉');
            refetch();
        },
        onError: (err) => toast.error(err.message),
    });

    const grouped = useMemo(() => {
        if (!groupBySupplier) return null;
        const map = new Map<string, AccountPayableData[]>();
        for (const r of records) {
            const key = r.supplierName || 'Sem fornecedor';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(r);
        }
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [records, groupBySupplier]);

    const renderStatusIcon = (s: AccountStatus) => {
        if (s === 'PAID') return <CheckCircle className="w-3 h-3 mr-1" />;
        if (s === 'OVERDUE') return <AlertTriangle className="w-3 h-3 mr-1" />;
        if (s === 'CANCELED') return <X className="w-3 h-3 mr-1" />;
        return <Clock className="w-3 h-3 mr-1" />;
    };

    const renderRow = (p: AccountPayableData) => (
        <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${p.daysOverdue > 0 && p.status !== 'PAID' ? 'bg-red-50/60 dark:bg-red-950/40' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.supplierName}</td>
            <td className="px-6 py-4 text-sm text-gray-700 dark:text-slate-200">{p.description}</td>
            <td className="px-6 py-4 text-sm">
                {p.product ? (
                    <button type="button" onClick={() => window.open(`/produtos/${p.product!.id}`, '_blank')} className="text-blue-600 dark:text-blue-400 hover:underline">{p.product.nameProduct}</button>
                ) : (<span className="text-slate-400">—</span>)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-rose-600 dark:text-rose-400 font-semibold tabular-nums">{formatBRL(p.amount)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm tabular-nums">
                {p.interestAccrued > 0 ? (<span className="text-red-600 dark:text-red-400" title={`${p.daysOverdue} dia(s) de atraso`}>+ {formatBRL(p.interestAccrued)}</span>) : (<span className="text-slate-400">—</span>)}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium tabular-nums">
                <span className={p.interestAccrued > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}>{formatBRL(p.finalAmount)}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-200">{formatDate(p.dueDate)}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[p.status]}`}>
                    {renderStatusIcon(p.status)}
                    {STATUS_LABEL[p.status]}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <div className="inline-flex items-center gap-2 justify-end">
                    {p.status !== 'PAID' && p.status !== 'CANCELED' && (
                        <>
                            <button
                                onClick={() => markPaid({ variables: { input: { id: p.id, status: 'PAID' } } })}
                                disabled={paying}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-md bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-50"
                                title="Marcar como paga"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Já paguei
                            </button>
                            <SnoozeMenu accountId={p.id} onSnoozed={refetch} />
                        </>
                    )}
                    <button onClick={() => setEditing(p)} className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-xs">Editar</button>
                </div>
            </td>
        </tr>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight dark:text-white">Contas a Pagar</h1>
                    <p className="text-gray-600 dark:text-slate-300">Lista completa de despesas com fornecedores e juros</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setGroupBySupplier((v) => !v)}
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition ${
                            groupBySupplier
                                ? 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                        title="Agrupar por fornecedor"
                    >
                        {groupBySupplier ? <Layers className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
                        {groupBySupplier ? 'Por fornecedor' : 'Lista'}
                    </button>
                    <button
                        onClick={() => navigate('/fiscal-pagar-criar')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Nova Conta
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar fornecedor ou descrição..."
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Fornecedor</th>
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
                            ) : grouped ? (
                                grouped.flatMap(([supplier, rows]) => {
                                    const totalGroup = rows.reduce((sum, r) => sum + (r.finalAmount ?? r.amount), 0);
                                    return [
                                        <tr key={`group-${supplier}`} className="bg-violet-50 dark:bg-violet-950/30">
                                            <td colSpan={9} className="px-6 py-2 text-sm font-semibold text-violet-900 dark:text-violet-200">
                                                <span className="inline-flex items-center gap-2">
                                                    <Layers className="w-3.5 h-3.5" />
                                                    {supplier} <span className="text-violet-500 font-normal text-xs">({rows.length} conta(s) — total {formatBRL(totalGroup)})</span>
                                                </span>
                                            </td>
                                        </tr>,
                                        ...rows.map(renderRow),
                                    ];
                                })
                            ) : (
                                records.map(renderRow)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {editing && (
                <EditPayableModal
                    payable={editing}
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
