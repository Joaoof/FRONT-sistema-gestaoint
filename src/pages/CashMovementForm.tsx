import React, { useState } from 'react';
import { toast } from 'sonner';
import { DollarSign, Save, ArrowLeft } from 'lucide-react';
import { apolloClient } from '../lib/apollo-client';
import { CREATE_CASH_MOVEMENT } from '../graphql/mutations/mutations';
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage';
import { getUserIdFromToken } from '../utils/getToken';
import { formatLocalDateTime, parseLocalDateTime } from '../utils/formatDate';
import { GET_CASH_MOVEMENTS } from '../graphql/queries/queries';

// --- NOVA ESTRUTURA DE DADOS ---

const MOVEMENT_OPTIONS = [
    { type: 'venda', label: 'Venda', imagePath: 'https://cdn-icons-png.flaticon.com/512/5607/5607725.png', group: 'entry', description: 'Receita proveniente de vendas diretas.' },
    { type: 'troco', label: 'Troco', imagePath: 'https://cdn-icons-png.flaticon.com/512/1969/1969111.png', group: 'entry', description: 'Recebimento de troco.' },
    { type: 'outros_entrada', label: 'Outras Entradas', imagePath: 'https://cdn-icons-png.flaticon.com/512/7580/7580377.png', group: 'entry', description: 'Receitas não classificadas.' },
    { type: 'despesa', label: 'Despesa', imagePath: 'https://cdn-icons-png.flaticon.com/512/781/781760.png', group: 'exit', description: 'Gastos operacionais ou de manutenção.' },
    { type: 'saque', label: 'Saque', imagePath: 'https://cdn-icons-png.flaticon.com/512/11625/11625164.png', group: 'exit', description: 'Retirada de numerário do caixa.' },
    { type: 'pagamento', label: 'Pagamento', imagePath: 'https://cdn-icons-png.flaticon.com/512/4564/4564998.png', group: 'exit', description: 'Pagamento a fornecedores ou contas.' },
] as const;

type MovementOption = typeof MOVEMENT_OPTIONS[number];

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

type MovementType = MovementOption['type'];

export const CashMovementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [formData, setFormData] = useState({
        // ALTERAÇÃO 1: Começa como null, sem seleção automática
        type: null as MovementType | null,
        value: '',
        description: '',
        date: formatLocalDateTime(new Date()),
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Função para voltar à página anterior
    const handleGoBack = () => window.history.back();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type: MovementType) => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const value = parseFloat(formData.value);
        const token = localStorage.getItem('accessToken');

        // VALIDAÇÃO 1: Tipo de movimentação
        if (!formData.type) {
            toast.error('Selecione o tipo de movimentação');
            setLoading(false);
            return;
        }

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
            // Agora formData.type é garantido ser MovementType
            const input = {
                value,
                description: formData.description.trim(),
                date: parseLocalDateTime(formData.date),
                type: movementTypeMap[formData.type as MovementType],
                category: categoryMap[formData.type as MovementType],
            };
            const response = await apolloClient.mutate({
                mutation: CREATE_CASH_MOVEMENT,
                variables: { input },
                refetchQueries: [{ query: GET_CASH_MOVEMENTS }],
                awaitRefetchQueries: true,
            });
            if (response.errors?.length) {
                const msgs = response.errors.flatMap(({ message, extensions }: any) =>
                    Array.isArray(extensions?.issues)
                        ? extensions.issues.map((i: any) => i.message)
                        : [message]
                );
                Array.from(new Set(msgs)).forEach(m => toast.error(m.replace(/,$/, '').trim()));
                setError(Array.from(new Set(msgs)).join(' • '));
                return;
            }
            toast.success('Movimentação registrada com sucesso!');
            // Limpa o formulário, mas retorna o tipo para null
            setFormData({ type: null, value: '', description: '', date: formatLocalDateTime(new Date()) });
            onSuccess?.();
        } catch (err: any) {
            const msgs = getGraphQLErrorMessages(err);
            msgs.forEach(m => toast.error(m));
            setError(msgs.join(' • '));
        } finally {
            setLoading(false);
        }
    };

    const entryOptions = MOVEMENT_OPTIONS.filter(o => o.group === 'entry');
    const exitOptions = MOVEMENT_OPTIONS.filter(o => o.group === 'exit');

    const renderMovementButtons = (options: MovementOption[], colorClass: string) => (
        <div className="grid grid-cols-3 gap-4">
            {options.map(opt => {
                // A lógica de seleção funciona com null
                const isSelected = formData.type === opt.type;
                const baseClass = 'border-gray-200 hover:border-gray-300 text-gray-700';
                const selectedClass = `border-${colorClass}-500 bg-${colorClass}-50 text-${colorClass}-900`;
                return (
                    <button
                        key={opt.type}
                        type="button"
                        onClick={() => handleTypeChange(opt.type)}
                        className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all h-28 ${isSelected ? selectedClass : baseClass
                            }`}
                        disabled={loading}
                    >
                        <img src={opt.imagePath} className="w-8 h-8 mb-1" alt={opt.label} />
                        <span className="mt-1 text-sm font-medium text-center">{opt.label}</span>
                        {isSelected && (
                            // A classe de cor deve ser genérica no tailwind.config, ou usar a sintaxe completa
                            <div className={`absolute inset-x-0 bottom-0 w-full h-1 bg-${colorClass}-500 animate-pulse`}></div>
                        )}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {/* Botão Voltar */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={handleGoBack}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Voltar</span>
                </button>
            </div>

            <h2 className="text-2xl font-serif text-gray-900 mb-6">Formulário de Movimentação</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alerta de erro de seleção */}
                {error && error.includes('tipo de movimentação') && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Entradas */}
                <div style={{ fontFamily: 'MS Sans Serif, sans-serif' }}>
                    <div className="flex items-center text-lg text-green-700 mb-3">
                        <img src="https://cdn-icons-png.flaticon.com/512/4680/4680408.png" alt="Entrada" className="w-6 h-6 mr-2" />
                        <h3>Entrada</h3>
                    </div>
                    {renderMovementButtons(entryOptions, 'green')}
                </div>

                {/* Saídas */}
                <div style={{ fontFamily: 'MS Sans Serif, sans-serif' }}>
                    <div className="flex items-center text-lg text-red-700 mb-3">
                        <img src="https://cdn-icons-png.flaticon.com/512/1828/1828407.png" alt="Saída" className="w-6 h-6 mr-2" />
                        <h3>Saída</h3>
                    </div>
                    {renderMovementButtons(exitOptions, 'red')}
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

                {/* Enviar */}
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