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

// Definição dos botões de categoria
const categoryButtons: {
    type: MovementType;
    label: string;
    icon: React.ElementType;
    group: 'entry' | 'exit';
}[] = [
        { type: 'venda', label: 'Venda', icon: DollarSign, group: 'entry' },
        { type: 'troco', label: 'Troco', icon: ArrowLeftRight, group: 'entry' },
        { type: 'outros_entrada', label: 'Outros', icon: PlusCircle, group: 'entry' },
        { type: 'despesa', label: 'Despesa', icon: Banknote, group: 'exit' },
        { type: 'saque', label: 'Saque', icon: Database, group: 'exit' },
        { type: 'pagamento', label: 'Pagamento', icon: CreditCard, group: 'exit' },
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

        const value = parseFloat(formData.value.replace('.', '').replace(',', '.')); // Garantir parse correto do valor

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
                userId: userId, // Adicionando userId aqui
            };

            const response = await apolloClient.mutate({
                mutation: CREATE_CASH_MOVEMENT,
                variables: { input },
                refetchQueries: [{ query: GET_CASH_MOVEMENTS }],
                awaitRefetchQueries: true
            });

            console.log(response);


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
            // Limpa formulário
            setFormData({
                type: 'venda',
                value: '',
                description: '',
                date: formatLocalDateTime(new Date()),
            });

            onSuccess?.();
        } catch (err: any) {
            console.log('🔴 Erro capturado no catch:', err);
            const messages = getGraphQLErrorMessages(err);
            messages.forEach((msg: any) => toast.error(msg));
            setError(messages.join(' • '));
        }
        finally {
            setLoading(false);
        }
    };

    const isEntry = movementTypeMap[formData.type] === 'ENTRY';
    // Usando cores mais claras para melhor visualização
    const mainColor = isEntry ? 'green' : 'red';
    const iconColor = isEntry ? 'text-emerald-500' : 'text-rose-500';
    const focusRing = isEntry ? 'focus:ring-emerald-200' : 'focus:ring-rose-200';
    const focusBorder = isEntry ? 'focus:border-emerald-500' : 'focus:border-rose-500';

    const buttonGradient = isEntry
        ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/30'
        : 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/30';

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transform transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight border-b pb-4 border-gray-100">
                Registro de Movimentação
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* GRUPO DE SELEÇÃO */}
                <div>
                    <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-indigo-500" />
                        Tipo de Movimentação
                    </h3>
                    <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-xl">
                        {/* ENTRADAS */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-green-700 border-b border-green-300 pb-2">ENTRADA</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {categoryButtons.filter(b => b.group === 'entry').map((btn) => (
                                    <CategoryButton
                                        key={btn.type}
                                        type={btn.type}
                                        label={btn.label}
                                        icon={btn.icon}
                                        formData={formData}
                                        handleTypeChange={handleTypeChange}
                                        loading={loading}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* SAÍDAS */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-red-700 border-b border-red-300 pb-2">SAÍDA</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {categoryButtons.filter(b => b.group === 'exit').map((btn) => (
                                    <CategoryButton
                                        key={btn.type}
                                        type={btn.type}
                                        label={btn.label}
                                        icon={btn.icon}
                                        formData={formData}
                                        handleTypeChange={handleTypeChange}
                                        loading={loading}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


                {/* VALOR E DATA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Valor */}
                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                            Valor (R$) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${iconColor} transition-colors`} />
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
                                className={`w-full pl-10 p-4 border border-gray-300 rounded-xl text-lg font-mono focus:ring-4 ${focusRing} ${focusBorder} disabled:bg-gray-50 disabled:cursor-not-allowed transition-all`}
                            />
                        </div>
                    </div>

                    {/* Data e Hora */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                            Data e Hora <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className={`w-full p-4 border border-gray-300 rounded-xl text-lg ${focusRing} ${focusBorder} disabled:bg-gray-50 disabled:cursor-not-allowed transition-all`}
                        />
                    </div>
                </div>

                {/* Descrição */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        rows={3}
                        className={`w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-200 focus:border-indigo-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all resize-none`}
                        placeholder="Ex: Compra de materiais, venda no PDV..."
                    />
                </div>

                {/* Botão de Envio */}
                <div className="flex justify-center pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center gap-3 px-8 py-4 text-white font-bold text-lg rounded-full shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                            ${loading ?
                                'bg-gray-500 cursor-not-allowed' :
                                buttonGradient
                            }
                        `}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Registrar Movimentação
                            </>
                        )}
                    </button>
                </div>
            </form>
            {error && (
                <div className="mt-6 p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-300">
                    <p className="font-medium">Erro de Validação:</p>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

// Componente auxiliar para os botões de categoria
interface CategoryButtonProps {
    type: MovementType;
    label: string;
    icon: React.ElementType;
    formData: { type: MovementType };
    handleTypeChange: (type: MovementType) => void;
    loading: boolean;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ type, label, icon: Icon, formData, handleTypeChange, loading }) => {
    const isActive = formData.type === type;
    const isEntry = movementTypeMap[type] === 'ENTRY';

    // Paleta mais suave para o estado ativo
    const activeBg = isEntry ? 'bg-emerald-100' : 'bg-rose-100';
    const activeBorder = isEntry ? 'border-emerald-500' : 'border-rose-500';
    const activeText = isEntry ? 'text-emerald-900' : 'text-rose-900';
    const activeRing = isEntry ? 'ring-emerald-200' : 'ring-rose-200';

    // Paleta de inativo mais discreta
    const hoverColor = isEntry ? 'hover:text-emerald-600' : 'hover:text-rose-600';

    const baseClasses = `flex flex-col items-center justify-center p-3 border rounded-xl relative transition-all duration-200 text-sm font-semibold h-24 whitespace-nowrap overflow-hidden transform hover:scale-[1.03]`;

    const inactiveClasses = `bg-white border-gray-300 text-gray-500 hover:bg-gray-50 ${hoverColor} hover:border-gray-400`;

    const activeClasses = `${activeBg} ${activeBorder} ${activeText} ring-2 ${activeRing} shadow-inner shadow-gray-200`; // Sombra interna para profundidade

    return (
        <button
            type="button"
            onClick={() => handleTypeChange(type)}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            disabled={loading}
        >
            <Icon className="w-6 h-6 mb-1" />
            <span>{label}</span>
        </button>
    );
};