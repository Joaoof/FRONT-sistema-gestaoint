import { useState } from 'react';
import { Receivable } from '../../../types';

interface EditReceivableModalProps {
    receivable: Receivable;
    onSave: (updated: Receivable) => void;
    onClose: () => void;
}

export function EditReceivableModal({ receivable, onSave, onClose }: EditReceivableModalProps) {
    const [client, setClient] = useState(receivable.client);
    const [amount, setAmount] = useState(receivable.amount.toString());
    const [dueDate, setDueDate] = useState(receivable.dueDate);
    const [status, setStatus] = useState<Receivable['status']>(receivable.status);
    const [interestRate, setInterestRate] = useState(receivable.interestRate?.toString() || '0.033');
    const [notes, setNotes] = useState(receivable.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...receivable,
            client,
            amount: parseFloat(amount),
            dueDate,
            status,
            interestRate: parseFloat(interestRate),
            notes,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Conta a Receber</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cliente</label>
                        <input
                            type="text"
                            value={client}
                            onChange={(e) => setClient(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Vencimento</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                        >
                            <option value="pending">Pendente</option>
                            <option value="paid">Pago</option>
                            <option value="overdue">Vencido</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Juros diário (%)</label>
                        <input
                            type="number"
                            step="0.001"
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="0.033 (≈1% ao mês)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}