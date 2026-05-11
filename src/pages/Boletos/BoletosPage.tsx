import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Plus, Receipt, Check, X, Copy, ExternalLink, FileText } from 'lucide-react';
import { BOLETOS, CANCEL_BOLETO, ISSUE_BOLETO, MARK_BOLETO_PAID } from '../../graphql/queries/boletos';
import { GET_BANKS } from '../../graphql/queries/banks';

interface Boleto {
    id: string;
    accountReceivableId: string | null;
    bankId: string;
    provider: string;
    nossoNumero: string | null;
    digitableLine: string | null;
    pdfUrl: string | null;
    amount: number;
    dueDate: string;
    status: 'DRAFT' | 'REGISTERED' | 'PAID' | 'CANCELED' | 'EXPIRED' | 'ERROR';
    errorMessage: string | null;
    payerName: string;
    payerDocument: string;
    paidAt: string | null;
    createdAt: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-slate-200 text-slate-700' },
    REGISTERED: { label: 'Registrado', color: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700' },
    CANCELED: { label: 'Cancelado', color: 'bg-slate-200 text-slate-500' },
    EXPIRED: { label: 'Vencido', color: 'bg-rose-100 text-rose-700' },
    ERROR: { label: 'Erro', color: 'bg-rose-200 text-rose-800' },
};

function brl(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function BoletosPage() {
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [showForm, setShowForm] = useState(false);

    const { data, refetch, loading } = useQuery<{ boletos: Boleto[] }>(BOLETOS, {
        variables: { status: filterStatus || null },
        fetchPolicy: 'cache-and-network',
    });
    const [cancelBoleto] = useMutation(CANCEL_BOLETO);
    const [markPaid] = useMutation(MARK_BOLETO_PAID);

    const boletos = data?.boletos ?? [];

    const handleCopyLine = (b: Boleto) => {
        if (!b.digitableLine) return;
        navigator.clipboard.writeText(b.digitableLine);
        toast.success('Linha digitável copiada.');
    };

    const handleCancel = async (b: Boleto) => {
        if (!confirm(`Cancelar boleto de ${b.payerName} (${brl(b.amount)})?`)) return;
        try {
            await cancelBoleto({ variables: { id: b.id } });
            toast.success('Cancelado.');
            refetch();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleMarkPaid = async (b: Boleto) => {
        if (!confirm(`Marcar este boleto como PAGO? ${brl(b.amount)}`)) return;
        try {
            await markPaid({ variables: { id: b.id } });
            toast.success('Marcado como pago. Movimento financeiro criado.');
            refetch();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl">
            <div className="pb-4 border-b border-slate-200 dark:border-white/[0.06] flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-orange-500" />
                        Boletos
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Emita boletos vinculados a uma conta a receber ou avulsos. Pagamento confirma automaticamente o recebimento.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md"
                >
                    <Plus className="w-4 h-4" /> Emitir boleto
                </button>
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Filtrar:</span>
                <button onClick={() => setFilterStatus('')} className={`px-2.5 py-1 text-[12px] rounded ${filterStatus === '' ? 'bg-orange-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>Todos</button>
                {(['REGISTERED', 'PAID', 'CANCELED', 'ERROR'] as const).map((s) => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-2.5 py-1 text-[12px] rounded ${filterStatus === s ? 'bg-orange-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}>
                        {STATUS_META[s].label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                {loading && boletos.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">Carregando…</div>
                ) : boletos.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                        Nenhum boleto encontrado.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-4 py-2 text-left">Pagador</th>
                                <th className="text-left">Nosso nº</th>
                                <th className="text-right">Valor</th>
                                <th className="text-left">Vencimento</th>
                                <th className="text-left">Status</th>
                                <th className="text-left">Provider</th>
                                <th className="text-right pr-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {boletos.map((b) => {
                                const meta = STATUS_META[b.status];
                                const canCancel = b.status === 'REGISTERED' || b.status === 'DRAFT';
                                const canMarkPaid = b.status === 'REGISTERED';
                                return (
                                    <tr key={b.id} className="border-b border-slate-100 dark:border-white/5">
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-slate-900 dark:text-white">{b.payerName}</div>
                                            <div className="text-[10.5px] text-slate-500 font-mono">{b.payerDocument}</div>
                                        </td>
                                        <td className="text-[11.5px] font-mono">{b.nossoNumero ?? '—'}</td>
                                        <td className="text-right tabular-nums font-semibold">{brl(Number(b.amount))}</td>
                                        <td className="text-[12px]">{new Date(b.dueDate).toLocaleDateString('pt-BR')}</td>
                                        <td>
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                                            {b.errorMessage && (
                                                <div className="text-[10px] text-rose-600 mt-0.5 max-w-[200px] truncate" title={b.errorMessage}>{b.errorMessage}</div>
                                            )}
                                        </td>
                                        <td className="text-[10.5px] uppercase tracking-wider text-slate-500">{b.provider}</td>
                                        <td className="text-right pr-4">
                                            <div className="inline-flex gap-2">
                                                {b.digitableLine && (
                                                    <button onClick={() => handleCopyLine(b)} className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-0.5" title="Copiar linha digitável">
                                                        <Copy className="w-3 h-3" /> Linha
                                                    </button>
                                                )}
                                                {b.pdfUrl && (
                                                    <a href={b.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5">
                                                        <ExternalLink className="w-3 h-3" /> PDF
                                                    </a>
                                                )}
                                                {canMarkPaid && (
                                                    <button onClick={() => handleMarkPaid(b)} className="text-[11px] text-emerald-600 hover:underline flex items-center gap-0.5">
                                                        <Check className="w-3 h-3" /> Pago
                                                    </button>
                                                )}
                                                {canCancel && (
                                                    <button onClick={() => handleCancel(b)} className="text-[11px] text-rose-600 hover:underline flex items-center gap-0.5">
                                                        <X className="w-3 h-3" /> Cancelar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <IssueBoletoForm
                    onClose={() => setShowForm(false)}
                    onIssued={() => { setShowForm(false); refetch(); }}
                />
            )}
        </div>
    );
}

function IssueBoletoForm({ onClose, onIssued }: { onClose: () => void; onIssued: () => void }) {
    const [form, setForm] = useState({
        bankId: '',
        accountReceivableId: '',
        provider: '',
        amount: '',
        dueDate: '',
        payerName: '',
        payerDocument: '',
        instructions: '',
    });
    const { data: banksData } = useQuery<{ banks: { id: string; name: string }[] }>(GET_BANKS, {
        variables: { activeOnly: true },
    });
    const [issue, { loading }] = useMutation(ISSUE_BOLETO);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await issue({
                variables: {
                    input: {
                        bankId: form.bankId,
                        accountReceivableId: form.accountReceivableId || undefined,
                        provider: form.provider || undefined,
                        amount: parseFloat(form.amount),
                        dueDate: new Date(form.dueDate).toISOString(),
                        payerName: form.payerName,
                        payerDocument: form.payerDocument,
                        instructions: form.instructions || undefined,
                    },
                },
            });
            toast.success('Boleto emitido com sucesso.');
            onIssued();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-orange-500" /> Emitir boleto
                </h3>
                <form onSubmit={submit} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Banco emissor *</label>
                        <select required value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded">
                            <option value="">Selecione...</option>
                            {banksData?.banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
                            <input required type="number" step="0.01" min="0.01" value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Vencimento *</label>
                            <input required type="date" value={form.dueDate}
                                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome do pagador *</label>
                        <input required value={form.payerName} onChange={(e) => setForm({ ...form, payerName: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">CPF/CNPJ *</label>
                        <input required value={form.payerDocument} onChange={(e) => setForm({ ...form, payerDocument: e.target.value })}
                            placeholder="apenas números"
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Conta a receber vinculada (opcional)</label>
                        <input value={form.accountReceivableId} onChange={(e) => setForm({ ...form, accountReceivableId: e.target.value })}
                            placeholder="UUID — pega na lista de Contas a Receber"
                            className="w-full p-2 font-mono text-xs border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                        <p className="text-[10.5px] text-slate-500 mt-1">Se vincular, pagamento do boleto vai marcar a conta como paga automaticamente.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Provider</label>
                        <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded">
                            <option value="">Padrão (env)</option>
                            <option value="MOCK">MOCK (teste)</option>
                            <option value="ITAU">ITAU (precisa de credenciais)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Instruções (opcional)</label>
                        <textarea rows={2} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                            className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded" />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded text-sm">
                            {loading ? 'Emitindo…' : 'Emitir'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
