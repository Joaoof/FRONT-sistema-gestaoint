import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    DollarSign,
    Save,
    ArrowLeftRight,
    PlusCircle,
    CreditCard,
    Database,
    Banknote,
    Tag,
    TrendingUp,
    TrendingDown,
    Calendar,
    FileText,
    Sparkles,
} from 'lucide-react';
import { apolloClient } from '../lib/apollo-client';
import { CREATE_CASH_MOVEMENT } from '../graphql/mutations/mutations';
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage';
import { getUserIdFromToken } from '../utils/getToken';
import { formatLocalDateTime, parseLocalDateTime } from '../utils/formatDate';
import { GET_CASH_MOVEMENTS } from '../graphql/queries/queries';

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

// Definição dos botões de categoria com cores corporativas
const categoryButtons: {
    type: MovementType;
    label: string;
    icon: React.ElementType;
    group: 'entry' | 'exit';
    color: string;
    description: string;
}[] = [
        { type: 'venda', label: 'Venda', icon: DollarSign, group: 'entry', color: 'emerald', description: 'Receita de vendas' },
        { type: 'troco', label: 'Troco', icon: ArrowLeftRight, group: 'entry', color: 'teal', description: 'Recebimento de troco' },
        { type: 'outros_entrada', label: 'Outros', icon: PlusCircle, group: 'entry', color: 'cyan', description: 'Outras entradas' },
        { type: 'despesa', label: 'Despesa', icon: Banknote, group: 'exit', color: 'red', description: 'Gastos operacionais' },
        { type: 'saque', label: 'Saque', icon: Database, group: 'exit', color: 'orange', description: 'Retirada de caixa' },
        { type: 'pagamento', label: 'Pagamento', icon: CreditCard, group: 'exit', color: 'pink', description: 'Pagamentos diversos' },
    ];

export const CashMovementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [formData, setFormData] = useState({
        type: 'venda' as MovementType,
        value: '',
        description: '',
        date: formatLocalDateTime(new Date()),
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError(null);
    };

    const handleTypeChange = (type: MovementType) => {
        setFormData((prev) => ({
            ...prev,
            type,
        }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const value = parseFloat(formData.value.replace('.', '').replace(',', '.'));

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
                userId: userId,
            };

            const response = await apolloClient.mutate({
                mutation: CREATE_CASH_MOVEMENT,
                variables: { input },
                refetchQueries: [{ query: GET_CASH_MOVEMENTS }],
                awaitRefetchQueries: true
            });

            if (response.errors && response.errors.length > 0) {
                const messages = response.errors.flatMap(({ message, extensions }: any) => {
                    const issues = extensions?.issues;
                    if (Array.isArray(issues)) return issues.map((i: any) => i.message);
                    return [message];
                });

                const deduped = Array.from(new Set(messages));
                deduped.forEach(msg => {
                    const cleanMsg = msg.replace(/,$/, '').trim();
                    toast.error(cleanMsg);
                });

                setError(deduped.join(' • '));
                return;
            }

            const result = response.data?.createCashMovement;

            if (!result || result.success === false) {
                const errorMsg = result?.message || 'Falha ao registrar movimentação.';
                toast.error(errorMsg);
                setError(errorMsg);
                return;
            }

            toast.success('Movimentação registrada com sucesso!');
            setFormData({
                type: 'venda',
                value: '',
                description: '',
                date: formatLocalDateTime(new Date()),
            });

            onSuccess?.();
        } catch (err: any) {
            const messages = getGraphQLErrorMessages(err);
            messages.forEach((msg: any) => toast.error(msg));
            setError(messages.join(' • '));
        } finally {
            setLoading(false);
        }
    };

    const isEntry = movementTypeMap[formData.type] === 'ENTRY';
    const selectedButton = categoryButtons.find(btn => btn.type === formData.type);

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-300 p-10 max-w-4xl mx-auto">
            {/* Header CLÁSSICO */}
            <div className="mb-8 border-b-2 border-gray-300 pb-4">
                <h2 className="text-3xl font-serif font-black text-gray-900 tracking-wider">
                    REGISTRO DE MOVIMENTAÇÃO DE CAIXA
                </h2>
                <div className="flex items-center mt-2">
                    <Tag className="w-5 h-5 text-indigo-700 mr-2" />
                    <p className="text-gray-600 font-medium">Preencha os campos para registrar a transação.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* SEÇÃO DE TIPOS - Estilo TABS/GRUPOS CLÁSSICOS */}
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-700 pl-3">
                        CATEGORIA DA TRANSAÇÃO
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-gray-100 border border-gray-300 rounded-md">
                        {/* ENTRADAS */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-black text-green-700 uppercase border-b border-green-400 pb-2">ENTRADA</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {categoryButtons.filter(b => b.group === 'entry').map((btn) => (
                                    <CategoryButton
                                        key={btn.type}
                                        {...btn}
                                        formData={formData}
                                        handleTypeChange={handleTypeChange}
                                        loading={loading}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* SAÍDAS */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-black text-red-700 uppercase border-b border-red-400 pb-2">SAÍDA</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {categoryButtons.filter(b => b.group === 'exit').map((btn) => (
                                    <CategoryButton
                                        key={btn.type}
                                        {...btn}
                                        formData={formData}
                                        handleTypeChange={handleTypeChange}
                                        loading={loading}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* DESCRIÇÃO DA CATEGORIA ATIVA */}
                {selectedButton && (
                    <div className="p-4 bg-gray-50 border-l-4 border-indigo-500 rounded-md shadow-inner text-sm text-gray-700">
                        <p className="font-semibold">Categoria Selecionada: {selectedButton.label}</p>
                        <p>{selectedButton.description}</p>
                    </div>
                )}


                {/* CAMPOS DE ENTRADA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Valor */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            VALOR (R$) <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                id="value"
                                name="value"
                                value={formData.value}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    if (!rawValue) {
                                        setFormData(prev => ({ ...prev, value: '' }));
                                        return;
                                    }
                                    const valueInCents = parseInt(rawValue, 10);
                                    const formattedValue = (valueInCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                                    setFormData(prev => ({ ...prev, value: formattedValue }));
                                }}
                                required
                                disabled={loading}
                                placeholder="0,00"
                                className={`w-full pl-10 pr-4 py-3 border border-gray-400 text-lg font-mono focus:border-blue-700 focus:ring-0 disabled:bg-gray-100 transition-colors rounded-sm`}
                            />
                        </div>
                    </div>

                    {/* Data e Hora */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            DATA E HORA <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className={`w-full px-4 py-3 border border-gray-400 text-lg focus:border-blue-700 focus:ring-0 disabled:bg-gray-100 transition-colors rounded-sm`}
                        />
                    </div>
                </div>

                {/* Descrição */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        DESCRIÇÃO <span className="text-red-600">*</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        rows={3}
                        className={`w-full p-4 border border-gray-400 focus:border-blue-700 focus:ring-0 disabled:bg-gray-100 transition-colors resize-none rounded-sm`}
                        placeholder="Descreva detalhadamente a movimentação financeira..."
                    />
                </div>

                {/* Botão de Envio */}
                <div className="flex justify-end pt-6 border-t border-gray-300">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center gap-2 px-8 py-3 text-white font-black text-lg uppercase rounded-sm border-2 border-transparent transition-all duration-200 shadow-md
                            ${loading
                                ? 'bg-gray-500 cursor-not-allowed'
                                : isEntry
                                    ? 'bg-green-700 hover:bg-green-800'
                                    : 'bg-red-700 hover:bg-red-800'
                            }
                        `}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                PROCESSANDO...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                REGISTRAR MOVIMENTAÇÃO
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Error Display CLÁSSICO */}
            {error && (
                <div className="mt-8 p-4 bg-red-100 border border-red-500 text-red-800 rounded-sm">
                    <p className="font-black text-sm">ERRO:</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}
        </div>
    );
};

// Componente auxiliar CLÁSSICO para os botões de categoria
interface CategoryButtonProps {
    type: MovementType;
    label: string;
    icon: React.ElementType;
    color: string;
    description: string;
    formData: { type: MovementType };
    handleTypeChange: (type: MovementType) => void;
    loading: boolean;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ type, label, icon: Icon, color, formData, handleTypeChange, loading }) => {
    const isActive = formData.type === type;
    const isEntry = movementTypeMap[type] === 'ENTRY';

    // Cores sólidas e corporativas
    const activeBg = isEntry ? 'bg-green-700' : 'bg-red-700';
    const activeText = 'text-white';

    const inactiveClasses = `bg-white text-gray-700 border-2 border-gray-400 hover:bg-gray-100`;

    return (
        <button
            type="button"
            onClick={() => handleTypeChange(type)}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-3 transition-all duration-100 text-sm font-semibold h-24 whitespace-nowrap overflow-hidden rounded-sm shadow-sm 
                ${isActive ? `${activeBg} ${activeText} border-4 border-gray-900` : inactiveClasses} 
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'}`
            }
        >
            <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-white' : 'text-gray-700'}`} />
            <span className="font-black text-xs uppercase">{label}</span>
        </button>
    );
};