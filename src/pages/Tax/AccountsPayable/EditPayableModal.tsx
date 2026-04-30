import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { UPDATE_ACCOUNT_PAYABLE } from '../../../graphql/mutations/accounts';
import { AccountPayableData, AccountStatus } from '../../../types/accounts';

interface EditPayableModalProps {
    payable: AccountPayableData;
    onClose: () => void;
    onSaved: () => void;
}

function toDateInput(value?: string | null): string {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
}

export function EditPayableModal({ payable, onClose, onSaved }: EditPayableModalProps) {
    const [supplierName, setSupplierName] = useState(payable.supplierName);
    const [description, setDescription] = useState(payable.description);
    const [amount, setAmount] = useState(payable.amount.toString());
    const [dueDate, setDueDate] = useState(toDateInput(payable.dueDate));
    const [status, setStatus] = useState<AccountStatus>(payable.status);
    const [interestRate, setInterestRate] = useState(payable.interestRate.toString());
    const [notes, setNotes] = useState(payable.notes ?? '');

    const [updateAccount, { loading }] = useMutation(UPDATE_ACCOUNT_PAYABLE);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateAccount({
                variables: {
                    input: {
                        id: payable.id,
                        supplierName,
                        description,
                        amount: parseFloat(amount),
                        interestRate: parseFloat(interestRate),
                        dueDate: new Date(dueDate).toISOString(),
                        status,
                        notes: notes || null,
                    },
                },
            });
            toast.success('Conta a pagar atualizada com sucesso');
            onSaved();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao atualizar conta');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-lg shadow-xl">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editar Conta a Pagar</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">ID: <span className="font-mono">{payable.id.slice(0, 8)}</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">Fornecedor</label>
                        <input
                            type="text"
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                            required
                        />
                    </div>

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
                            />
                        </div>
                    </div>

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
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
