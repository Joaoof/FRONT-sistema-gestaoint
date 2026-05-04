import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate, useParams } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    Loader2,
    RefreshCw,
    XCircle,
} from 'lucide-react';
import {
    CANCEL_INVOICE,
    GET_INVOICE,
    RESYNC_INVOICE,
} from '../../graphql/queries/invoices';
import { getGraphQLErrorMessages } from '../../utils/getGraphQLErrorMessage';

type InvoiceStatus = 'PENDING' | 'PROCESSING' | 'AUTHORIZED' | 'REJECTED' | 'CANCELED' | 'ERROR';

interface InvoiceItem {
    id: string;
    ordem: number;
    codigo: string;
    descricao: string;
    ncm: string | null;
    cfop: string | null;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorDesconto: number;
    valorTotal: number;
}

interface Invoice {
    id: string;
    type: 'NFE' | 'NFCE' | 'NFSE';
    status: InvoiceStatus;
    ambiente: 'HOMOLOG' | 'PRODUCTION';
    numero: number | null;
    serie: number | null;
    chaveAcesso: string | null;
    protocoloAutorizacao: string | null;
    protocoloCancelamento: string | null;
    motivoCancelamento: string | null;
    dataEmissao: string | null;
    dataAutorizacao: string | null;
    dataCancelamento: string | null;
    recipientName: string;
    recipientDocument: string | null;
    recipientEmail: string | null;
    recipientAddress: string | null;
    recipientCity: string | null;
    recipientUf: string | null;
    recipientZip: string | null;
    naturezaOperacao: string;
    paymentMethod: string | null;
    valorProdutos: number;
    valorDesconto: number;
    valorFrete: number;
    valorTotal: number;
    observacoes: string | null;
    providerName: string | null;
    providerRef: string | null;
    xmlUrl: string | null;
    danfeUrl: string | null;
    errorMessage: string | null;
    errorCode: string | null;
    createdAt: string;
    updatedAt: string;
    items: InvoiceItem[];
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

const currency = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleString('pt-BR') : '—';

export function InvoiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [cancelOpen, setCancelOpen] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);

    const { data, loading, refetch } = useQuery<{ invoice: Invoice }>(GET_INVOICE, {
        variables: { id },
        skip: !id,
        fetchPolicy: 'cache-and-network',
    });

    const [cancelInvoice, { loading: cancelLoading }] = useMutation(CANCEL_INVOICE);
    const [resyncInvoice, { loading: resyncLoading }] = useMutation(RESYNC_INVOICE);

    const inv = data?.invoice;

    const handleCancel = async () => {
        if (!inv || motivo.trim().length < 15) {
            setFeedback('O motivo precisa ter ao menos 15 caracteres.');
            return;
        }
        try {
            await cancelInvoice({ variables: { input: { invoiceId: inv.id, motivo: motivo.trim() } } });
            setCancelOpen(false);
            setMotivo('');
            setFeedback(null);
            await refetch();
        } catch (err) {
            setFeedback(getGraphQLErrorMessages(err)[0] ?? 'Erro ao cancelar.');
        }
    };

    const handleResync = async () => {
        if (!inv) return;
        try {
            await resyncInvoice({ variables: { id: inv.id } });
            await refetch();
        } catch (err) {
            setFeedback(getGraphQLErrorMessages(err)[0] ?? 'Erro ao sincronizar.');
        }
    };

    if (loading && !inv) {
        return (
            <div className="p-8 flex items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando…
            </div>
        );
    }

    if (!inv) {
        return (
            <div className="p-8 text-center text-slate-500">
                Nota não encontrada.{' '}
                <button onClick={() => navigate('/notas')} className="text-indigo-600 underline">
                    Voltar
                </button>
            </div>
        );
    }

    const Icon = STATUS_ICON[inv.status];

    return (
        <div className="space-y-6 w-full max-w-5xl">
            <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-white/[0.04] text-slate-600 dark:text-slate-300"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight">
                        {inv.type} {inv.numero ?? '—'}/{inv.serie ?? '—'}
                    </h1>
                    <p className="text-[12.5px] text-slate-500 dark:text-slate-400">
                        Emitida em {formatDate(inv.dataEmissao ?? inv.createdAt)}
                        {inv.providerName ? ` via ${inv.providerName}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {inv.providerRef && inv.status !== 'CANCELED' && (
                        <button
                            onClick={handleResync}
                            disabled={resyncLoading}
                            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${resyncLoading ? 'animate-spin' : ''}`} />
                            Sincronizar
                        </button>
                    )}
                    {inv.status === 'AUTHORIZED' && (
                        <button
                            onClick={() => setCancelOpen(true)}
                            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-md"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            Cancelar nota
                        </button>
                    )}
                </div>
            </div>

            {feedback && (
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-[12.5px] text-rose-700 dark:text-rose-300">
                    {feedback}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium border ${STATUS_COLOR[inv.status]}`}
                    >
                        <Icon className={`w-3.5 h-3.5 ${inv.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                        {STATUS_LABEL[inv.status]}
                    </span>
                    <span className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {inv.ambiente === 'HOMOLOG' ? 'HOMOLOGAÇÃO (TESTE)' : 'PRODUÇÃO'}
                    </span>
                </div>

                {inv.errorMessage && (
                    <div className="mb-4 p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40">
                        <p className="text-[12.5px] font-medium text-rose-700 dark:text-rose-300">
                            {inv.errorCode ? `[${inv.errorCode}] ` : ''}{inv.errorMessage}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[13px]">
                    <Field label="Chave de acesso" value={inv.chaveAcesso} mono />
                    <Field label="Protocolo" value={inv.protocoloAutorizacao} mono />
                    <Field label="Natureza da operação" value={inv.naturezaOperacao} />
                    <Field label="Pagamento" value={inv.paymentMethod} />
                    <Field label="Autorizada em" value={formatDate(inv.dataAutorizacao)} />
                    <Field label="Cancelada em" value={formatDate(inv.dataCancelamento)} />
                    {inv.motivoCancelamento && (
                        <div className="col-span-2">
                            <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                                Motivo do cancelamento
                            </p>
                            <p className="text-slate-700 dark:text-slate-200">{inv.motivoCancelamento}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                    {inv.danfeUrl && (
                        <a
                            href={inv.danfeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 rounded-md"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Baixar DANFE
                        </a>
                    )}
                    {inv.xmlUrl && (
                        <a
                            href={inv.xmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Baixar XML
                        </a>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-5">
                <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white mb-3">Destinatário</h2>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[13px]">
                    <Field label="Nome / Razão social" value={inv.recipientName} />
                    <Field label="Documento" value={inv.recipientDocument} mono />
                    <Field label="E-mail" value={inv.recipientEmail} />
                    <Field label="Endereço" value={inv.recipientAddress} />
                    <Field label="Cidade / UF" value={inv.recipientCity ? `${inv.recipientCity} / ${inv.recipientUf ?? ''}` : null} />
                    <Field label="CEP" value={inv.recipientZip} mono />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                    <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Itens</h2>
                    <span className="text-[11.5px] text-slate-500 dark:text-slate-400">{inv.items.length} item(ns)</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 uppercase text-[11px] tracking-wide">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-medium">Item</th>
                                <th className="text-left px-4 py-2.5 font-medium">NCM/CFOP</th>
                                <th className="text-right px-4 py-2.5 font-medium">Qtd</th>
                                <th className="text-right px-4 py-2.5 font-medium">Vlr Unit</th>
                                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inv.items.map((item) => (
                                <tr key={item.id} className="border-t border-slate-100 dark:border-white/[0.04]">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900 dark:text-white">{item.descricao}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                            #{item.codigo} · {item.unidade}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[11.5px] text-slate-600 dark:text-slate-300">
                                        {item.ncm ?? '—'} / {item.cfop ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">{Number(item.quantidade).toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{currency(Number(item.valorUnitario))}</td>
                                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{currency(Number(item.valorTotal))}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-50 dark:bg-white/[0.02]">
                            <tr className="border-t border-slate-200 dark:border-white/[0.06]">
                                <td colSpan={4} className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                                    Produtos
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums">{currency(Number(inv.valorProdutos))}</td>
                            </tr>
                            {Number(inv.valorDesconto) > 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                                        Desconto
                                    </td>
                                    <td className="px-4 py-2.5 text-right tabular-nums">- {currency(Number(inv.valorDesconto))}</td>
                                </tr>
                            )}
                            {Number(inv.valorFrete) > 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                                        Frete
                                    </td>
                                    <td className="px-4 py-2.5 text-right tabular-nums">{currency(Number(inv.valorFrete))}</td>
                                </tr>
                            )}
                            <tr className="border-t border-slate-200 dark:border-white/[0.06]">
                                <td colSpan={4} className="px-4 py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                                    Total da nota
                                </td>
                                <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900 dark:text-white">
                                    {currency(Number(inv.valorTotal))}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {cancelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg w-full max-w-md shadow-xl">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-white">Cancelar nota</h2>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-[12.5px] text-slate-600 dark:text-slate-300">
                                Informe um motivo com pelo menos 15 caracteres (exigência da SEFAZ).
                            </p>
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                rows={4}
                                className="w-full p-2.5 border border-slate-200 dark:border-white/15 rounded-md bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="Ex.: erro de digitação no valor unitário do item 1, será emitida nova nota."
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setCancelOpen(false)}
                                    className="h-9 px-4 text-[12.5px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] rounded-md"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelLoading}
                                    className="inline-flex items-center gap-1.5 h-9 px-4 text-[12.5px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md disabled:opacity-50"
                                >
                                    {cancelLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                    Confirmar cancelamento
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
    return (
        <div>
            <p className="text-[11.5px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
            <p className={`text-slate-700 dark:text-slate-200 ${mono ? 'font-mono text-[12px]' : ''}`}>
                {value || '—'}
            </p>
        </div>
    );
}
