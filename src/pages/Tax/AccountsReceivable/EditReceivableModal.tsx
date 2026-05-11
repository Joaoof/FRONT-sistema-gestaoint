import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { UPDATE_ACCOUNT_RECEIVABLE } from '../../../graphql/mutations/accounts';
import { GET_BANKS } from '../../../graphql/queries/banks';
import { PaymentsSection } from '../../../components/payments/PaymentsSection';
import { AccountReceivableData, AccountStatus } from '../../../types/accounts';

interface EditReceivableModalProps {
    receivable: AccountReceivableData;
    onClose: () => void;
    onSaved: () => void;
}

type PaymentMethod = 'PIX' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'BANK_SLIP' | 'CHECK' | 'OTHER';

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    PIX: 'PIX',
    CASH: 'Espécie',
    CREDIT_CARD: 'Cartão de crédito',
    DEBIT_CARD: 'Cartão de débito',
    BANK_TRANSFER: 'Transferência',
    BANK_SLIP: 'Boleto',
    CHECK: 'Cheque',
    OTHER: 'Outro',
};

const ITAU_DEFAULT_METHODS: PaymentMethod[] = ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_SLIP'];

interface BankOption {
    id: string;
    name: string;
    ativo: boolean;
}

function toDateInput(value?: string | null): string {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
}

export function EditReceivableModal({ receivable, onClose, onSaved }: EditReceivableModalProps) {
    const [description, setDescription] = useState(receivable.description);
    const [amount, setAmount] = useState(receivable.amount.toString());
    const [dueDate, setDueDate] = useState(toDateInput(receivable.dueDate));
    const [status, setStatus] = useState<AccountStatus>(receivable.status);
    const [interestRate, setInterestRate] = useState(receivable.interestRate.toString());
    const [notes, setNotes] = useState(receivable.notes ?? '');

    const [paidAt, setPaidAt] = useState<string>(toDateInput(new Date().toISOString()));
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
    const [bankId, setBankId] = useState<string>('');
    const [bankTouched, setBankTouched] = useState(false);

    const wasAlreadyPaid = receivable.status === 'PAID';
    const transitioningToPaid = status === 'PAID' && !wasAlreadyPaid;

    const { data: banksData } = useQuery<{ banks: BankOption[] }>(GET_BANKS, {
        variables: { activeOnly: true },
        skip: !transitioningToPaid,
        fetchPolicy: 'cache-first',
    });

    const banks = banksData?.banks ?? [];
    const itauBank = useMemo(
        () => banks.find((b) => b.name.toLowerCase().includes('itau') || b.name.toLowerCase().includes('itaú')),
        [banks],
    );

    useEffect(() => {
        if (!transitioningToPaid || bankTouched || banks.length === 0) return;
        if (ITAU_DEFAULT_METHODS.includes(paymentMethod) && itauBank) {
            setBankId(itauBank.id);
        } else if (!bankId && banks.length > 0) {
            setBankId(banks[0].id);
        }
    }, [paymentMethod, banks, itauBank, transitioningToPaid, bankTouched, bankId]);

    const [updateAccount, { loading }] = useMutation(UPDATE_ACCOUNT_RECEIVABLE);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (transitioningToPaid && !bankId) {
            toast.error('Selecione um banco antes de marcar como pago.');
            return;
        }

        try {
            const input: Record<string, unknown> = {
                id: receivable.id,
                description,
                amount: parseFloat(amount),
                interestRate: parseFloat(interestRate),
                dueDate: new Date(dueDate).toISOString(),
                status,
                notes: notes || null,
            };

            if (transitioningToPaid) {
                input.paidAt = new Date(paidAt).toISOString();
                input.paymentMethod = paymentMethod;
                input.bankId = bankId;
            }

            await updateAccount({ variables: { input } });
            toast.success(
                transitioningToPaid
                    ? 'Conta marcada como paga e movimentação criada.'
                    : 'Conta atualizada com sucesso',
            );
            onSaved();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao atualizar conta');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Conta a Receber</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Cliente: <span className="font-medium text-slate-700 dark:text-slate-200">{receivable.customer?.name ?? '—'}</span></p>
                </div>

                <div className="mb-4">
                    <PaymentsSection
                        accountType="RECEIVABLE"
                        accountId={receivable.id}
                        amount={receivable.amount}
                        paidAmount={receivable.paidAmount ?? 0}
                        status={receivable.status}
                        onPaid={() => onSaved()}
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Descrição</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Valor (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Vencimento</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                                className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                            >
                                <option value="PENDING">Pendente</option>
                                <option value="PAID">Pago</option>
                                <option value="OVERDUE">Vencido</option>
                                <option value="CANCELED">Cancelado</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Juros diário</label>
                            <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={interestRate}
                                onChange={(e) => setInterestRate(e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                placeholder="0.033 (≈1% ao mês)"
                            />
                        </div>
                    </div>

                    {transitioningToPaid && (
                        <div className="rounded-lg border border-emerald-200 dark:border-emerald-700/50 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-3">
                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                Marcar como pago — vai gerar movimentação automaticamente
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-200 mb-1">Forma de pagamento</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                    >
                                        {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-200 mb-1">Data do pagamento</label>
                                    <input
                                        type="date"
                                        value={paidAt}
                                        onChange={(e) => setPaidAt(e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-slate-200 mb-1">
                                    Banco
                                    {ITAU_DEFAULT_METHODS.includes(paymentMethod) && itauBank && bankId === itauBank.id && !bankTouched && (
                                        <span className="ml-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-normal">(Itaú selecionado automaticamente)</span>
                                    )}
                                </label>
                                <select
                                    value={bankId}
                                    onChange={(e) => { setBankId(e.target.value); setBankTouched(true); }}
                                    className="w-full p-2 text-sm border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                    required
                                >
                                    <option value="">Selecione um banco</option>
                                    {banks.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Observações</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
