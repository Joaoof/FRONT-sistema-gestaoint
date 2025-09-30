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
    FileText,
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
    description: string;
}[] = [
        { type: 'venda', label: 'Venda', icon: DollarSign, group: 'entry', description: 'Receita de vendas.' },
        { type: 'troco', label: 'Troco', icon: ArrowLeftRight, group: 'entry', description: 'Recebimento de troco.' },
        { type: 'outros_entrada', label: 'Outras Entradas', icon: PlusCircle, group: 'entry', description: 'Receitas não classificadas.' },
        { type: 'despesa', label: 'Despesa', icon: Banknote, group: 'exit', description: 'Gastos operacionais.' },
        { type: 'saque', label: 'Saque', icon: Database, group: 'exit', description: 'Retirada de numerário.' },
        { type: 'pagamento', label: 'Pagamento', icon: CreditCard, group: 'exit', description: 'Pagamentos diversos.' },
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
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
            setLoading(false);
            return;
        }

        const userId = getUserIdFromToken();
        if (!userId) {
            toast.error('Usuário inválido. Faça login novamente.');
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
            setFormData(prev => ({
                type: 'venda',
                value: '',
                description: '',
                date: formatLocalDateTime(new Date()),
            }));

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

    // Cores dinâmicas para o tema principal
    const themeColor = isEntry ? 'emerald' : 'red';
    const textColor = isEntry ? 'text-emerald-700' : 'text-red-700';
    const focusClass = `focus:border-${themeColor}-500 focus:ring-1 focus:ring-${themeColor}-200`;

    // Função auxiliar para agrupar opções do select
    const renderSelectOptions = (group: 'entry' | 'exit', label: string) => (
        <optgroup label={label} key={group}>
            {categoryButtons.filter(b => b.group === group).map(btn => (
                <option key={btn.type} value={btn.type}>
                    {btn.label} ({btn.group === 'entry' ? 'Entrada' : 'Saída'})
                </option>
            ))}
        </optgroup>
    );

    return (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-8 max-w-xl mx-auto transition-all duration-300 transform hover:scale-[1.01]">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-3 border-gray-200">
                Novo Registro de Caixa
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* TIPO DE MOVIMENTAÇÃO (Select Simplificado) */}
                <div>
                    <label htmlFor="type" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-indigo-500" />
                        TIPO / CATEGORIA <span className="text-red-600">*</span>
                    </label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        disabled={loading}
                        className={`w-full px-4 py-3 border border-gray-400 text-lg ${focusClass} disabled:bg-gray-100 transition-colors rounded-lg appearance-none`}
                    >
                        {renderSelectOptions('entry', 'ENTRADAS (RECEITAS)')}
                        {renderSelectOptions('exit', 'SAÍDAS (DESPESAS)')}
                    </select>

                    {/* Descrição da Categoria Ativa */}
                    {selectedButton && (
                        <div className={`mt-3 p-3 text-sm rounded-lg border-l-4 ${isEntry ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'}`}>
                            <p className="font-semibold">{selectedButton.label}:</p>
                            <p className="text-gray-600">{selectedButton.description}</p>
                        </div>
                    )}
                </div>

                {/* VALOR e DATA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Valor */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            VALOR (R$) <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                            <DollarSign className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${textColor}`} />
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
                                className={`w-full pl-10 pr-4 py-3 border border-gray-300 text-lg font-mono rounded-lg ${focusClass} disabled:bg-gray-100 transition-colors`}
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
                            className={`w-full px-4 py-3 border border-gray-300 text-lg rounded-lg ${focusClass} disabled:bg-gray-100 transition-colors`}
                        />
                    </div>
                </div>

                {/* Descrição */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-500" />
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
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 disabled:bg-gray-100 transition-colors resize-none`}
                        placeholder="Ex: Venda no PDV, compra de suprimentos..."
                    />
                </div>

                {/* Botão de Envio */}
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`flex items-center gap-3 px-8 py-3 text-white font-black text-lg uppercase rounded-lg transition-all duration-300 shadow-md w-full sm:w-auto transform hover:scale-[1.01] active:scale-95
                            ${loading
                                ? 'bg-gray-500 cursor-not-allowed shadow-gray-400/50'
                                : isEntry
                                    ? 'bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 shadow-emerald-500/50'
                                    : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 shadow-red-500/50'
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

            {/* Error Display */}
            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-300 text-red-800 rounded-lg">
                    <p className="font-bold text-sm">ERRO:</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}
        </div>
    );
};