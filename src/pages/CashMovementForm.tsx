import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    Tooltip as ReTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { toast } from 'sonner';
import {
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    Banknote,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    CreditCard,
    Hash,
    Landmark,
    Link2,
    PieChart as PieIcon,
    Receipt,
    Save,
    Sparkles,
    StickyNote,
    User,
    Wallet,
    Zap,
} from 'lucide-react';
import { apolloClient } from '../lib/apollo-client';
import { CREATE_CASH_MOVEMENT } from '../graphql/mutations/mutations';
import { getGraphQLErrorMessages } from '../utils/getGraphQLErrorMessage';
import { getUserIdFromToken } from '../utils/getToken';
import { formatLocalDateTime, parseLocalDateTime } from '../utils/formatDate';
import { GET_CASH_MOVEMENTS } from '../graphql/queries/queries';
import { GET_DASHBOARD_STATS } from '../graphql/queries/dashboard';
import { GET_BANKS } from '../graphql/queries/banks';

// =====================================================================
// CONFIG
// =====================================================================

interface BankOption {
    id: string;
    name: string;
    corHex: string;
    ativo: boolean;
}

const MOVEMENT_OPTIONS = [
    { type: 'venda', label: 'Venda', icon: '💰', group: 'entry', accent: 'emerald', description: 'Receita de vendas diretas' },
    { type: 'troco', label: 'Troco', icon: '🔄', group: 'entry', accent: 'teal', description: 'Devolução de troco' },
    { type: 'outros_entrada', label: 'Outras entradas', icon: '➕', group: 'entry', accent: 'green', description: 'Receitas diversas' },
    { type: 'despesa', label: 'Despesa', icon: '🧾', group: 'exit', accent: 'rose', description: 'Gastos operacionais' },
    { type: 'saque', label: 'Saque', icon: '💵', group: 'exit', accent: 'orange', description: 'Retirada do caixa' },
    { type: 'pagamento', label: 'Pagamento', icon: '💳', group: 'exit', accent: 'red', description: 'Pagamentos a fornecedores' },
] as const;

type MovementOption = typeof MOVEMENT_OPTIONS[number];
type MovementType = MovementOption['type'];

const movementTypeMap = {
    venda: 'ENTRY', troco: 'ENTRY', outros_entrada: 'ENTRY',
    despesa: 'EXIT', saque: 'EXIT', pagamento: 'EXIT',
} as const;

const categoryMap = {
    venda: 'SALE', troco: 'CHANGE', outros_entrada: 'OTHER_IN',
    despesa: 'EXPENSE', saque: 'WITHDRAWAL', pagamento: 'PAYMENT',
} as const;

const PAYMENT_METHODS = [
    { type: 'CASH', label: 'Dinheiro', icon: '💵', color: 'emerald' },
    { type: 'PIX', label: 'PIX', icon: '⚡', color: 'cyan' },
    { type: 'CREDIT_CARD', label: 'Crédito', icon: '💳', color: 'violet' },
    { type: 'DEBIT_CARD', label: 'Débito', icon: '🏦', color: 'blue' },
    { type: 'BANK_TRANSFER', label: 'Transferência', icon: '↔️', color: 'indigo' },
    { type: 'BANK_SLIP', label: 'Boleto', icon: '🧾', color: 'amber' },
    { type: 'CHECK', label: 'Cheque', icon: '✍️', color: 'slate' },
    { type: 'OTHER', label: 'Outros', icon: '📦', color: 'gray' },
] as const;

type PaymentMethodType = typeof PAYMENT_METHODS[number]['type'];

const PAYMENT_LABEL: Record<PaymentMethodType, string> = {
    CASH: 'Dinheiro', PIX: 'PIX', CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito', BANK_TRANSFER: 'Transferência',
    BANK_SLIP: 'Boleto', CHECK: 'Cheque', OTHER: 'Outros',
};

const STATUS_OPTIONS = [
    { value: 'COMPLETED', label: 'Concluída', color: 'emerald', icon: CheckCircle2 },
    { value: 'PENDING', label: 'Pendente', color: 'amber', icon: Clock },
    { value: 'SCHEDULED', label: 'Agendada', color: 'blue', icon: Calendar },
] as const;

type StatusType = typeof STATUS_OPTIONS[number]['value'];

const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500, 1000, 5000];

const fmtBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

// =====================================================================
// SUB-COMPONENTES
// =====================================================================

function AnimatedNumber({ value, prefix = 'R$ ', className = '' }: { value: number; prefix?: string; className?: string }) {
    const [display, setDisplay] = useState(value);
    useEffect(() => {
        let raf = 0;
        const start = display;
        const diff = value - start;
        const startTime = performance.now();
        const duration = 450;
        const tick = (now: number) => {
            const t = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(start + diff * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
    return (
        <span className={className}>
            {prefix}
            {display.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
}

function StepHeader({ step, title, subtitle, done }: { step: number; title: string; subtitle: string; done: boolean }) {
    return (
        <div className="flex items-start gap-3 mb-3">
            <motion.div
                initial={false}
                animate={{
                    backgroundColor: done ? '#10b981' : 'rgba(148,163,184,0.18)',
                    color: done ? '#fff' : '#64748b',
                    scale: done ? [1, 1.15, 1] : 1,
                }}
                transition={{ duration: 0.35 }}
                className="shrink-0 w-7 h-7 rounded-full grid place-items-center text-[12px] font-semibold"
            >
                {done ? <CheckCircle2 className="w-4 h-4" /> : step}
            </motion.div>
            <div>
                <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white leading-tight">{title}</h3>
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}

function FloatingPanel({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-5 shadow-sm"
        >
            {children}
        </motion.div>
    );
}

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const CashMovementForm = ({ onSuccess }: { onSuccess?: () => void }) => {
    const [formData, setFormData] = useState({
        type: null as MovementType | null,
        paymentMethod: null as PaymentMethodType | null,
        value: '',
        description: '',
        date: formatLocalDateTime(new Date()),
        bankId: '' as string,
        status: 'COMPLETED' as StatusType,
        referenceCode: '',
        counterpartyName: '',
        counterpartyDocument: '',
        notes: '',
        attachmentUrl: '',
        dueDate: '',
        paidAt: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // ----- queries para o painel lateral -----
    const { data: banksData } = useQuery<{ banks: BankOption[] }>(GET_BANKS, {
        variables: { activeOnly: true },
        fetchPolicy: 'cache-and-network',
    });
    const banks = banksData?.banks ?? [];

    const { data: dashboardData } = useQuery(GET_DASHBOARD_STATS, {
        fetchPolicy: 'cache-and-network',
    });
    const dash = dashboardData?.dashboardStats ?? {
        todayEntries: 0,
        todayExits: 0,
        todayBalance: 0,
        monthlyTotal: 0,
    };

    const { data: recentMovesData } = useQuery(GET_CASH_MOVEMENTS, {
        fetchPolicy: 'cache-and-network',
    });
    const recentMoves = recentMovesData?.cashMovements ?? [];

    // ----- derived state -----
    const selectedMovement = useMemo(
        () => (formData.type ? MOVEMENT_OPTIONS.find((o) => o.type === formData.type) : null),
        [formData.type],
    );
    const isEntry = selectedMovement?.group === 'entry';
    const numericValue = parseFloat(formData.value) || 0;

    const projectedBalance = useMemo(() => {
        const baseBalance = Number(dash.todayBalance ?? 0);
        if (!isEntry && !selectedMovement) return baseBalance;
        return isEntry ? baseBalance + numericValue : baseBalance - numericValue;
    }, [dash.todayBalance, isEntry, numericValue, selectedMovement]);

    // donut: minha movimentação vs movimentações do dia
    const donutData = useMemo(() => {
        const entries = Number(dash.todayEntries ?? 0);
        const exits = Number(dash.todayExits ?? 0);
        const projectedEntry = isEntry ? numericValue : 0;
        const projectedExit = !isEntry && selectedMovement ? numericValue : 0;
        return [
            { name: 'Entradas hoje', value: entries, color: '#10b981' },
            { name: 'Saídas hoje', value: exits, color: '#ef4444' },
            { name: 'Esta movimentação', value: numericValue, color: isEntry ? '#34d399' : '#f87171' },
        ].filter((d) => d.value > 0).map((d) => ({
            ...d,
            isProjection: d.name === 'Esta movimentação' && (projectedEntry > 0 || projectedExit > 0),
        }));
    }, [dash, isEntry, numericValue, selectedMovement]);

    // sparkline com últimas 10 movimentações
    const sparklineData = useMemo(() => {
        const last = recentMoves.slice(0, 10).map((m: any, i: number) => ({
            i,
            value: m.type === 'ENTRY' ? Number(m.value) : -Number(m.value),
        }));
        return last.reverse();
    }, [recentMoves]);

    // progress steps
    const stepsDone = {
        type: !!formData.type,
        amount: numericValue > 0,
        description: formData.description.trim().length > 0,
    };
    const completedSteps = Object.values(stepsDone).filter(Boolean).length;
    const totalSteps = 3;
    const progress = (completedSteps / totalSteps) * 100;

    // ----- handlers -----
    const handleGoBack = () => window.history.back();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type: MovementType) => {
        const isEntryType = MOVEMENT_OPTIONS.find((o) => o.type === type)?.group === 'entry';
        setFormData((prev) => ({
            ...prev,
            type,
            paymentMethod: isEntryType ? prev.paymentMethod : prev.paymentMethod,
        }));
    };

    const handleQuickAmount = (amount: number) => {
        setFormData((prev) => ({ ...prev, value: String(amount) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.type) { toast.error('Selecione o tipo de movimentação'); return; }
        if (numericValue <= 0) { toast.error('O valor deve ser maior que zero'); return; }
        if (!formData.description.trim()) { toast.error('A descrição é obrigatória'); return; }

        const token = localStorage.getItem('accessToken');
        if (!token) { toast.error('Sessão expirada. Faça login novamente.'); return; }
        const userId = getUserIdFromToken();
        if (!userId) { toast.error('Usuário inválido. Faça login novamente.'); return; }

        if (formData.type === 'venda' && !formData.paymentMethod) {
            toast.error('Selecione o meio de pagamento para vendas');
            return;
        }

        setLoading(true);
        try {
            let finalDescription = formData.description.trim();
            if (formData.paymentMethod) {
                finalDescription = `${finalDescription} (${PAYMENT_LABEL[formData.paymentMethod]})`;
            }

            const input: Record<string, any> = {
                value: numericValue,
                description: finalDescription,
                date: parseLocalDateTime(formData.date),
                type: movementTypeMap[formData.type],
                category: categoryMap[formData.type],
                typePayment: formData.paymentMethod ?? null,
                status: formData.status,
                bankId: formData.bankId || null,
                referenceCode: formData.referenceCode.trim() || null,
                counterpartyName: formData.counterpartyName.trim() || null,
                counterpartyDocument: formData.counterpartyDocument.trim() || null,
                notes: formData.notes.trim() || null,
                attachmentUrl: formData.attachmentUrl.trim() || null,
                dueDate: formData.dueDate ? parseLocalDateTime(formData.dueDate) : null,
                paidAt: formData.paidAt ? parseLocalDateTime(formData.paidAt) : null,
            };

            const response = await apolloClient.mutate({
                mutation: CREATE_CASH_MOVEMENT,
                variables: { input },
                refetchQueries: [{ query: GET_CASH_MOVEMENTS }, { query: GET_DASHBOARD_STATS }],
                awaitRefetchQueries: true,
            });

            if (response.errors?.length) {
                const msgs = response.errors.flatMap(({ message, extensions }: any) =>
                    Array.isArray(extensions?.issues) ? extensions.issues.map((i: any) => i.message) : [message],
                );
                Array.from(new Set(msgs)).forEach((m) => toast.error(String(m).replace(/,$/, '').trim()));
                setError(Array.from(new Set(msgs)).join(' • '));
                return;
            }

            toast.success(`${isEntry ? '🟢 Entrada' : '🔴 Saída'} de ${fmtBRL(numericValue)} registrada!`);
            setFormData({
                type: null,
                paymentMethod: null,
                value: '',
                description: '',
                date: formatLocalDateTime(new Date()),
                bankId: '',
                status: 'COMPLETED',
                referenceCode: '',
                counterpartyName: '',
                counterpartyDocument: '',
                notes: '',
                attachmentUrl: '',
                dueDate: '',
                paidAt: '',
            });
            setShowAdvanced(false);
            onSuccess?.();
        } catch (err: any) {
            const msgs = getGraphQLErrorMessages(err);
            msgs.forEach((m) => toast.error(m));
            setError(msgs.join(' • '));
        } finally {
            setLoading(false);
        }
    };

    const entryOptions = MOVEMENT_OPTIONS.filter((o) => o.group === 'entry');
    const exitOptions = MOVEMENT_OPTIONS.filter((o) => o.group === 'exit');

    const accent = isEntry ? 'emerald' : selectedMovement ? 'rose' : 'violet';
    const accentMap: Record<string, { bg: string; text: string; ring: string; gradient: string }> = {
        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500', gradient: 'from-emerald-500 to-teal-600' },
        rose: { bg: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', ring: 'ring-rose-500', gradient: 'from-rose-500 to-red-600' },
        violet: { bg: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500', gradient: 'from-violet-500 to-indigo-600' },
    };
    const ac = accentMap[accent];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 -mx-4 sm:-mx-6 lg:-mx-8 -my-6 lg:-my-8 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
                <button
                    type="button"
                    onClick={handleGoBack}
                    className="flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06] rounded-lg transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    <span>Lançamento inteligente</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
                {/* ============= COLUNA ESQUERDA: FORMULÁRIO ============= */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* HERO */}
                    <FloatingPanel>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-[26px] font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
                                    Nova movimentação
                                </h1>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                                    Registre uma entrada ou saída no caixa com todos os detalhes
                                </p>
                            </div>
                            <motion.div
                                animate={{ scale: completedSteps === totalSteps ? [1, 1.1, 1] : 1 }}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border ${
                                    completedSteps === totalSteps
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'
                                        : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.06]'
                                }`}
                            >
                                {completedSteps}/{totalSteps} passos
                            </motion.div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-4 h-1.5 bg-slate-200/70 dark:bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                                initial={false}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className={`h-full bg-gradient-to-r ${ac.gradient} rounded-full`}
                            />
                        </div>
                    </FloatingPanel>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 rounded-lg text-[13px]"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* STEP 1: Tipo */}
                    <FloatingPanel delay={0.05}>
                        <StepHeader
                            step={1}
                            title="Tipo de movimentação"
                            subtitle="Escolha entre entrada ou saída e a categoria"
                            done={stepsDone.type}
                        />

                        <div className="mt-4 space-y-4">
                            {/* Entradas */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Entrada</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {entryOptions.map((opt) => {
                                        const selected = formData.type === opt.type;
                                        return (
                                            <motion.button
                                                key={opt.type}
                                                type="button"
                                                onClick={() => handleTypeChange(opt.type)}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.97 }}
                                                disabled={loading}
                                                className={`relative p-3 rounded-lg border-2 text-left transition-all overflow-hidden ${
                                                    selected
                                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                                                        : 'border-slate-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-700/40 bg-white dark:bg-slate-900'
                                                }`}
                                            >
                                                {selected && (
                                                    <motion.div
                                                        layoutId="active-glow"
                                                        className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
                                                    />
                                                )}
                                                <div className="relative">
                                                    <div className="text-2xl mb-1">{opt.icon}</div>
                                                    <div className="text-[12.5px] font-medium text-slate-900 dark:text-white">{opt.label}</div>
                                                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight line-clamp-2">{opt.description}</div>
                                                </div>
                                                {selected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute top-2 right-2"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Saídas */}
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                                    <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">Saída</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {exitOptions.map((opt) => {
                                        const selected = formData.type === opt.type;
                                        return (
                                            <motion.button
                                                key={opt.type}
                                                type="button"
                                                onClick={() => handleTypeChange(opt.type)}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.97 }}
                                                disabled={loading}
                                                className={`relative p-3 rounded-lg border-2 text-left transition-all overflow-hidden ${
                                                    selected
                                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                                                        : 'border-slate-200 dark:border-white/[0.08] hover:border-rose-300 dark:hover:border-rose-700/40 bg-white dark:bg-slate-900'
                                                }`}
                                            >
                                                {selected && (
                                                    <motion.div
                                                        layoutId="active-glow"
                                                        className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-red-500/10"
                                                    />
                                                )}
                                                <div className="relative">
                                                    <div className="text-2xl mb-1">{opt.icon}</div>
                                                    <div className="text-[12.5px] font-medium text-slate-900 dark:text-white">{opt.label}</div>
                                                    <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight line-clamp-2">{opt.description}</div>
                                                </div>
                                                {selected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute top-2 right-2"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 text-rose-500" />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </FloatingPanel>

                    {/* STEP 2: Valor + Pagamento */}
                    <FloatingPanel delay={0.1}>
                        <StepHeader
                            step={2}
                            title="Valor e meio de pagamento"
                            subtitle="Quanto e como o dinheiro entrou ou saiu"
                            done={stepsDone.amount}
                        />

                        {/* Valor grande */}
                        <div className="mt-4">
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[15px] font-semibold pointer-events-none">
                                    R$
                                </div>
                                <input
                                    type="number"
                                    name="value"
                                    step="0.01"
                                    min="0"
                                    value={formData.value}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="0,00"
                                    className={`w-full pl-12 pr-4 py-5 text-[28px] font-mono font-semibold tabular-nums tracking-tight rounded-xl border-2 transition-all ${ac.text} ${
                                        numericValue > 0
                                            ? `border-current bg-white dark:bg-slate-950`
                                            : 'border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950/60'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${ac.ring}`}
                                />
                            </div>

                            {/* Quick amounts */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {QUICK_AMOUNTS.map((amount) => (
                                    <motion.button
                                        key={amount}
                                        type="button"
                                        onClick={() => handleQuickAmount(amount)}
                                        whileTap={{ scale: 0.92 }}
                                        className={`px-3 h-7 rounded-full text-[11.5px] font-medium border transition-colors ${
                                            numericValue === amount
                                                ? `bg-gradient-to-r ${ac.gradient} text-white border-transparent`
                                                : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        {fmtBRL(amount).replace(',00', '')}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Pagamento */}
                        <div className="mt-5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    Meio de pagamento
                                    {formData.type === 'venda' && <span className="text-rose-500">*</span>}
                                </label>
                                {formData.paymentMethod && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData((p) => ({ ...p, paymentMethod: null }))}
                                        className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    >
                                        Limpar
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                                {PAYMENT_METHODS.map((pm) => {
                                    const selected = formData.paymentMethod === pm.type;
                                    return (
                                        <motion.button
                                            key={pm.type}
                                            type="button"
                                            onClick={() => setFormData((p) => ({ ...p, paymentMethod: pm.type }))}
                                            whileHover={{ y: -2 }}
                                            whileTap={{ scale: 0.94 }}
                                            disabled={loading}
                                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                                                selected
                                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                                                    : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 bg-white dark:bg-slate-900'
                                            }`}
                                            title={pm.label}
                                        >
                                            <span className="text-lg">{pm.icon}</span>
                                            <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 leading-none truncate">{pm.label}</span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Banco */}
                        <div className="mt-5">
                            <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                                <Landmark className="w-3.5 h-3.5" />
                                Banco / Conta vinculado
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData((p) => ({ ...p, bankId: '' }))}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                                        !formData.bankId
                                            ? 'border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-white/[0.04]'
                                            : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-md bg-slate-200 dark:bg-white/[0.08] grid place-items-center">
                                            <Wallet className="w-3.5 h-3.5 text-slate-500" />
                                        </span>
                                        <span className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200">Sem banco</span>
                                    </div>
                                </button>
                                {banks.map((b) => {
                                    const selected = formData.bankId === b.id;
                                    return (
                                        <motion.button
                                            key={b.id}
                                            type="button"
                                            onClick={() => setFormData((p) => ({ ...p, bankId: b.id }))}
                                            whileTap={{ scale: 0.97 }}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                selected
                                                    ? 'border-current bg-slate-50 dark:bg-white/[0.04]'
                                                    : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300'
                                            }`}
                                            style={selected ? { color: b.corHex } : {}}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="w-7 h-7 rounded-md grid place-items-center text-white shrink-0"
                                                    style={{ backgroundColor: b.corHex }}
                                                >
                                                    <Landmark className="w-3.5 h-3.5" />
                                                </span>
                                                <span className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">{b.name}</span>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    </FloatingPanel>

                    {/* STEP 3: Descrição + status */}
                    <FloatingPanel delay={0.15}>
                        <StepHeader
                            step={3}
                            title="Detalhes"
                            subtitle="Descrição, status e quando aconteceu"
                            done={stepsDone.description}
                        />

                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                                    <Receipt className="w-3.5 h-3.5" />
                                    Descrição <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={2}
                                    disabled={loading}
                                    placeholder="Ex: Venda do dia 04/05 — cliente João Silva"
                                    className="w-full p-3 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500 transition-shadow"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                                    <Zap className="w-3.5 h-3.5" />
                                    Status
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {STATUS_OPTIONS.map((s) => {
                                        const selected = formData.status === s.value;
                                        const Icon = s.icon;
                                        return (
                                            <motion.button
                                                key={s.value}
                                                type="button"
                                                onClick={() => setFormData((p) => ({ ...p, status: s.value }))}
                                                whileTap={{ scale: 0.96 }}
                                                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 text-[12.5px] font-medium transition-all ${
                                                    selected
                                                        ? `border-${s.color}-500 bg-${s.color}-50 dark:bg-${s.color}-950/30 text-${s.color}-700 dark:text-${s.color}-300`
                                                        : 'border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:border-slate-300'
                                                }`}
                                            >
                                                <Icon className="w-3.5 h-3.5" />
                                                {s.label}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                                    <Calendar className="w-3.5 h-3.5" /> Data e hora
                                </label>
                                <input
                                    type="datetime-local"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    className="w-full p-3 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                    </FloatingPanel>

                    {/* STEP 4: avançado (collapsible) */}
                    <FloatingPanel delay={0.2}>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="w-full flex items-center justify-between -m-1 p-1 rounded-md hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-950/40 grid place-items-center text-violet-600 dark:text-violet-400">
                                    <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">Mais detalhes</h3>
                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400">Vencimento, contato, anexo, observações</p>
                                </div>
                            </div>
                            <motion.div animate={{ rotate: showAdvanced ? 90 : 0 }}>
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </motion.div>
                        </button>

                        <AnimatePresence>
                            {showAdvanced && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-5 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                                                    <Hash className="w-3.5 h-3.5" /> Código de referência
                                                </label>
                                                <input
                                                    type="text"
                                                    name="referenceCode"
                                                    value={formData.referenceCode}
                                                    onChange={handleChange}
                                                    placeholder="NF-001234"
                                                    className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                                                    <User className="w-3.5 h-3.5" /> Contato (cliente/fornecedor)
                                                </label>
                                                <input
                                                    type="text"
                                                    name="counterpartyName"
                                                    value={formData.counterpartyName}
                                                    onChange={handleChange}
                                                    placeholder="João Silva"
                                                    className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-2 block">
                                                    Documento do contato
                                                </label>
                                                <input
                                                    type="text"
                                                    name="counterpartyDocument"
                                                    value={formData.counterpartyDocument}
                                                    onChange={handleChange}
                                                    placeholder="CPF ou CNPJ"
                                                    className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                                                    <Link2 className="w-3.5 h-3.5" /> URL do anexo
                                                </label>
                                                <input
                                                    type="url"
                                                    name="attachmentUrl"
                                                    value={formData.attachmentUrl}
                                                    onChange={handleChange}
                                                    placeholder="https://..."
                                                    className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-2 block">
                                                    Vencimento
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    name="dueDate"
                                                    value={formData.dueDate}
                                                    onChange={handleChange}
                                                    className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 mb-2 block">
                                                    Pago em
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    name="paidAt"
                                                    value={formData.paidAt}
                                                    onChange={handleChange}
                                                    className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                                                <StickyNote className="w-3.5 h-3.5" /> Observações
                                            </label>
                                            <textarea
                                                name="notes"
                                                value={formData.notes}
                                                onChange={handleChange}
                                                rows={3}
                                                placeholder="Informações adicionais, contexto, divergências…"
                                                className="w-full p-2.5 border border-slate-200 dark:border-white/[0.08] rounded-lg bg-white dark:bg-slate-950 text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </FloatingPanel>

                    {/* CTA */}
                    <FloatingPanel delay={0.25}>
                        <div className="flex items-center justify-between gap-4">
                            <div className="text-[12px] text-slate-500 dark:text-slate-400">
                                {completedSteps < totalSteps
                                    ? `Faltam ${totalSteps - completedSteps} passo${totalSteps - completedSteps > 1 ? 's' : ''} obrigatório${totalSteps - completedSteps > 1 ? 's' : ''}`
                                    : '✨ Tudo pronto para registrar!'}
                            </div>
                            <motion.button
                                type="submit"
                                disabled={loading || completedSteps < totalSteps}
                                whileHover={{ scale: completedSteps === totalSteps ? 1.02 : 1 }}
                                whileTap={{ scale: 0.98 }}
                                className={`group relative inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-[13.5px] text-white shadow-lg transition-all overflow-hidden bg-gradient-to-r ${ac.gradient} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        Salvando…
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Registrar movimentação
                                        <motion.div
                                            className="absolute inset-0 bg-white/20"
                                            initial={{ x: '-100%' }}
                                            animate={{ x: '100%' }}
                                            transition={{ duration: 1.8, repeat: completedSteps === totalSteps ? Infinity : 0, repeatDelay: 1, ease: 'linear' }}
                                            style={{ display: completedSteps === totalSteps ? 'block' : 'none' }}
                                        />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </FloatingPanel>
                </form>

                {/* ============= COLUNA DIREITA: PREVIEW + GRÁFICOS ============= */}
                <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto pr-1">
                    {/* PREVIEW CARD */}
                    <FloatingPanel delay={0.3}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`w-1.5 h-1.5 rounded-full ${ac.bg} animate-pulse`} />
                            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Preview ao vivo
                            </span>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${formData.type}-${numericValue}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    {selectedMovement ? `${isEntry ? 'Entrada' : 'Saída'} • ${selectedMovement.label}` : 'Aguardando seleção'}
                                </div>
                                <AnimatedNumber
                                    value={numericValue}
                                    className={`block text-[34px] font-mono font-bold tabular-nums tracking-tight mt-1 ${ac.text}`}
                                />
                                {formData.description.trim() && (
                                    <p className="text-[12.5px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                                        {formData.description}
                                    </p>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-2 text-[12px]">
                            {formData.paymentMethod && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <CreditCard className="w-3 h-3" /> Pagamento
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {PAYMENT_LABEL[formData.paymentMethod]}
                                    </span>
                                </div>
                            )}
                            {formData.bankId && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                        <Landmark className="w-3 h-3" /> Banco
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white truncate ml-2">
                                        {banks.find((b) => b.id === formData.bankId)?.name ?? '—'}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" /> Quando
                                </span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {new Date(formData.date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Status</span>
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {STATUS_OPTIONS.find((s) => s.value === formData.status)?.label}
                                </span>
                            </div>
                        </div>
                    </FloatingPanel>

                    {/* IMPACTO NO SALDO */}
                    <FloatingPanel delay={0.35}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Impacto no caixa de hoje
                            </span>
                            <Banknote className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Saldo atual</p>
                                <p className="text-[18px] font-mono font-semibold text-slate-900 dark:text-white tabular-nums mt-1">
                                    {fmtBRL(Number(dash.todayBalance ?? 0))}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Após lançar</p>
                                <AnimatedNumber
                                    value={projectedBalance}
                                    className={`block text-[18px] font-mono font-semibold tabular-nums mt-1 ${
                                        projectedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    }`}
                                />
                            </div>
                        </div>

                        {/* Mini bar comparativa */}
                        <div className="mt-4 space-y-2">
                            <div>
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <ArrowUpRight className="w-3 h-3" /> Entradas hoje
                                    </span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">{fmtBRL(Number(dash.todayEntries ?? 0))}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${Math.min(100, (Number(dash.todayEntries ?? 0) / Math.max(Number(dash.todayEntries ?? 0), Number(dash.todayExits ?? 0), numericValue, 1)) * 100)}%`,
                                        }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <ArrowDownRight className="w-3 h-3" /> Saídas hoje
                                    </span>
                                    <span className="font-mono text-slate-700 dark:text-slate-200">{fmtBRL(Number(dash.todayExits ?? 0))}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${Math.min(100, (Number(dash.todayExits ?? 0) / Math.max(Number(dash.todayEntries ?? 0), Number(dash.todayExits ?? 0), numericValue, 1)) * 100)}%`,
                                        }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                        className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full"
                                    />
                                </div>
                            </div>
                            {numericValue > 0 && selectedMovement && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex items-center justify-between text-[11px] mb-1">
                                        <span className={`${ac.text} flex items-center gap-1`}>
                                            <Sparkles className="w-3 h-3" /> Esta movimentação
                                        </span>
                                        <span className={`font-mono font-semibold ${ac.text}`}>{fmtBRL(numericValue)}</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{
                                                width: `${Math.min(100, (numericValue / Math.max(Number(dash.todayEntries ?? 0), Number(dash.todayExits ?? 0), numericValue, 1)) * 100)}%`,
                                            }}
                                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                            className={`h-full bg-gradient-to-r ${ac.gradient} rounded-full`}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </FloatingPanel>

                    {/* DONUT */}
                    {donutData.length > 0 && (
                        <FloatingPanel delay={0.4}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Composição do dia
                                </span>
                                <PieIcon className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="h-44">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={42}
                                            outerRadius={68}
                                            paddingAngle={3}
                                            dataKey="value"
                                            stroke="none"
                                            isAnimationActive
                                            animationDuration={500}
                                        >
                                            {donutData.map((entry, idx) => (
                                                <Cell
                                                    key={idx}
                                                    fill={entry.color}
                                                    opacity={entry.isProjection ? 0.55 : 1}
                                                    style={entry.isProjection ? { strokeDasharray: '3,3' } : {}}
                                                />
                                            ))}
                                        </Pie>
                                        <ReTooltip
                                            content={({ active, payload }: any) => {
                                                if (!active || !payload?.length) return null;
                                                const p = payload[0];
                                                return (
                                                    <div className="bg-slate-900 text-white text-[12px] rounded-md px-3 py-2 shadow-lg">
                                                        <div>{p.name}</div>
                                                        <div className="font-mono font-semibold">{fmtBRL(Number(p.value))}</div>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1.5 mt-1">
                                {donutData.map((d) => (
                                    <div key={d.name} className="flex items-center justify-between text-[11.5px]">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: d.color, opacity: d.isProjection ? 0.55 : 1 }}
                                            />
                                            <span className="text-slate-600 dark:text-slate-300">
                                                {d.name}
                                                {d.isProjection && <span className="text-slate-400 ml-1">(simulação)</span>}
                                            </span>
                                        </div>
                                        <span className="font-mono text-slate-700 dark:text-slate-200">{fmtBRL(d.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </FloatingPanel>
                    )}

                    {/* SPARKLINE últimas movimentações */}
                    {sparklineData.length > 1 && (
                        <FloatingPanel delay={0.45}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Tendência das últimas {sparklineData.length}
                                </span>
                                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                            <div className="h-24">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sparklineData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                                        <defs>
                                            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="i" hide />
                                        <YAxis hide />
                                        <ReTooltip
                                            content={({ active, payload }: any) => {
                                                if (!active || !payload?.length) return null;
                                                const v = Number(payload[0].value);
                                                return (
                                                    <div className="bg-slate-900 text-white text-[11.5px] rounded-md px-2.5 py-1.5">
                                                        <span className={v >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                                                            {v >= 0 ? '+' : ''}{fmtBRL(v)}
                                                        </span>
                                                    </div>
                                                );
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            fill="url(#spark)"
                                            isAnimationActive
                                            animationDuration={600}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px]">
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400">Total mês</p>
                                    <p className="font-mono font-semibold text-slate-900 dark:text-white">{fmtBRL(Number(dash.monthlyTotal ?? 0))}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 dark:text-slate-400">Lançamentos</p>
                                    <p className="font-mono font-semibold text-slate-900 dark:text-white">{recentMoves.length}</p>
                                </div>
                            </div>
                        </FloatingPanel>
                    )}
                </aside>
            </div>
        </div>
    );
};
