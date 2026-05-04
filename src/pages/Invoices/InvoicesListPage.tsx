import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';
import { GET_INVOICES } from '../../graphql/queries/invoices';

type InvoiceType = 'NFE' | 'NFCE' | 'NFSE';
type InvoiceStatus = 'PENDING' | 'PROCESSING' | 'AUTHORIZED' | 'REJECTED' | 'CANCELED' | 'ERROR';
type FiscalEnvironment = 'HOMOLOG' | 'PRODUCTION';

interface Invoice {
    id: string;
    type: InvoiceType;
    status: InvoiceStatus;
    ambiente: FiscalEnvironment;
    numero: number | null;
    serie: number | null;
    chaveAcesso: string | null;
    recipientName: string;
    recipientDocument: string | null;
    valorTotal: number;
    xmlUrl: string | null;
    danfeUrl: string | null;
    errorMessage: string | null;
    providerName: string | null;
    createdAt: string;
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
    PENDING: 'Pendente',
    PROCESSING: 'Processando',
    AUTHORIZED: 'Autorizada',
    REJECTED: 'Rejeitada',
    CANCELED: 'Cancelada',
    ERROR: 'Erro',
};

const STATUS_COLOR: Record<InvoiceStatus, string> = {
    PENDING: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/[0.04] dark:text-slate-300 dark:border-white/[0.06]',
    PROCESSING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40',
    AUTHORIZED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40',
    CANCELED: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-white/[0.04] dark:text-slate-400 dark:border-white/[0.06]',
    ERROR: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40',
};

const STATUS_ICON: Record<InvoiceStatus, React.ComponentType<{ className?: string }>> = {
    PENDING: Clock,
    PROCESSING: Loader2,
    AUTHORIZED: CheckCircle2,
    REJECTED: XCircle,
    CANCELED: XCircle,
    ERROR: AlertTriangle,
};

const TYPE_LABEL: Record<InvoiceType, string> = {
    NFE: 'NFe',
    NFCE: 'NFCe',
    NFSE: 'NFSe',
};

const currency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const formatDate = (s: string) =>
    new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function InvoicesListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [type, setType] = useState<InvoiceType | ''>('');
    const [status, setStatus] = useState<InvoiceStatus | ''>('');

    const variables = useMemo(
        () => ({
            input: {
                search: search || undefined,
                type: type || undefined,
                status: status || undefined,
                take: 100,
                skip: 0,
            },
        }),
        [search, type, status],
    );

    const { data, loading, refetch } = useQuery<{ invoices: Invoice[] }>(GET_INVOICES, {
        variables,
        fetchPolicy: 'cache-and-network',
    });

    const invoices = data?.invoices ?? [];

    const totals = useMemo(() => {
        const authorized = invoices.filter((i) => i.status === 'AUTHORIZED');
        return {
            total: invoices.length,
            authorized: authorized.length,
            authorizedSum: authorized.reduce((acc, i) => acc + Number(i.valorTotal || 0), 0),
            errors: invoices.filter((i) => i.status === 'ERROR' || i.status === 'REJECTED').length,
        };
    }, [invoices]);

    return (
        <div className="space-y-6 w-full">
            <div className="pb-5 border-b border-slate-200 dark:border-white/[0.06] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                        Notas Fiscais
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Emissão de NFe, NFCe e NFSe vinculadas aos pedidos da empresa
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Atualizar
                    </button>
                    <button
                        onClick={() => navigate('/notas/nova')}
                        className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-gradient-to-b from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 rounded-md shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
                        Nova nota
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Total</p>
                    <p className="text-[18px] font-semibold text-slate-900 dark:text-white">{totals.total}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Autorizadas</p>
                    <p className="text-[18px] font-semibold text-emerald-700 dark:text-emerald-400">{totals.authorized}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Faturado</p>
                    <p className="text-[18px] font-semibold text-slate-900 dark:text-white">{currency(totals.authorizedSum)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
                    <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Com problema</p>
                    <p className="text-[18px] font-semibold text-rose-700 dark:text-rose-400">{totals.errors}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por destinatário, documento, chave de acesso…"
                        className="w-full pl-10 pr-4 h-10 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as InvoiceType | '')}
                    className="px-3 h-10 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 text-[12.5px]"
                >
                    <option value="">Todos os tipos</option>
                    <option value="NFE">NFe</option>
                    <option value="NFCE">NFCe</option>
                    <option value="NFSE">NFSe</option>
                </select>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InvoiceStatus | '')}
                    className="px-3 h-10 rounded-md border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-950 text-[12.5px]"
                >
                    <option value="">Todos status</option>
                    {(Object.keys(STATUS_LABEL) as InvoiceStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                {loading && invoices.length === 0 ? (
                    <div className="p-8 flex items-center justify-center text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                        <p className="text-[14px] text-slate-700 dark:text-slate-200 font-medium">Nenhuma nota emitida</p>
                        <p className="text-[12.5px] text-slate-500 dark:text-slate-400 mt-1">
                            Configure os dados fiscais da empresa em <strong>Configurações &gt; Fiscal</strong> e emita sua primeira nota.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px]">
                            <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wide">
                                <tr>
                                    <th className="text-left px-4 py-2.5 font-medium">Tipo / Nº</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Destinatário</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Emissão</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Valor</th>
                                    <th className="text-center px-4 py-2.5 font-medium">Status</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => {
                                    const Icon = STATUS_ICON[inv.status];
                                    return (
                                        <tr
                                            key={inv.id}
                                            className="border-t border-slate-100 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {TYPE_LABEL[inv.type]} {inv.numero ?? '—'}/{inv.serie ?? '—'}
                                                </div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {inv.ambiente === 'HOMOLOG' ? 'Homologação' : 'Produção'}
                                                    {inv.providerName ? ` · ${inv.providerName}` : ''}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-slate-900 dark:text-white">{inv.recipientName}</div>
                                                {inv.recipientDocument && (
                                                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                                        {inv.recipientDocument}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums">
                                                {formatDate(inv.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                                                {currency(Number(inv.valorTotal))}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_COLOR[inv.status]}`}
                                                >
                                                    <Icon className={`w-3 h-3 ${inv.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                                                    {STATUS_LABEL[inv.status]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    {inv.danfeUrl && (
                                                        <a
                                                            href={inv.danfeUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Baixar DANFE"
                                                            className="w-7 h-7 grid place-items-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                                                        >
                                                            <Download className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/notas/${inv.id}`)}
                                                        title="Detalhes"
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
                )}
            </div>
        </div>
    );
}
