import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    DollarSign,
    XCircle,
    Save,
    ArrowLeftRight,
    PlusCircle,
    CreditCard,
    Database,
    Banknote,
} from 'lucide-react';
import { apolloClient } from '../graphql/client';
import { CREATE_CASH_MOVEMENT } from '../graphql/mutations/mutations';
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage';
import { getUserIdFromToken } from '../utils/getToken';
import { formatLocalDateTime, parseLocalDateTime } from '../utils/formatDate';

// Mapeamento para backend (Prisma/GraphQL)
const movementTypeMap = {
    venda: 'ENTRY',
    troco: 'ENTRY',
    outros_entrada: 'ENTRY',
    despesa: 'EXIT',
    saque: 'EXIT',
    pagamento: 'EXIT',
} as const;

const categoryMap = {
    venda: 'SALE',
    troco: 'CHANGE',
    outros_entrada: 'OTHER_IN',
    despesa: 'EXPENSE',
    saque: 'WITHDRAWAL',
    pagamento: 'PAYMENT',
} as const;

type MovementType = keyof typeof movementTypeMap;

export const CashMovementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [formData, setFormData] = useState({
        type: 'venda' as MovementType,
        value: '',
        description: '',
        date: formatLocalDateTime(new Date()), // ✅ Usa a função
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleTypeChange = (type: MovementType) => {
        setFormData((prev) => ({
            ...prev,
            type,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const value = parseFloat(formData.value);

        const token = localStorage.getItem('accessToken');
        if (!token) {
            toast.error('Sessão expirada. Faça login novamente.');
            setError('Sem autenticação');
            setLoading(false);
            return;
        }

        const userId = getUserIdFromToken();
        if (!userId) {
            toast.error('Usuário inválido. Faça login novamente.');
            setError('ID de usuário não encontrado.');
            setLoading(false);
            return;
        }

        if (!formData.value || isNaN(value) || value <= 0) {
            toast.error('O valor deve ser maior que zero.');
            setLoading(false);
            return;
        }

        if (!formData.description.trim()) {
            toast.error('A descrição é obrigatória.');
            setLoading(false);
            return;
        }

        try {
            const input = {
                value,
                description: formData.description.trim(),
                date: parseLocalDateTime(formData.date),
                type: movementTypeMap[formData.type],
                category: categoryMap[formData.type],
            };

            const response = await apolloClient.mutate({
                mutation: CREATE_CASH_MOVEMENT,
                variables: { input },
            });

            if (response.errors && response.errors.length > 0) {
                const messages = response.errors.flatMap(({ message, extensions }: any) => {
                    const issues = extensions?.issues;
                    if (Array.isArray(issues)) return issues.map((i: any) => i.message);
                    return [message];
                });

                const deduped = Array.from(new Set(messages));

                // ✅ Mostra um toast por erro
                deduped.forEach(msg => {
                    const cleanMsg = msg.replace(/,$/, '').trim();
                    toast.error(cleanMsg);
                });

                setError(deduped.join(' • '));
                return;
            }

            const result = response.data?.createCashMovement.message;

            console.log(result);


            if (!result || result.success === false) {
                const errorMsg = result?.message || 'Falha ao registrar movimentação.';
                toast.error(errorMsg);
                setError(errorMsg);
                return;
            }

            // ✅ Agora sim: sucesso
            toast.success(result || 'Movimentação registrada com sucesso!');
            // Limpa formulário
            setFormData({
                type: 'venda',
                value: '',
                description: '',
                date: new Date().toISOString().slice(0, 16),
            });

            onSuccess?.();
        } catch (err: any) {
            console.log('🔴 Erro capturado no catch:', err); // 🔥 ESSE É O MAIS IMPORTANTE
            const messages = getGraphQLErrorMessages(err);
            messages.forEach((msg: any) => toast.error(msg));
            setError(messages.join(' • '));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-serif text-gray-900 mb-6">Formulário de Movimentação</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Grupo: Entradas */}
                <div>
                    <h3 className="text-lg font-semibold text-green-700 mb-3">💰 Entrada</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => handleTypeChange('venda')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.type === 'venda'
                                ? 'border-green-500 bg-green-50 text-green-900'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            disabled={loading}
                        >
                            <DollarSign className="w-6 h-6" />
                            <span className="mt-1 text-sm font-medium">Venda</span>
                            {formData.type === 'venda' && (
                                <div
                                    className="absolute inset-x-0 bottom-0 w-full h-1 bg-green-500 opacity-100 animate-pulse"
                                ></div>
                            )}
                        </button>

                        <button
                            onClick={() => handleTypeChange('troco')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.type === 'troco'
                                ? 'border-green-500 bg-green-50 text-green-900'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            disabled={loading}
                        >
                            <ArrowLeftRight className="w-6 h-6" />
                            <span className="mt-1 text-sm font-medium">Troco</span>
                            {formData.type === 'troco' && (
                                <div
                                    className="absolute inset-x-0 bottom-0 w-full h-1 bg-green-500 opacity-100 animate-pulse"
                                ></div>
                            )}
                        </button>

                        <button
                            onClick={() => handleTypeChange('outros_entrada')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.type === 'outros_entrada'
                                ? 'border-green-500 bg-green-50 text-green-900'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            disabled={loading}
                        >
                            <PlusCircle className="w-6 h-6" />
                            <span className="mt-1 text-sm font-medium">Outros</span>
                            {formData.type === 'outros_entrada' && (
                                <div
                                    className="absolute inset-x-0 bottom-0 w-full h-1 bg-green-500 opacity-100 animate-pulse"
                                ></div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Grupo: Saídas */}
                <div>
                    <h3 className="text-lg font-semibold text-red-700 mb-3">💸 Saída</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <button
                            onClick={() => handleTypeChange('despesa')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.type === 'despesa'
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            disabled={loading}
                        >
                            <Banknote className="w-6 h-6" />
                            <span className="mt-1 text-sm font-medium">Despesa</span>
                            {formData.type === 'despesa' && (
                                <div
                                    className="absolute inset-x-0 bottom-0 w-full h-1 bg-red-500 opacity-100 animate-pulse"
                                ></div>
                            )}
                        </button>

                        <button
                            onClick={() => handleTypeChange('saque')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.type === 'saque'
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            disabled={loading}
                        >
                            <Database className="w-6 h-6" />
                            <span className="mt-1 text-sm font-medium">Saque</span>
                            {formData.type === 'saque' && (
                                <div
                                    className="absolute inset-x-0 bottom-0 w-full h-1 bg-red-500 opacity-100 animate-pulse"
                                ></div>
                            )}
                        </button>

                        <button
                            onClick={() => handleTypeChange('pagamento')}
                            className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${formData.type === 'pagamento'
                                ? 'border-red-500 bg-red-50 text-red-900'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            disabled={loading}
                        >
                            <CreditCard className="w-6 h-6" />
                            <span className="mt-1 text-sm font-medium">Pagamento</span>
                            {formData.type === 'pagamento' && (
                                <div
                                    className="absolute inset-x-0 bottom-0 w-full h-1 bg-red-500 opacity-100 animate-pulse"
                                ></div>
                            )}
                        </button>
                    </div>
                </div>

                {/* Valor */}
                <div>
                    <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                        Valor (R$) *
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            id="value"
                            name="value"
                            step="0.01"
                            min="0.01"
                            value={formData.value}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="0,00"
                            className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Descrição */}
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
                        disabled={loading}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                        placeholder="Ex: Compra de materiais, venda no PDV..."
                    />
                </div>

                {/* Data e Hora */}
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                        Data e Hora
                    </label>
                    <input
                        type="datetime-local"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                </div>

                {/* Botão de Envio */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-80 disabled:cursor-not-allowed transition"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Registrar Movimentação
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};