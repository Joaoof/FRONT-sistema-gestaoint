import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Battery,
    Check,
    CheckCheck,
    ExternalLink,
    MessageCircle,
    Mic,
    Paperclip,
    Phone,
    Send,
    Settings2,
    Signal,
    Smile,
    Video,
    Wifi,
    X,
} from 'lucide-react';
import { GET_ORDERS, GET_ORDERS_SUMMARY } from '../graphql/queries/orders';
import { LIST_PRODUCTS_WITH_IMAGES } from '../graphql/mutations/product-with-images';
import { useCompany } from '../contexts/CompanyContext';

interface OrderRow {
    id: string;
    status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELED' | 'REFUNDED';
    total: number;
    createdAt: string;
}

interface ProductRow {
    id: string;
    quantity?: number | null;
    costPrice?: number | null;
}

interface OrdersSummary {
    todayCount: number;
    todayTotal: number;
    monthCount: number;
    monthTotal: number;
}

interface EvolutionConfig {
    baseUrl: string;
    instanceName: string;
    apiKey: string;
    enabled: boolean;
}

const STORAGE_KEY_CONFIG = 'evolution-api-config';
const STORAGE_KEY_PHONE = 'whatsapp-report-phone';

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n);

function loadConfig(): EvolutionConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (!raw) return { baseUrl: '', instanceName: '', apiKey: '', enabled: false };
        const parsed = JSON.parse(raw);
        return {
            baseUrl: parsed.baseUrl ?? '',
            instanceName: parsed.instanceName ?? '',
            apiKey: parsed.apiKey ?? '',
            enabled: !!parsed.enabled,
        };
    } catch {
        return { baseUrl: '', instanceName: '', apiKey: '', enabled: false };
    }
}

function onlyDigits(v: string) {
    return v.replace(/\D/g, '');
}

function formatPhonePreview(raw: string) {
    const d = onlyDigits(raw);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 9) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}${d.length > 7 ? '-' + d.slice(7) : ''}`;
    if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9, 13)}`;
}

export function WhatsAppReportPage() {
    const navigate = useNavigate();
    const { company } = useCompany();
    const [phone, setPhone] = useState<string>(() => localStorage.getItem(STORAGE_KEY_PHONE) ?? '');
    const [message, setMessage] = useState<string>('');
    const [touched, setTouched] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [config, setConfig] = useState<EvolutionConfig>(() => loadConfig());
    const [sendingEvolution, setSendingEvolution] = useState(false);

    const { data: summaryData } = useQuery<{ ordersSummary: OrdersSummary }>(
        GET_ORDERS_SUMMARY,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: ordersData } = useQuery<{ orders: OrderRow[] }>(GET_ORDERS, {
        variables: { take: 1000 },
        fetchPolicy: 'cache-and-network',
    });
    const { data: productsData } = useQuery<{ products: ProductRow[] }>(LIST_PRODUCTS_WITH_IMAGES, {
        variables: { take: 200, skip: 0 },
        fetchPolicy: 'cache-and-network',
    });

    const summary = summaryData?.ordersSummary ?? { todayCount: 0, todayTotal: 0, monthCount: 0, monthTotal: 0 };
    const orders = ordersData?.orders ?? [];
    const products = productsData?.products ?? [];

    const monthMetrics = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        let countMonth = 0;
        let totalMonth = 0;
        for (const o of orders) {
            if (o.status === 'CANCELED' || o.status === 'REFUNDED') continue;
            const ts = new Date(o.createdAt).getTime();
            if (ts >= startOfMonth) {
                countMonth++;
                totalMonth += Number(o.total);
            }
        }

        let stockCost = 0;
        let inStock = 0;
        for (const p of products) {
            const qty = Number(p.quantity ?? 0);
            stockCost += qty * Number(p.costPrice ?? 0);
            if (qty > 0) inStock++;
        }

        const ticket = countMonth > 0 ? totalMonth / countMonth : 0;
        return {
            countMonth: countMonth || summary.monthCount,
            totalMonth: totalMonth || summary.monthTotal,
            ticket,
            stockCost,
            inStock,
            totalProducts: products.length,
        };
    }, [orders, products, summary]);

    const generatedMessage = useMemo(() => {
        const now = new Date();
        const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        const empresa = company?.name ?? 'Sua empresa';
        return [
            `*Relatório de ${monthLabel}*`,
            `_${empresa}_`,
            '',
            `💰 *Faturamento:* ${formatBRL(monthMetrics.totalMonth)}`,
            `🛒 *Vendas no mês:* ${monthMetrics.countMonth}`,
            `🎯 *Ticket médio:* ${formatBRL(monthMetrics.ticket)}`,
            '',
            `📦 *Em estoque:* ${monthMetrics.inStock} de ${monthMetrics.totalProducts} produtos`,
            `💵 *Custo de estoque:* ${formatBRL(monthMetrics.stockCost)}`,
            '',
            `Hoje: ${summary.todayCount} venda${summary.todayCount === 1 ? '' : 's'} (${formatBRL(summary.todayTotal)})`,
            '',
            '— Relatório automático',
        ].join('\n');
    }, [company, monthMetrics, summary]);

    useEffect(() => {
        if (!touched) setMessage(generatedMessage);
    }, [generatedMessage, touched]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_PHONE, phone);
    }, [phone]);

    const phoneDigits = onlyDigits(phone);
    const phoneValid = phoneDigits.length >= 10;

    const buildIntlPhone = () => {
        if (phoneDigits.length >= 12) return phoneDigits;
        return `55${phoneDigits}`;
    };

    const handleSendRedirect = () => {
        if (!phoneValid) {
            toast.error('Informe um número de WhatsApp válido (DDD + número).');
            return;
        }
        const url = `https://wa.me/${buildIntlPhone()}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        toast.success('Abrindo WhatsApp Web…');
    };

    const handleSendEvolution = async () => {
        if (!phoneValid) {
            toast.error('Informe um número de WhatsApp válido (DDD + número).');
            return;
        }
        if (!config.enabled || !config.baseUrl || !config.instanceName || !config.apiKey) {
            toast.error('Configure a Evolution API antes de enviar.', {
                action: { label: 'Configurar', onClick: () => setShowConfig(true) },
            });
            return;
        }
        setSendingEvolution(true);
        await new Promise((r) => setTimeout(r, 900));
        // eslint-disable-next-line no-console
        console.info('[Evolution mock] enviaria:', {
            url: `${config.baseUrl}/message/sendText/${config.instanceName}`,
            number: buildIntlPhone(),
            text: message,
        });
        setSendingEvolution(false);
        toast.success('Mensagem enviada via Evolution (mock).');
    };

    const saveConfig = (next: EvolutionConfig) => {
        setConfig(next);
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(next));
    };

    return (
        <div className="space-y-6 w-full">
            {/* Header da página */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div className="min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-1.5 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" strokeWidth={2} />
                        Voltar
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center shadow-sm">
                            <MessageCircle className="w-4 h-4 text-white" />
                        </span>
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                            Relatório por WhatsApp
                        </h1>
                    </div>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Envie o resumo do mês pro cliente, sócio ou contador
                    </p>
                </div>
                <button
                    onClick={() => setShowConfig(true)}
                    className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 dark:border-white/10 text-[12.5px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                >
                    <Settings2 className="w-3.5 h-3.5" />
                    Evolution API
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(320px,420px)] gap-6"
            >
                {/* Coluna controles */}
                <div className="space-y-5">
                    <ConnectionBadge
                        config={config}
                        onConfigClick={() => setShowConfig(true)}
                    />

                    <Field
                        label="Número do destinatário"
                        hint="Com DDD. Para internacional, prefixe o DDI (ex: 55 11 99999-0000)."
                    >
                        <div className="flex items-center gap-2">
                            <span className="px-3 h-10 grid place-items-center rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 text-[13px] font-mono">
                                +
                            </span>
                            <input
                                value={formatPhonePreview(phone)}
                                onChange={(e) => setPhone(onlyDigits(e.target.value))}
                                placeholder="11 99999-0000"
                                inputMode="tel"
                                className="flex-1 h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[14px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            />
                        </div>
                        {!phoneValid && phone.length > 0 && (
                            <p className="text-[11.5px] text-rose-500 mt-1.5">
                                Número incompleto — precisa de pelo menos DDD + 8 dígitos.
                            </p>
                        )}
                    </Field>

                    <Field
                        label="Mensagem"
                        hint="Você pode editar livremente. *negrito* e _itálico_ funcionam no WhatsApp."
                        right={
                            touched && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTouched(false);
                                        setMessage(generatedMessage);
                                    }}
                                    className="text-[11.5px] text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                    Restaurar relatório original
                                </button>
                            )
                        }
                    >
                        <textarea
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                setTouched(true);
                            }}
                            rows={12}
                            className="w-full rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-2.5 text-[13px] font-mono leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-y"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1.5">
                            {message.length} caracteres
                        </p>
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={handleSendRedirect}
                            disabled={!phoneValid}
                            className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[13.5px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Enviar via WhatsApp Web
                        </button>
                        <button
                            type="button"
                            onClick={handleSendEvolution}
                            disabled={!phoneValid || sendingEvolution}
                            className="h-11 inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 dark:bg-white/[0.08] hover:bg-slate-800 dark:hover:bg-white/[0.14] text-white dark:text-slate-100 text-[13.5px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed border border-slate-900/10 dark:border-white/10"
                        >
                            {sendingEvolution ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Enviando…
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Enviar via Evolution API
                                </>
                            )}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowConfig(true)}
                        className="sm:hidden inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                        <Settings2 className="w-3.5 h-3.5" />
                        Configurar Evolution API
                    </button>
                </div>

                {/* Preview do celular */}
                <div className="lg:sticky lg:top-6 self-start">
                    <PhonePreview
                        contactName={company?.name ?? 'Cliente'}
                        message={message}
                    />
                </div>
            </motion.div>

            <EvolutionConfigModal
                open={showConfig}
                onClose={() => setShowConfig(false)}
                value={config}
                onSave={(next) => {
                    saveConfig(next);
                    setShowConfig(false);
                    toast.success('Configuração salva.');
                }}
            />
        </div>
    );
}

function Field({
    label,
    hint,
    right,
    children,
}: {
    label: string;
    hint?: string;
    right?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{label}</span>
                {right}
            </div>
            {children}
            {hint && (
                <p className="text-[11.5px] text-slate-500 dark:text-slate-500 mt-1.5">{hint}</p>
            )}
        </label>
    );
}

function ConnectionBadge({
    config,
    onConfigClick,
}: {
    config: EvolutionConfig;
    onConfigClick: () => void;
}) {
    const ready = config.enabled && config.baseUrl && config.instanceName && config.apiKey;
    return (
        <div
            className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border ${
                ready
                    ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/[0.06]'
                    : 'border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/[0.06]'
            }`}
        >
            <div className="flex items-center gap-2.5 min-w-0">
                <span
                    className={`relative w-2.5 h-2.5 rounded-full ${
                        ready ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                >
                    <span className={`absolute inset-0 rounded-full ${ready ? 'bg-emerald-500' : 'bg-amber-500'} animate-ping`} />
                </span>
                <div className="min-w-0">
                    <p className={`text-[12.5px] font-semibold ${
                        ready
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : 'text-amber-800 dark:text-amber-300'
                    }`}>
                        {ready ? 'Evolution API conectada' : 'Apenas WhatsApp Web disponível'}
                    </p>
                    <p className={`text-[11px] ${
                        ready
                            ? 'text-emerald-700/80 dark:text-emerald-300/70'
                            : 'text-amber-700/80 dark:text-amber-300/70'
                    } truncate`}>
                        {ready
                            ? `Instância: ${config.instanceName}`
                            : 'Você ainda pode enviar abrindo o WhatsApp Web.'}
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={onConfigClick}
                className={`shrink-0 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11.5px] font-semibold transition ${
                    ready
                        ? 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-700 dark:text-amber-300'
                }`}
            >
                <Settings2 className="w-3.5 h-3.5" />
                {ready ? 'Editar' : 'Configurar'}
            </button>
        </div>
    );
}

function renderWhatsAppText(text: string) {
    const parts: React.ReactNode[] = [];
    const lines = text.split('\n');
    lines.forEach((line, lineIdx) => {
        const regex = /(\*[^*]+\*|_[^_]+_)/g;
        const tokens = line.split(regex);
        tokens.forEach((tok, tokIdx) => {
            if (!tok) return;
            if (tok.startsWith('*') && tok.endsWith('*')) {
                parts.push(<strong key={`${lineIdx}-${tokIdx}`}>{tok.slice(1, -1)}</strong>);
            } else if (tok.startsWith('_') && tok.endsWith('_')) {
                parts.push(<em key={`${lineIdx}-${tokIdx}`}>{tok.slice(1, -1)}</em>);
            } else {
                parts.push(<span key={`${lineIdx}-${tokIdx}`}>{tok}</span>);
            }
        });
        if (lineIdx < lines.length - 1) parts.push(<br key={`br-${lineIdx}`} />);
    });
    return parts;
}

function PhonePreview({ contactName, message }: { contactName: string; message: string }) {
    const now = new Date();
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="mx-auto w-full max-w-[360px]">
            <p className="text-center text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-3">
                Pré-visualização
            </p>

            <div className="relative mx-auto rounded-[44px] bg-slate-950 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/30">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-2xl z-20" />
                <span className="absolute left-[-3px] top-24 w-[3px] h-12 rounded-l bg-slate-800" />
                <span className="absolute right-[-3px] top-32 w-[3px] h-20 rounded-r bg-slate-800" />

                <div className="relative rounded-[36px] overflow-hidden bg-[#ECE5DD] dark:bg-[#0b141a]">
                    <div className="relative z-10 flex items-center justify-between px-5 pt-2 pb-1 text-[11px] font-semibold text-white bg-[#075E54]">
                        <span className="tabular-nums">{time}</span>
                        <div className="flex items-center gap-1">
                            <Signal className="w-3 h-3" />
                            <Wifi className="w-3 h-3" />
                            <Battery className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-3 px-3 py-2 bg-[#075E54] text-white">
                        <span className="w-9 h-9 rounded-full bg-emerald-300/30 grid place-items-center text-[12px] font-bold">
                            {contactName.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold leading-tight truncate">{contactName}</p>
                            <p className="text-[10.5px] text-emerald-100/80 leading-tight">online</p>
                        </div>
                        <Video className="w-4 h-4" />
                        <Phone className="w-4 h-4" />
                    </div>

                    <div
                        className="relative h-[440px] overflow-hidden px-3 py-3"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 20% 20%, rgba(0,0,0,0.04) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(0,0,0,0.05) 0, transparent 35%)',
                            backgroundColor: '#ECE5DD',
                        }}
                    >
                        <div className="flex justify-center mb-3">
                            <span className="px-2.5 py-0.5 rounded-md bg-white/85 text-[10px] font-medium text-slate-600 shadow-sm">
                                HOJE
                            </span>
                        </div>

                        <div className="flex justify-end">
                            <div className="relative max-w-[85%] rounded-lg bg-[#DCF8C6] text-slate-900 px-2.5 py-1.5 shadow-sm">
                                <div className="text-[12.5px] leading-snug whitespace-pre-wrap break-words">
                                    {message ? renderWhatsAppText(message) : (
                                        <span className="text-slate-400 italic">Mensagem vazia</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-end gap-1 mt-1 text-[9.5px] text-slate-500">
                                    <span className="tabular-nums">{time}</span>
                                    <CheckCheck className="w-3 h-3 text-sky-500" />
                                </div>
                                <span
                                    className="absolute -right-1 top-0 w-2 h-2 bg-[#DCF8C6]"
                                    style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 px-2 py-2 bg-[#F0F0F0] dark:bg-[#1f2c33]">
                        <div className="flex-1 flex items-center gap-2 bg-white dark:bg-[#2a3942] rounded-full px-3 py-1.5 text-[12px] text-slate-400">
                            <Smile className="w-4 h-4" />
                            <span className="flex-1 truncate">Mensagem</span>
                            <Paperclip className="w-4 h-4" />
                        </div>
                        <span className="w-8 h-8 rounded-full bg-[#075E54] grid place-items-center text-white">
                            <Mic className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </div>

            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-3">
                A pré-visualização atualiza ao digitar.
            </p>
        </div>
    );
}

function EvolutionConfigModal({
    open,
    onClose,
    value,
    onSave,
}: {
    open: boolean;
    onClose: () => void;
    value: EvolutionConfig;
    onSave: (next: EvolutionConfig) => void;
}) {
    const [draft, setDraft] = useState<EvolutionConfig>(value);

    useEffect(() => {
        if (open) setDraft(value);
    }, [open, value]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden"
            >
                <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-white/10">
                    <div>
                        <h3 className="text-[14.5px] font-semibold text-slate-900 dark:text-white">
                            Evolution API
                        </h3>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400">
                            Conexão com sua instância para envio automático
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fechar"
                        className="w-8 h-8 grid place-items-center rounded-md hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </header>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSave(draft);
                    }}
                    className="p-5 space-y-3.5"
                >
                    <Field label="Base URL" hint="Ex: https://evolution.minhaempresa.com">
                        <input
                            value={draft.baseUrl}
                            onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value.trim() })}
                            placeholder="https://api.evolution.com"
                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                    </Field>

                    <Field label="Instância" hint="Nome da instância criada na Evolution">
                        <input
                            value={draft.instanceName}
                            onChange={(e) => setDraft({ ...draft, instanceName: e.target.value.trim() })}
                            placeholder="empresa-principal"
                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                    </Field>

                    <Field label="API Key" hint="Mantida só localmente (mock). Em produção, salvar no backend.">
                        <input
                            type="password"
                            value={draft.apiKey}
                            onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })}
                            placeholder="••••••••"
                            className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        />
                    </Field>

                    <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-md border border-slate-200 dark:border-white/10 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={draft.enabled}
                            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                            className="w-4 h-4 accent-emerald-600"
                        />
                        <div>
                            <p className="text-[12.5px] font-medium text-slate-800 dark:text-slate-200">
                                Conexão ativa
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Usar o botão "Enviar via Evolution API"
                            </p>
                        </div>
                    </label>

                    <div className="rounded-md bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20 px-3 py-2.5 text-[11.5px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                            Modo simulado: no envio o sistema só registra no console.
                            Para enviar de verdade, ligue um endpoint do backend que faça o proxy
                            (não chame a Evolution direto do navegador — CORS + segredo exposto).
                        </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-3 rounded-md border border-slate-200 dark:border-white/10 text-[12.5px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="h-9 px-3.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[12.5px] font-semibold"
                        >
                            Salvar configuração
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
