import React, { useState } from 'react';
import { toast } from 'sonner';
import {
    DollarSign,
    Save,
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

// Definição das categorias COM OS NOVOS URLS DE IMAGEM
const categoryOptions: {
    type: MovementType;
    label: string;
    imagePath: string; // <-- Usaremos este caminho para a tag <img>
    group: 'entry' | 'exit';
    description: string;
}[] = [
        { type: 'venda', label: 'Venda', imagePath: 'https://cdn-icons-png.flaticon.com/512/5607/5607725.png', group: 'entry', description: 'Receita proveniente de vendas diretas.' },
        { type: 'troco', label: 'Troco', imagePath: 'https://cdn-icons-png.flaticon.com/512/1969/1969111.png', group: 'entry', description: 'Recebimento de troco.' },
        { type: 'outros_entrada', label: 'Outras Entradas', imagePath: 'https://cdn-icons-png.flaticon.com/512/7580/7580377.png', group: 'entry', description: 'Receitas não classificadas.' },
        { type: 'despesa', label: 'Despesa', imagePath: 'https://cdn-icons-png.flaticon.com/512/781/781760.png', group: 'exit', description: 'Gastos operacionais ou de manutenção.' },
        { type: 'saque', label: 'Saque', imagePath: 'https://cdn-icons-png.flaticon.com/512/11625/11625164.png', group: 'exit', description: 'Retirada de numerário do caixa.' },
        { type: 'pagamento', label: 'Pagamento', imagePath: 'https://cdn-icons-png.flaticon.com/512/4564/4564998.png', group: 'exit', description: 'Pagamento a fornecedores ou contas.' },
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
    const selectedCategory = categoryOptions.find(opt => opt.type === formData.type);

    // Classes de tema corporativo
    const focusClass = `focus:border-blue-800 focus:ring-0`; // Foco azul escuro, cor corporativa
    const buttonBg = isEntry ? 'bg-green-700 hover:bg-green-800' : 'bg-red-700 hover:bg-red-800';

    return (
        <div className="bg-white rounded-lg shadow-xl border border-gray-400 max-w-4xl mx-auto overflow-hidden">

            {/* Header (Barra de Título Simples) */}
            <div className={`p-4 bg-gray-100 border-b border-gray-300 shadow-inner`}>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">
                    REGISTRO DE MOVIMENTAÇÃO DE CAIXA
                </h2>
            </div>

            <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SEÇÃO DE TIPOS - Botões Customizados com Imagens */}
                    <div>
                        <h3 className="text-lg font-black text-gray-800 mb-4 border-l-4 border-blue-700 pl-3 uppercase">
                            CATEGORIA DA TRANSAÇÃO <span className="text-red-600">*</span>
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-gray-100 border border-gray-300 rounded-md">
                            {/* ENTRADAS */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-black text-green-700 uppercase border-b border-green-400 pb-2">ENTRADA</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    {categoryOptions.filter(b => b.group === 'entry').map((btn) => (
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
                                    {categoryOptions.filter(b => b.group === 'exit').map((btn) => (
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

                    {/* Descrição da Categoria Ativa - Painel de Detalhes */}
                    {selectedCategory && (
                        <div className={`p-3 text-sm rounded-sm shadow-inner ${isEntry ? 'bg-green-50 border border-green-300 border-l-4' : 'bg-red-50 border border-red-300 border-l-4'}`}>
                            <p className="font-semibold text-gray-700">Detalhes: {selectedCategory.label}</p>
                            <p className="text-gray-600 italic">{selectedCategory.description}</p>
                        </div>
                    )}

                    {/* VALOR e DATA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        {/* Valor */}
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
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
                                    className={`w-full pl-10 pr-4 py-3 border border-gray-400 text-lg font-mono rounded-sm shadow-sm ${focusClass} disabled:bg-gray-100 transition-colors`}
                                />
                            </div>
                        </div>

                        {/* Data e Hora */}
                        <div className="relative">
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
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
                                className={`w-full px-4 py-3 border border-gray-400 text-lg rounded-sm shadow-sm ${focusClass} disabled:bg-gray-100 transition-colors`}
                            />
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
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
                            className={`w-full p-3 border border-gray-400 rounded-sm shadow-sm ${focusClass} disabled:bg-gray-100 transition-colors resize-none`}
                            placeholder="Descreva detalhadamente a movimentação financeira..."
                        />
                    </div>

                    {/* Botão de Envio */}
                    <div className="flex justify-end pt-6 border-t border-gray-300">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-3 text-white font-black text-base uppercase rounded-sm shadow-md transition-all duration-200 w-full sm:w-auto
                                ${loading
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : buttonBg
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
                    <div className="mt-6 p-4 bg-red-100 border border-red-500 text-red-800 rounded-sm">
                        <p className="font-black text-sm">ERRO:</p>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente auxiliar CategoryButton redesenhado para usar IMAGEM
interface CategoryButtonProps {
    type: MovementType;
    label: string;
    imagePath: string; // <-- Caminho da Imagem
    group: 'entry' | 'exit';
    description: string;
    formData: { type: MovementType };
    handleTypeChange: (type: MovementType) => void;
    loading: boolean;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ type, label, imagePath, formData, handleTypeChange, loading }) => {
    const isActive = formData.type === type;
    const isEntry = movementTypeMap[type] === 'ENTRY';

    // Cores sólidas e corporativas
    const activeBg = isEntry ? 'bg-green-700' : 'bg-red-700';
    const activeBorder = isEntry ? 'border-green-800' : 'border-red-800';

    const inactiveClasses = `bg-white text-gray-700 border-2 border-gray-400 hover:bg-gray-100`;

    return (
        <button
            type="button"
            onClick={() => handleTypeChange(type)}
            disabled={loading}
            // Classes que aplicam a cor de fundo e a borda ao estado ativo
            className={`flex flex-col items-center justify-center p-3 transition-all duration-100 text-sm font-semibold h-24 whitespace-nowrap overflow-hidden rounded-sm shadow-sm 
                ${isActive ? `${activeBg} text-white border-4 ${activeBorder} shadow-lg` : inactiveClasses} 
                ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'}`
            }
        >
            <img
                src={imagePath}
                alt={label}
                className={`w-8 h-8 mb-1 transition-all duration-100 
                    ${isActive ? 'filter invert brightness-200' : 'opacity-70'}` // Inverte a cor da imagem quando ativo
                }
            />
            <span className={`font-black text-xs uppercase ${isActive ? 'text-white' : 'text-gray-700'}`}>{label}</span>
        </button>
    );
};