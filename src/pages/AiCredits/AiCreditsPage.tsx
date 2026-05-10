import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { Sparkles, Zap, Check, Copy, Clock, Wallet, TrendingUp, ShieldCheck, BotMessageSquare, BarChart3, Brain } from 'lucide-react';
import {
    AI_CREDIT_PACKAGES,
    CANCEL_AI_CREDIT_PURCHASE,
    MY_AI_CREDIT_ACCOUNT,
    MY_AI_CREDIT_PURCHASES,
    MY_AI_CREDIT_TRANSACTIONS,
    REQUEST_AI_CREDIT_PURCHASE,
} from '../../graphql/queries/ai-credits';

interface CreditPackage {
    brl: number;
    base: number;
    bonus: number;
    total: number;
    badge: string | null;
}

interface Account {
    id: string;
    balance: number;
    lowThreshold: number;
    totalPurchased: number;
    totalConsumed: number;
    isLow: boolean;
    isEmpty: boolean;
}

interface Purchase {
    id: string;
    packageBrl: number;
    creditsTotal: number;
    pixKey: string;
    pixCopyPaste: string;
    pixTxid: string;
    status: 'PENDING' | 'PAID' | 'CANCELED' | 'EXPIRED';
    paidAt: string | null;
    createdAt: string;
    expiresAt: string;
}

interface Transaction {
    id: string;
    kind: string;
    amount: number;
    balanceAfter: number;
    description: string;
    refType: string | null;
    createdAt: string;
}

const ADVANTAGES = [
    {
        icon: BotMessageSquare,
        title: 'Assistente 24/7',
        text: 'Responde perguntas sobre vendas, contas e estoque em segundos. Tira dúvidas de qualquer hora.',
    },
    {
        icon: Zap,
        title: 'Automatiza tarefas chatas',
        text: 'Crie contas a pagar, marque pagamentos e lance produção falando — a IA faz, você só confirma.',
    },
    {
        icon: BarChart3,
        title: 'Insights diários e semanais',
        text: 'Resumos automáticos: o que vendeu mais, quem está devendo, o que está parando o estoque.',
    },
    {
        icon: Brain,
        title: 'Detecta padrões que você não vê',
        text: 'Quedas de venda, clientes inativos, despesas crescendo — tudo destacado antes de virar problema.',
    },
    {
        icon: TrendingUp,
        title: 'Decisões mais rápidas',
        text: 'Em vez de abrir 5 telas, pergunte. A IA cruza dados de várias áreas e entrega resposta direta.',
    },
    {
        icon: ShieldCheck,
        title: 'Sem risco — você confirma tudo',
        text: 'Toda ação que muda dado pede sua confirmação. A IA não age por conta própria.',
    },
];

export function AiCreditsPage() {
    const { data: accData, refetch: refetchAcc } = useQuery<{ myAiCreditAccount: Account }>(
        MY_AI_CREDIT_ACCOUNT,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: pkgsData } = useQuery<{ aiCreditPackages: CreditPackage[] }>(AI_CREDIT_PACKAGES);
    const { data: purchasesData, refetch: refetchPurchases } = useQuery<{ myAiCreditPurchases: Purchase[] }>(
        MY_AI_CREDIT_PURCHASES,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: txData } = useQuery<{ myAiCreditTransactions: Transaction[] }>(
        MY_AI_CREDIT_TRANSACTIONS,
        { variables: { limit: 20 } },
    );

    const [requestPurchase, { loading: requesting }] = useMutation(REQUEST_AI_CREDIT_PURCHASE);
    const [cancelPurchase] = useMutation(CANCEL_AI_CREDIT_PURCHASE);

    const [showPix, setShowPix] = useState<Purchase | null>(null);

    const account = accData?.myAiCreditAccount;
    const packages = pkgsData?.aiCreditPackages ?? [];
    const purchases = purchasesData?.myAiCreditPurchases ?? [];
    const transactions = txData?.myAiCreditTransactions ?? [];

    const handleBuy = async (brl: number) => {
        try {
            const { data } = await requestPurchase({ variables: { packageBrl: brl } });
            const purchase = data?.requestAiCreditPurchase;
            if (purchase) {
                setShowPix(purchase);
                refetchPurchases();
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Cancelar esta compra? Você poderá criar outra depois.')) return;
        try {
            await cancelPurchase({ variables: { purchaseId: id } });
            toast.success('Compra cancelada.');
            refetchPurchases();
            if (showPix?.id === id) setShowPix(null);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const balancePercent = account
        ? Math.min(100, (account.balance / Math.max(1, account.totalPurchased || 1000)) * 100)
        : 0;
    const balanceColor = !account
        ? 'bg-slate-400'
        : account.isEmpty
        ? 'bg-rose-500'
        : account.isLow
        ? 'bg-amber-500'
        : 'bg-emerald-500';

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        Créditos da IA
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        Cada conversa com a IA consome créditos. Compre quando estiver acabando.
                    </p>
                </div>
            </div>

            {/* Saldo + status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Saldo atual</span>
                    </div>
                    <div className="text-5xl font-bold tabular-nums mb-2">
                        {account?.balance ?? '—'}
                        <span className="text-base font-normal text-white/70 ml-2">créditos</span>
                    </div>
                    {account && (
                        <>
                            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`${balanceColor} h-2 rounded-full transition-all`}
                                    style={{ width: `${balancePercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[12px] mt-2 text-white/80">
                                <span>{account.totalConsumed} consumidos</span>
                                <span>{account.totalPurchased} comprados ao todo</span>
                            </div>
                            {account.isEmpty && (
                                <div className="mt-3 bg-rose-500/30 border border-rose-300/50 rounded-lg p-2 text-sm">
                                    ⚠️ Saldo zerado — compre créditos pra usar a IA.
                                </div>
                            )}
                            {!account.isEmpty && account.isLow && (
                                <div className="mt-3 bg-amber-500/30 border border-amber-300/50 rounded-lg p-2 text-sm">
                                    ⚠️ Saldo baixo (abaixo de {account.lowThreshold} créditos). Considere comprar.
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                        💡 Saiba o que sua IA pode fazer:
                    </h3>
                    <ul className="space-y-2 text-[13px] text-slate-700 dark:text-slate-300">
                        {ADVANTAGES.slice(0, 4).map((a, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                <span>
                                    <b>{a.title}</b> — {a.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Pacotes */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    Compre créditos via PIX
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {packages.map((p) => {
                        const isFeatured = p.bonus > 0 && p.brl === 100;
                        return (
                            <div
                                key={p.brl}
                                className={`relative rounded-2xl p-6 border-2 transition-all hover:shadow-lg ${
                                    isFeatured
                                        ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30'
                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900'
                                }`}
                            >
                                {isFeatured && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                        Mais vantajoso
                                    </span>
                                )}
                                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                    R$ {p.brl}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <b className="text-violet-600 dark:text-violet-400">
                                        {p.total.toLocaleString('pt-BR')}
                                    </b>{' '}
                                    créditos
                                    {p.badge && (
                                        <span className="ml-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                            {p.badge}
                                        </span>
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-2">
                                    ≈ {Math.round(p.total * 0.18)} insights ou{' '}
                                    {p.total} mensagens (gpt-4o-mini)
                                </div>
                                <button
                                    onClick={() => handleBuy(p.brl)}
                                    disabled={requesting}
                                    className={`mt-4 w-full py-2.5 rounded-lg font-medium text-sm ${
                                        isFeatured
                                            ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                            : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white'
                                    } disabled:opacity-50`}
                                >
                                    {requesting ? 'Gerando PIX…' : 'Comprar'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Vantagens completas */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-4">
                    Por que ter IA no seu sistema:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ADVANTAGES.map((a, i) => {
                        const Icon = a.icon;
                        return (
                            <div key={i} className="flex gap-3">
                                <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/40 grid place-items-center shrink-0">
                                    <Icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                                        {a.title}
                                    </div>
                                    <div className="text-[12.5px] text-slate-600 dark:text-slate-400 leading-snug">
                                        {a.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Compras pendentes / histórico */}
            {purchases.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">
                        Suas compras
                    </h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:border-white/10">
                                <th className="py-2">Data</th>
                                <th>Valor</th>
                                <th>Créditos</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map((p) => (
                                <tr key={p.id} className="border-b border-slate-100 dark:border-white/5">
                                    <td className="py-2">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                                    <td>R$ {p.packageBrl}</td>
                                    <td className="font-semibold text-violet-600">{p.creditsTotal}</td>
                                    <td>
                                        <span
                                            className={`inline-block px-2 py-0.5 text-[10.5px] font-medium rounded ${
                                                p.status === 'PAID'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : p.status === 'PENDING'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            }`}
                                        >
                                            {p.status}
                                        </span>
                                    </td>
                                    <td>
                                        {p.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setShowPix(p)}
                                                    className="text-violet-600 hover:underline text-[12px]"
                                                >
                                                    Ver PIX
                                                </button>
                                                <button
                                                    onClick={() => handleCancel(p.id)}
                                                    className="text-rose-600 hover:underline text-[12px]"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Extrato */}
            {transactions.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-3">
                        Últimas movimentações de créditos
                    </h3>
                    <ul className="divide-y divide-slate-100 dark:divide-white/5 text-sm">
                        {transactions.map((t) => (
                            <li key={t.id} className="py-2 flex justify-between items-center">
                                <div>
                                    <div>{t.description}</div>
                                    <div className="text-[11px] text-slate-400">
                                        {new Date(t.createdAt).toLocaleString('pt-BR')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div
                                        className={`font-semibold tabular-nums ${
                                            t.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                                        }`}
                                    >
                                        {t.amount > 0 ? '+' : ''}
                                        {t.amount}
                                    </div>
                                    <div className="text-[11px] text-slate-400">saldo: {t.balanceAfter}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Modal PIX */}
            {showPix && (
                <PixModal
                    purchase={showPix}
                    onClose={() => {
                        setShowPix(null);
                        refetchAcc();
                    }}
                />
            )}
        </div>
    );
}

function PixModal({ purchase, onClose }: { purchase: Purchase; onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(purchase.pixCopyPaste);
        setCopied(true);
        toast.success('PIX copiado!');
        setTimeout(() => setCopied(false), 2000);
    };

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        purchase.pixCopyPaste,
    )}`;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                <div className="text-center mb-4">
                    <div className="w-12 h-12 mx-auto bg-violet-100 dark:bg-violet-900/40 rounded-full grid place-items-center mb-2">
                        <Sparkles className="w-6 h-6 text-violet-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        Pague R$ {purchase.packageBrl} via PIX
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Você vai receber{' '}
                        <b className="text-violet-600">
                            {purchase.creditsTotal.toLocaleString('pt-BR')} créditos
                        </b>{' '}
                        após confirmação.
                    </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                    <img src={qrUrl} alt="QR Code PIX" className="mx-auto" />
                </div>

                <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    PIX Copia e Cola:
                </div>
                <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-mono p-2 rounded break-all max-h-20 overflow-y-auto">
                        {purchase.pixCopyPaste}
                    </code>
                    <button
                        onClick={copy}
                        className="bg-violet-600 hover:bg-violet-700 text-white p-2 rounded-lg shrink-0"
                        title="Copiar"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>

                <div className="mt-4 text-[12px] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg p-3 flex gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-amber-800 dark:text-amber-200">
                        Após o pagamento, o admin precisa confirmar manualmente. Os créditos
                        entram em até alguns minutos. Esta cobrança expira em{' '}
                        <b>{new Date(purchase.expiresAt).toLocaleString('pt-BR')}</b>.
                    </span>
                </div>

                <button
                    onClick={onClose}
                    className="mt-4 w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white py-2 rounded-lg"
                >
                    Já paguei / Fechar
                </button>
            </div>
        </div>
    );
}
