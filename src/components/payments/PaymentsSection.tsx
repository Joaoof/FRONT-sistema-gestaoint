import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Plus, Check, Receipt } from 'lucide-react';
import {
    PAYABLE_PAYMENTS,
    RECEIVABLE_PAYMENTS,
    RECORD_PAYABLE_PAYMENT,
    RECORD_RECEIVABLE_PAYMENT,
} from '../../graphql/queries/payments';
import { GET_BANKS } from '../../graphql/queries/banks';

type AccountType = 'RECEIVABLE' | 'PAYABLE';
type PaymentMethod = 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'BANK_SLIP' | 'CHECK' | 'OTHER';

const METHOD_LABELS: Record<PaymentMethod, string> = {
    PIX: 'PIX', CASH: 'Espécie', CREDIT_CARD: 'Cartão Crédito', DEBIT_CARD: 'Cartão Débito',
    BANK_TRANSFER: 'Transferência', BANK_SLIP: 'Boleto', CHECK: 'Cheque', OTHER: 'Outro',
};

interface Receipt {
    id: string;
    amount: number;
    paymentMethod: string;
    bankId: string | null;
    paidAt: string;
    notes: string | null;
}

interface Props {
    accountType: AccountType;
    accountId: string;
    amount: number;
    paidAmount: number;
    status: string;
    /** Chamado quando o saldo muda. Útil pra refetchar o modal pai. */
    onPaid?: (newPaidAmount: number, fullyPaid: boolean) => void;
}

interface BankOption { id: string; name: string; ativo: boolean }

function brl(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function todayInput(): string {
    return new Date().toISOString().slice(0, 10);
}

export function PaymentsSection({ accountType, accountId, amount, paidAmount, status, onPaid }: Props) {
    const isReceivable = accountType === 'RECEIVABLE';
    const QUERY = isReceivable ? RECEIVABLE_PAYMENTS : PAYABLE_PAYMENTS;
    const MUTATION = isReceivable ? RECORD_RECEIVABLE_PAYMENT : RECORD_PAYABLE_PAYMENT;
    const queryVar = isReceivable
        ? { accountReceivableId: accountId }
        : { accountPayableId: accountId };

    const { data, refetch } = useQuery<{ receivablePayments?: Receipt[]; payablePayments?: Receipt[] }>(
        QUERY,
        { variables: queryVar, fetchPolicy: 'cache-and-network' },
    );
    const { data: banksData } = useQuery<{ banks: BankOption[] }>(GET_BANKS, {
        variables: { activeOnly: true },
    });
    const [doPay, { loading }] = useMutation(MUTATION);

    const receipts = (isReceivable ? data?.receivablePayments : data?.payablePayments) ?? [];
    const banks = banksData?.banks ?? [];

    const remaining = useMemo(() => Math.max(0, Number(amount) - Number(paidAmount)), [amount, paidAmount]);
    const isFullyPaid = status === 'PAID' || remaining <= 0.001;
    const isLocked = status === 'CANCELED';

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        paymentMethod: 'PIX' as PaymentMethod,
        bankId: '',
        paidAt: todayInput(),
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(form.amount);
        if (!value || value <= 0) return toast.error('Valor inválido.');
        if (value > remaining + 0.001) return toast.error(`Saldo devedor é ${brl(remaining)}.`);

        try {
            const { data: result } = await doPay({
                variables: {
                    input: {
                        accountId,
                        amount: value,
                        paymentMethod: form.paymentMethod,
                        bankId: form.bankId || null,
                        paidAt: new Date(form.paidAt).toISOString(),
                        notes: form.notes || null,
                    },
                },
            });
            const r = isReceivable ? result?.recordReceivablePayment : result?.recordPayablePayment;
            toast.success(r?.fullyPaid ? 'Conta quitada!' : 'Pagamento registrado.');
            onPaid?.(Number(r?.newPaidAmount ?? 0), Boolean(r?.fullyPaid));
            setShowForm(false);
            setForm({ amount: '', paymentMethod: 'PIX', bankId: '', paidAt: todayInput(), notes: '' });
            refetch();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    return (
        <div className="rounded-lg border border-slate-200 dark:border-white/10 p-4 bg-slate-50 dark:bg-slate-900/40">
            {/* Cabeçalho com totais */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        Pagamentos
                    </span>
                </div>
                {!isFullyPaid && !isLocked && (
                    <button
                        type="button"
                        onClick={() => setShowForm((v) => !v)}
                        className="text-[12px] font-medium text-violet-700 hover:text-violet-900 flex items-center gap-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        {showForm ? 'Cancelar' : 'Novo pagamento'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3 text-[12px]">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded p-2">
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider">Total</div>
                    <div className="font-semibold text-slate-900 dark:text-white tabular-nums">{brl(Number(amount))}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded p-2">
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider">Pago</div>
                    <div className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">{brl(Number(paidAmount))}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded p-2">
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider">Saldo</div>
                    <div className={`font-semibold tabular-nums ${remaining > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}>{brl(remaining)}</div>
                </div>
            </div>

            {/* Form */}
            {showForm && !isFullyPaid && !isLocked && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg p-3 mb-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Valor</label>
                            <input
                                type="number" step="0.01" min="0.01" max={remaining} required
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                placeholder={`Máx: ${brl(remaining)}`}
                                className="w-full p-1.5 text-sm border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Data</label>
                            <input
                                type="date" required
                                value={form.paidAt}
                                onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
                                className="w-full p-1.5 text-sm border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Forma</label>
                            <select
                                value={form.paymentMethod}
                                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as PaymentMethod })}
                                className="w-full p-1.5 text-sm border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                            >
                                {Object.entries(METHOD_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Banco</label>
                            <select
                                value={form.bankId}
                                onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                                className="w-full p-1.5 text-sm border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                            >
                                <option value="">(opcional)</option>
                                {banks.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <input
                        type="text"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        placeholder="Observação (opcional)"
                        className="w-full p-1.5 text-sm border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit" disabled={loading}
                            className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded"
                        >
                            {loading ? 'Salvando…' : 'Registrar pagamento'}
                        </button>
                    </div>
                </form>
            )}

            {/* Histórico */}
            {receipts.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-2">
                    {isFullyPaid && status === 'PAID' ? 'Quitada antes do recurso de pagamentos parciais.' : 'Nenhum pagamento registrado.'}
                </p>
            ) : (
                <ul className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
                    {receipts.map((r) => (
                        <li key={r.id} className="py-1.5 flex items-center justify-between">
                            <div>
                                <div className="font-medium tabular-nums text-slate-900 dark:text-white">
                                    {brl(Number(r.amount))}
                                </div>
                                <div className="text-[10.5px] text-slate-500">
                                    {new Date(r.paidAt).toLocaleDateString('pt-BR')} · {METHOD_LABELS[r.paymentMethod as PaymentMethod] ?? r.paymentMethod}
                                    {r.notes ? ` · ${r.notes}` : ''}
                                </div>
                            </div>
                            <Check className="w-4 h-4 text-emerald-500" />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
