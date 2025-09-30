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
        setError(null); // Limpa erro quando usuário digita
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
        <div className="relative overflow-hidden">
            {/* Background animado */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 animate-gradient-xy"></div>

            {/* Elementos decorativos */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/10 to-cyan-500/10 rounded-full blur-3xl"></div>

            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-10 transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
                {/* Header com animação */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30">
                        <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                        Registro de Movimentação
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
                    <p className="text-gray-600 mt-4 text-lg">Gerencie suas movimentações financeiras com elegância</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* SEÇÃO DE TIPOS - Redesenhada */}
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-2 rounded-xl ${isEntry ? 'bg-emerald-100' : 'bg-red-100'} transition-all duration-300`}>
                                {isEntry ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800">Tipo de Movimentação</h3>
                            {selectedButton && (
                                <div className="ml-auto bg-gray-100 px-4 py-2 rounded-full text-sm text-gray-600 font-medium">
                                    {selectedButton.description}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 bg-gradient-to-br from-gray-50/50 to-white/50 rounded-2xl border border-gray-200/50 backdrop-blur-sm">
                            {/* ENTRADAS */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse"></div>
                                    <h4 className="text-lg font-bold text-emerald-700 uppercase tracking-wider">Entradas</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
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
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-pink-500 rounded-full animate-pulse"></div>
                                    <h4 className="text-lg font-bold text-red-700 uppercase tracking-wider">Saídas</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
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

                    {/* CAMPOS DE ENTRADA - Redesenhados */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Valor */}
                        <div className="relative group">
                            <label className="flex items-center gap-2 text-base font-bold text-gray-700 mb-4">
                                <DollarSign className="w-5 h-5 text-blue-500" />
                                Valor (R$)
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                    <div className={`p-2 rounded-lg ${isEntry ? 'bg-emerald-100' : 'bg-red-100'} transition-all duration-300`}>
                                        <DollarSign className={`w-5 h-5 ${isEntry ? 'text-emerald-600' : 'text-red-600'}`} />
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    id="value"
                                    name="value"
                                    value={formData.value}
                                    onFocus={() => setFocusedField('value')}
                                    onBlur={() => setFocusedField(null)}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/\D/g, '');
                                        if (!rawValue) {
                                            setFormData(prev => ({ ...prev, value: '' }));
                                            return;
                                        }
                                        const valueInCents = parseInt(rawValue, 10);
                                        const formattedValue = (valueInCents / 100).toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        });
                                        setFormData(prev => ({ ...prev, value: formattedValue }));
                                    }}
                                    required
                                    disabled={loading}
                                    placeholder="0,00"
                                    className={`w-full pl-16 pr-6 py-6 bg-white border-2 ${focusedField === 'value'
                                            ? isEntry ? 'border-emerald-400 ring-4 ring-emerald-100' : 'border-red-400 ring-4 ring-red-100'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } rounded-2xl text-2xl font-bold font-mono transition-all duration-300 disabled:bg-gray-50 shadow-lg shadow-gray-100 hover:shadow-xl`}
                                />
                                {focusedField === 'value' && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Data e Hora */}
                        <div className="relative group">
                            <label className="flex items-center gap-2 text-base font-bold text-gray-700 mb-4">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                Data e Hora
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    onFocus={() => setFocusedField('date')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                    disabled={loading}
                                    className={`w-full px-6 py-6 bg-white border-2 ${focusedField === 'date'
                                            ? 'border-purple-400 ring-4 ring-purple-100'
                                            : 'border-gray-200 hover:border-gray-300'
                                        } rounded-2xl text-lg font-semibold transition-all duration-300 disabled:bg-gray-50 shadow-lg shadow-gray-100 hover:shadow-xl`}
                                />
                                {focusedField === 'date' && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Descrição */}
                    <div className="relative group">
                        <label className="flex items-center gap-2 text-base font-bold text-gray-700 mb-4">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            Descrição
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('description')}
                                onBlur={() => setFocusedField(null)}
                                required
                                disabled={loading}
                                rows={4}
                                className={`w-full px-6 py-6 bg-white border-2 ${focusedField === 'description'
                                        ? 'border-indigo-400 ring-4 ring-indigo-100'
                                        : 'border-gray-200 hover:border-gray-300'
                                    } rounded-2xl text-lg transition-all duration-300 resize-none disabled:bg-gray-50 shadow-lg shadow-gray-100 hover:shadow-xl`}
                                placeholder="Descreva detalhadamente a movimentação financeira..."
                            />
                            {focusedField === 'description' && (
                                <div className="absolute right-4 top-6">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botão de Envio */}
                    <div className="flex justify-center pt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative flex items-center gap-4 px-12 py-6 text-white font-bold text-xl rounded-3xl shadow-2xl transition-all duration-500 transform hover:scale-105 active:scale-95 overflow-hidden ${loading
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : isEntry
                                        ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 shadow-emerald-500/50 hover:shadow-emerald-600/60'
                                        : 'bg-gradient-to-r from-red-500 via-pink-500 to-red-600 hover:from-red-600 hover:via-pink-600 hover:to-red-700 shadow-red-500/50 hover:shadow-red-600/60'
                                }`}
                        >
                            {/* Efeito de brilho */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                            {loading ? (
                                <>
                                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Processando Movimentação...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                                    <span>Registrar Movimentação</span>
                                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Error Display */}
                {error && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-2xl shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                            <div>
                                <p className="font-bold text-red-800 text-lg">Erro de Validação</p>
                                <p className="text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente auxiliar redesenhado para os botões de categoria
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

const CategoryButton: React.FC<CategoryButtonProps> = ({
    type,
    label,
    icon: Icon,
    color,
    description,
    formData,
    handleTypeChange,
    loading
}) => {
    const isActive = formData.type === type;
    const isEntry = movementTypeMap[type] === 'ENTRY';

    const getColorClasses = () => {
        if (isActive) {
            switch (color) {
                case 'emerald': return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30';
                case 'teal': return 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30';
                case 'cyan': return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30';
                case 'red': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/30';
                case 'orange': return 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30';
                case 'pink': return 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30';
                default: return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30';
            }
        }
        return 'bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300';
    };

    return (
        <button
            type="button"
            onClick={() => handleTypeChange(type)}
            disabled={loading}
            className={`group relative flex items-center gap-4 p-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${getColorClasses()}`}
        >
            {/* Efeito de brilho para botões ativos */}
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            )}

            <div className={`p-3 rounded-xl ${isActive ? 'bg-white/20' : isEntry ? 'bg-emerald-100' : 'bg-red-100'} transition-all duration-300`}>
                <Icon className={`w-6 h-6 ${isActive ? 'text-white' : isEntry ? 'text-emerald-600' : 'text-red-600'}`} />
            </div>

            <div className="flex-1 text-left">
                <div className={`font-bold text-lg ${isActive ? 'text-white' : 'text-gray-800'}`}>{label}</div>
                <div className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{description}</div>
            </div>

            {isActive && (
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse delay-150"></div>
                </div>
            )}
        </button>
    );
};