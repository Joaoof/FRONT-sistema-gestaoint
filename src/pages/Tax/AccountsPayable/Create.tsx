import React, { useState } from 'react';
import { FileText, Users, Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { CREATE_TAX_EXPENSE } from '../../../graphql/mutations/tax';
import { apolloClient } from '../../../lib/apollo-client';
import { useFormValidation } from '../../../hooks/useFormValidation'; // ✅ Importe aqui
import { toast } from 'sonner';

type PayableForm = {
    supplier: string;
    value: number;
    description: string;
    dueDate: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
};

export const CreatePayable = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [formData, setFormData] = useState<PayableForm>({
        supplier: '',
        value: 0,
        description: '',
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        status: 'PENDING',
    });

    // ✅ USE O HOOK AQUI
    const { errors, error, loading, setLoading, handleError, clearFieldError, clearAllErrors } =
        useFormValidation();

    const navigate = useNavigate();
    const { user } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'value' ? parseFloat(value) || 0 : value,
        }));

        // Limpa erro do campo ao digitar
        if (errors[name]) {
            clearFieldError(name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearAllErrors();

        if (!user?.id) {
            toast.error('Sessão expirada. Faça login novamente.');
            return;
        }

        setLoading(true);

        try {
            const input = {
                supplier: formData.supplier,
                value: parseFloat(formData.value.toFixed(2)),
                description: formData.description,
                dueDate: new Date(formData.dueDate).toISOString(),
                status: formData.status.toUpperCase(),
            };

            await apolloClient.mutate({
                mutation: CREATE_TAX_EXPENSE,
                variables: { input },
            });

            toast.success('Despesa registrada com sucesso!');
            onSuccess?.();
            navigate('/fiscal-pagar');
        } catch (err: any) {
            // ✅ APENAS UMA LINHA AGORA
            handleError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <button onClick={() => navigate('/fiscal-pagar')} className="mr-4 text-red-600">
                    ← Voltar
                </button>
                <h1 className="text-3xl font-serif font-bold text-gray-900">Nova Conta a Pagar</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 font-open_sans">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {(Object.values(errors).length > 0 || error) && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" />
                            {Object.values(errors).join(' • ') || error || 'Ocorreu um erro ao processar a requisição.'}
                        </div>
                    )}

                    <div>
                        <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
                            Fornecedor *
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                id="supplier"
                                name="supplier"
                                value={formData.supplier}
                                onChange={handleChange}
                                required
                                className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.supplier ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Nome do fornecedor"
                                disabled={loading}
                            />
                        </div>
                        {errors.supplier && (
                            <p className="mt-1 text-xs text-red-500">{errors.supplier}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                            Valor *
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="number"
                                id="value"
                                name="value"
                                value={formData.value || ''}
                                onChange={handleChange}
                                required
                                className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.value ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="0,00"
                                disabled={loading}
                            />
                        </div>
                        {errors.value && (
                            <p className="mt-1 text-xs text-red-500">{errors.value}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={3}
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Ex: Compra de insumos, aluguel..."
                            disabled={loading}
                        />
                    </div>
                    {errors.description && (
                        <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                    )}

                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Vencimento *
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="datetime-local"
                                id="dueDate"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleChange}
                                required
                                className={`w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 ${errors.dueDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                disabled={loading}
                            />
                        </div>
                        {errors.dueDate && (
                            <p className="mt-1 text-xs text-red-500">{errors.dueDate}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                            disabled={loading}
                        >
                            <option value="PENDING">Pendente</option>
                            <option value="PAID">Pago</option>
                            <option value="OVERDUE">Vencido</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                        <div className="text-sm text-gray-500">* Campos obrigatórios</div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all"
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    Salvando...
                                </>
                            ) : (
                                'Registrar Conta'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
