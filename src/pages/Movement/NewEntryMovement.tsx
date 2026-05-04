import React, { useState } from 'react';
import { DollarSign, Landmark, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_CASH_MOVEMENT } from '../../graphql/queries/queries';
import { GET_BANKS } from '../../graphql/queries/banks';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';

interface BankOption {
    id: string;
    name: string;
    corHex: string;
    ativo: boolean;
}

// ✅ CORREÇÃO 1: Mapeamento correto para a API
const mapTypeToApiFormat = (type: 'venda' | 'troco' | 'outros') => {
    const typeMap = {
        'venda': { type: 'ENTRY', category: 'SALE' },
        'troco': { type: 'ENTRY', category: 'CHANGE' },
        'outros': { type: 'ENTRY', category: 'OTHER' }
    };
    return typeMap[type] || { type: 'ENTRY', category: 'OTHER' };
};

export function NewEntryMovement() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notifySuccess, notifyError } = useNotification();

    const [formData, setFormData] = useState({
        value: 0,
        description: '',
        type: 'venda' as 'venda' | 'troco' | 'outros',
        date: new Date().toISOString().slice(0, 16),
        bankId: '' as string,
    });

    const [error, setError] = useState<string | null>(null);

    const { data: banksData } = useQuery<{ banks: BankOption[] }>(GET_BANKS, {
        variables: { activeOnly: true },
        fetchPolicy: 'cache-and-network',
    });
    const banks = banksData?.banks ?? [];

    // ✅ CORREÇÃO 2: Simplificar refetchQueries para evitar problemas
    const [createMovement, { loading }] = useMutation(CREATE_CASH_MOVEMENT, {
        refetchQueries: [
            'GET_CASH_MOVEMENTS' // ✅ Apenas o nome da query, mais seguro
        ],
        awaitRefetchQueries: true, // ✅ Aguarda o refetch completar
        onError: (error) => {
            console.error('🚨 Erro na mutação CREATE_CASH_MOVEMENT:', error);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // ✅ CORREÇÃO 3: Validações mais robustas
        if (!formData.value || formData.value <= 0) {
            setError('O valor deve ser maior que zero');
            return;
        }

        if (!formData.description.trim()) {
            setError('A descrição é obrigatória');
            return;
        }

        if (!user?.id) {
            notifyError('Sessão expirada. Faça login novamente.');
            // ✅ CORREÇÃO 4: Não navegar imediatamente em caso de erro
            return;
        }

        try {
            console.log('📝 Iniciando criação de movimento...', {
                userId: user.id,
                formData
            });

            // ✅ CORREÇÃO 5: Mapeamento correto dos dados
            const { type, category } = mapTypeToApiFormat(formData.type);

            const result = await createMovement({
                variables: {
                    input: {
                        type: type,
                        category: category,
                        value: formData.value,
                        description: formData.description.trim(),
                        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
                        // ✅ CORREÇÃO 6: Verificar se a API espera user_id ou userId
                        user_id: user.id, // ou userId: user.id - confira na sua API
                        bankId: formData.bankId || null,
                    }
                }
            });

            console.log('✅ Resultado da mutação:', result);

            // ✅ CORREÇÃO 7: Verificação mais robusta de erros
            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors[0]?.message || 'Erro ao registrar entrada.';
                console.error('🚨 GraphQL Errors:', result.errors);
                notifyError(errorMessage);
                setError(errorMessage);
                return; // ✅ Para a execução aqui em caso de erro
            }

            // ✅ CORREÇÃO 8: Verificar se os dados foram realmente criados
            if (!result.data?.createCashMovement) {
                const errorMsg = 'Erro: Movimento não foi criado corretamente';
                console.error(errorMsg);
                notifyError(errorMsg);
                setError(errorMsg);
                return;
            }

            console.log('🎉 Movimento criado com sucesso:', result.data.createCashMovement);

            // ✅ CORREÇÃO 9: Notificar sucesso e aguardar antes de navegar
            notifySuccess('Entrada registrada com sucesso!');

            // ✅ CORREÇÃO 10: Pequeno delay para garantir que tudo foi processado
            setTimeout(() => {
                navigate('/movimentacoes');
            }, 500);

        } catch (err: any) {
            console.error('🚨 Erro completo na criação:', err);

            // ✅ CORREÇÃO 11: Tratamento de erro mais detalhado
            let errorMessage = 'Erro de conexão com o servidor';

            if (err.networkError) {
                errorMessage = 'Erro de rede. Verifique sua conexão.';
            } else if (err.graphQLErrors && err.graphQLErrors.length > 0) {
                errorMessage = err.graphQLErrors[0].message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            notifyError(errorMessage);
            setError(errorMessage);
        }
    };

    // ✅ CORREÇÃO 12: Loading state melhorado
    if (loading) {
        return (
            <div className="space-y-8">
                <div className="flex items-center">
                    <div className="mr-4 p-2">
                        <X className="w-5 h-5 text-gray-400" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Nova Entrada</h1>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-8">
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-slate-300 text-lg">Registrando movimentação...</p>
                        <p className="text-gray-400 text-sm mt-2">Aguarde um momento</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <button
                    onClick={() => {
                        console.log('🔄 Navegando de volta para /movimentacoes');
                        navigate('/movimentacoes');
                    }}
                    className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
                    disabled={loading}
                >
                    <X className="w-5 h-5" />
                </button>
                <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Nova Entrada</h1>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 rounded-lg text-sm">
                            <strong>Erro:</strong> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                            Tipo de Entrada *
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { value: 'venda', label: 'Venda', icon: '💰' },
                                { value: 'troco', label: 'Troco', icon: '🔄' },
                                { value: 'outros', label: 'Outros', icon: '➕' },
                            ].map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    disabled={loading}
                                    onClick={() => setFormData({ ...formData, type: t.value as any })}
                                    className={`p-4 border-2 rounded-lg text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed ${formData.type === t.value
                                        ? 'border-green-500 bg-green-50 dark:bg-emerald-950/40 text-green-900'
                                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:border-white/15'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{t.icon}</div>
                                    <div className="text-sm font-medium">{t.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                            Valor *
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                id="value"
                                step="0.01"
                                min="0.01"
                                value={formData.value || ''} // ✅ Evita valor 0 inicial
                                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                required
                                disabled={loading}
                                className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                            Descrição *
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            rows={3}
                            disabled={loading}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            placeholder="Ex: Venda no PDV, troco de cliente..."
                        />
                    </div>

                    <div>
                        <label htmlFor="bankId" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                            Banco / Conta (opcional)
                        </label>
                        <div className="relative">
                            <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                id="bankId"
                                value={formData.bankId}
                                onChange={(e) => setFormData({ ...formData, bankId: e.target.value })}
                                disabled={loading}
                                className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                <option value="">Sem banco vinculado</option>
                                {banks.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        {banks.length === 0 && (
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                Nenhum banco cadastrado. Cadastre em <strong>Financeiro → Bancos</strong>.
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                            Data e Hora
                        </label>
                        <input
                            type="datetime-local"
                            id="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            disabled={loading}
                            className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-lg focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                        />
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-white/10">
                        <button
                            type="submit"
                            disabled={loading || !formData.description.trim() || !formData.value}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Salvando...
                                </>
                            ) : (
                                'Registrar Entrada'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
