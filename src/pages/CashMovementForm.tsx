import React, { useState } from 'react';
import { toast } from 'sonner';
import { DollarSign, Save, ArrowLeft } from 'lucide-react';
import { apolloClient } from '../lib/apollo-client';
import { CREATE_CASH_MOVEMENT } from '../graphql/mutations/mutations';
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage';
import { getUserIdFromToken } from '../utils/getToken';
import { formatLocalDateTime, parseLocalDateTime } from '../utils/formatDate';
import { GET_CASH_MOVEMENTS } from '../graphql/queries/queries';

const MOVEMENT_OPTIONS = [
    { type: 'venda', label: 'Venda', imagePath: 'https://cdn-icons-png.flaticon.com/512/5607/5607725.png', group: 'entry', description: 'Receita proveniente de vendas diretas.' },
    { type: 'troco', label: 'Troco', imagePath: 'https://cdn-icons-png.flaticon.com/512/1969/1969111.png', group: 'entry', description: 'Recebimento de troco.' },
    { type: 'outros_entrada', label: 'Outras Entradas', imagePath: 'https://cdn-icons-png.flaticon.com/512/7580/7580377.png', group: 'entry', description: 'Receitas não classificadas.' },
    { type: 'despesa', label: 'Despesa', imagePath: 'https://cdn-icons-png.flaticon.com/512/781/781760.png', group: 'exit', description: 'Gastos operacionais ou de manutenção.' },
    { type: 'saque', label: 'Saque', imagePath: 'https://cdn-icons-png.flaticon.com/512/11625/11625164.png', group: 'exit', description: 'Retirada de numerário do caixa.' },
    { type: 'pagamento', label: 'Pagamento', imagePath: 'https://cdn-icons-png.flaticon.com/512/4564/4564998.png', group: 'exit', description: 'Pagamento a fornecedores ou contas.' },
] as const;

type MovementOption = typeof MOVEMENT_OPTIONS[number];
type MovementType = MovementOption['type'];

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

// --- ESTRUTURA DE DADOS (Tipo de Pagamento) ---

const PAYMENT_METHOD_OPTIONS = [
    {
        type: 'CASH',
        label: 'Dinheiro',
        imagePath: 'https://cdn-icons-png.flaticon.com/512/61/61584.png'
    },
    {
        type: 'PIX',
        label: 'PIX',
        imagePath: 'https://img.icons8.com/color/512/pix.png'
    },
    {
        type: 'CREDIT_CARD',
        label: 'Cartão Crédito',
        imagePath: 'https://cdn-icons-png.flaticon.com/512/71/71227.png'
    },
    {
        type: 'DEBIT_CARD',
        label: 'Cartão Débito',
        imagePath: 'https://cdn-icons-png.flaticon.com/512/2040/2040809.png'
    },
    {
        type: 'OTHER',
        label: 'Outros',
        imagePath: 'https://cdn-icons-png.flaticon.com/512/992/992651.png'
    },
] as const;


type PaymentMethodOption = typeof PAYMENT_METHOD_OPTIONS[number];
type PaymentMethodType = PaymentMethodOption['type'];

const paymentMethodMap = {
    CASH: 'CASH',
    PIX: 'PIX',
    CREDIT_CARD: 'CREDIT_CARD',
    DEBIT_CARD: 'DEBIT_CARD',
    OTHER: 'OTHER',
} as const;

// NOVO MAPA: Para obter o label amigável para a descrição
const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
    CASH: 'Dinheiro',
    PIX: 'PIX',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    OTHER: 'Outros Meios',
} as const;


// ----------------------------------------------------------------

export const CashMovementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [formData, setFormData] = useState({
        type: null as MovementType | null,
        paymentMethod: null as PaymentMethodType | null,
        value: '',
        description: '',
        date: formatLocalDateTime(new Date()),
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoBack = () => window.history.back();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type: MovementType) => {
        // Limpa o método de pagamento se a mudança não for uma entrada (ou se quiser limpar sempre)
        const isEntry = MOVEMENT_OPTIONS.find(o => o.type === type)?.group === 'entry';
        setFormData(prev => ({
            ...prev,
            type,
            paymentMethod: isEntry ? prev.paymentMethod : null,
        }));
    };

    const handlePaymentMethodChange = (method: PaymentMethodType) => {
        setFormData(prev => ({ ...prev, paymentMethod: method }));
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

        // VALIDAÇÃO 2: Tipo de pagamento obrigatório para 'venda'
        if (formData.type === 'venda' && !formData.paymentMethod) {
            toast.error('O tipo de pagamento é obrigatório para Vendas.');
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
            // INÍCIO DA CORREÇÃO: Concatenação na descrição
            let finalDescription = formData.description.trim();

            if (formData.paymentMethod) {
                const paymentLabel = PAYMENT_METHOD_LABELS[formData.paymentMethod];
                // Formato da mensagem: [Descrição Original] (Método: [Método Escolhido])
                finalDescription = `${finalDescription} (Método: ${paymentLabel})`;
            }
            // FIM DA CORREÇÃO

            const input = {
                value,
                description: finalDescription, // Usa a descrição com o método de pagamento
                date: parseLocalDateTime(formData.date),
                type: movementTypeMap[formData.type as MovementType],
                category: categoryMap[formData.type as MovementType],
                typePayment: paymentMethodMap[formData.paymentMethod as PaymentMethodType] || null,

            }

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
            // Limpa o formulário
            setFormData({
                type: null,
                paymentMethod: null,
                value: '',
                description: '',
                date: formatLocalDateTime(new Date())
            });
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
                const baseClass = 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:border-white/15 text-gray-700 dark:text-slate-200';
                // As cores precisam estar no seu tailwind.config.js para funcionar corretamente
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

    // CORRIGIDO: Componente para renderizar os botões de Tipo de Pagamento
    const renderPaymentMethodButtons = (options: readonly PaymentMethodOption[]) => (
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
            {options.map(opt => {
                const isSelected = formData.paymentMethod === opt.type;
                const baseClass = 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:border-white/15 text-gray-700 dark:text-slate-200';
                const selectedClass = 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900';
                return (
                    <button
                        key={opt.type}
                        type="button"
                        onClick={() => handlePaymentMethodChange(opt.type)}
                        className={`relative flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all h-20 ${isSelected ? selectedClass : baseClass
                            }`}
                        disabled={loading}
                    >
                        {/* ADICIONADO: Elemento <img> para mostrar o ícone de pagamento */}
                        <img src={opt.imagePath} className="w-6 h-6 mb-1" alt={opt.label} />
                        <span className="mt-1 text-xs font-medium text-center">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
    // NOVO: Verificar se o campo de método de pagamento deve ser exibido
    const selectedMovement = formData.type ? MOVEMENT_OPTIONS.find(o => o.type === formData.type) : null;
    const shouldShowPaymentMethod = selectedMovement && (selectedMovement.group === 'entry' || selectedMovement.type === 'pagamento' || selectedMovement.type === 'despesa');


    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-8">
            {/* Botão Voltar */}
            <div className="mb-6">
                <button
                    type="button"
                    onClick={handleGoBack}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:text-slate-100 hover:bg-gray-100 dark:bg-slate-800 rounded-lg transition-colors"
                    disabled={loading}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Voltar</span>
                </button>
            </div>

            <div className="pb-5 mb-6 border-b border-slate-200 dark:border-white/[0.06]">
                <h2 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">Nova movimentação</h2>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Registre uma entrada ou saída no caixa</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alerta de erro de seleção */}
                {error && error.includes('tipo de movimentação') && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {/* Alerta de erro de tipo de pagamento */}
                {error && error.includes('tipo de pagamento') && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-300 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Entradas */}
                <div>
                    <div className="flex items-center text-lg text-green-700 dark:text-emerald-300 mb-3 font-poppins">
                        <img src="https://cdn-icons-png.flaticon.com/512/4680/4680408.png" alt="Entrada" className="w-6 h-6 mr-2" />
                        <h3>Entrada</h3>
                    </div>
                    {renderMovementButtons(entryOptions, 'green')}
                </div>

                {/* Saídas */}
                <div>
                    <div className="flex items-center text-lg text-red-700 dark:text-red-300 mb-3 font-poppins">
                        <img src="https://cdn-icons-png.flaticon.com/512/1828/1828407.png" alt="Saída" className="w-6 h-6 mr-2" />
                        <h3>Saída</h3>
                    </div>
                    {renderMovementButtons(exitOptions, 'red')}
                </div>

                {/* NOVO: Tipo de Pagamento */}
                {shouldShowPaymentMethod && (
                    <div className='font-poppins'>
                        <div className="flex items-center text-lg text-blue-700 dark:text-blue-300 mb-3">
                            <img src="https://cdn-icons-png.flaticon.com/512/4669/4669019.png" alt="Pagamento" className="w-6 h-6 mr-2" />
                            <h3>Meio de Pagamento {formData.type === 'venda' ? '*' : ''}</h3>
                        </div>
                        {renderPaymentMethodButtons(PAYMENT_METHOD_OPTIONS)}
                    </div>
                )}

                {/* Valor */}
                <div>
                    <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
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
                            className="w-full pl-10 p-3 border border-gray-300 dark:border-white/15 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 dark:bg-slate-950 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* Descrição */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
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
                        className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 dark:bg-slate-950 disabled:cursor-not-allowed"
                        placeholder="Ex: Venda de produtos X, Compra de material..."
                    />
                </div>

                {/* Data e Hora */}
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
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
                        className="w-full p-3 border border-gray-300 dark:border-white/15 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 dark:bg-slate-950 disabled:cursor-not-allowed"
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