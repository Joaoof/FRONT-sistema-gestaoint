import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowLeft,
    ArrowUpCircle,
    BadgeCheck,
    Boxes,
    Calendar,
    CircleDollarSign,
    Package,
    PackageX,
    TrendingDown,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import {
    GET_ACCOUNTS_PAYABLE_SUMMARY,
    GET_ACCOUNTS_RECEIVABLE_SUMMARY,
    GET_ACCOUNTS_PAYABLE,
    GET_ACCOUNTS_RECEIVABLE,
} from '../../graphql/queries/accounts';
import {
    AccountPayableData,
    AccountReceivableData,
    AccountSummary,
    formatBRL,
} from '../../types/accounts';
import { useLowStock } from '../../hooks/useLowStock';

interface KpiCardProps {
    label: string;
    value: string | number;
    helper?: string;
    icon: React.ReactNode;
    accent: 'sky' | 'emerald' | 'rose' | 'amber' | 'violet';
    delta?: { value: number; positive: boolean };
}

function KpiCard({ label, value, helper, icon, accent, delta }: KpiCardProps) {
    const palette = {
        sky: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
        emerald:
            'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        rose: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
        amber:
            'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        violet:
            'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    };
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-md ring-1 flex items-center justify-center ${palette[accent]}`}>
                        {icon}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
                        {label}
                    </span>
                </div>
                {delta && (
                    <span
                        className={`inline-flex items-center gap-0.5 text-[10.5px] font-semibold tabular-nums ${
                            delta.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                    >
                        {delta.positive ? (
                            <ArrowUpCircle className="w-3 h-3" />
                        ) : (
                            <ArrowDownCircle className="w-3 h-3" />
                        )}
                        {Math.abs(delta.value).toFixed(1)}%
                    </span>
                )}
            </div>
            <p className="mt-3 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums">
                {value}
            </p>
            {helper && (
                <p className="mt-1.5 text-[11.5px] text-slate-500 dark:text-slate-400">{helper}</p>
            )}
        </div>
    );
}

function SectionCard({
    title,
    subtitle,
    children,
    icon,
    onSeeMore,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    onSeeMore?: () => void;
}) {
    return (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
            <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2 min-w-0">
                    {icon}
                    <div className="min-w-0">
                        <h2 className="text-[13.5px] font-semibold text-slate-900 dark:text-white">{title}</h2>
                        {subtitle && (
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
                        )}
                    </div>
                </div>
                {onSeeMore && (
                    <button
                        onClick={onSeeMore}
                        className="text-[11.5px] text-violet-600 dark:text-violet-400 font-medium hover:underline shrink-0"
                    >
                        Ver tudo →
                    </button>
                )}
            </header>
            {children}
        </section>
    );
}

export function BusinessOverview() {
    const navigate = useNavigate();

    const { data: receivablesSummary } = useQuery<{ accountsReceivableSummary: AccountSummary }>(
        GET_ACCOUNTS_RECEIVABLE_SUMMARY,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: payablesSummary } = useQuery<{ accountsPayableSummary: AccountSummary }>(
        GET_ACCOUNTS_PAYABLE_SUMMARY,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: receivablesList } = useQuery<{ accountsReceivable: AccountReceivableData[] }>(
        GET_ACCOUNTS_RECEIVABLE,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: payablesList } = useQuery<{ accountsPayable: AccountPayableData[] }>(
        GET_ACCOUNTS_PAYABLE,
        { fetchPolicy: 'cache-and-network' },
    );
    const { lowStock, outOfStockCount, count: lowStockCount } = useLowStock();

    const cashFlow = useMemo(() => {
        const recv = receivablesSummary?.accountsReceivableSummary;
        const pay = payablesSummary?.accountsPayableSummary;
        if (!recv || !pay) return { net: 0, expected: 0, owed: 0 };
        return {
            net: recv.pending - pay.pending,
            expected: recv.pending + recv.overdue,
            owed: pay.pending + pay.overdue,
        };
    }, [receivablesSummary, payablesSummary]);

    const overdueReceivables = useMemo(() => {
        return (receivablesList?.accountsReceivable ?? [])
            .filter((r) => r.daysOverdue > 0 && r.status !== 'PAID' && r.status !== 'CANCELED')
            .sort((a, b) => b.daysOverdue - a.daysOverdue)
            .slice(0, 5);
    }, [receivablesList]);

    const overduePayables = useMemo(() => {
        return (payablesList?.accountsPayable ?? [])
            .filter((p) => p.daysOverdue > 0 && p.status !== 'PAID' && p.status !== 'CANCELED')
            .sort((a, b) => b.daysOverdue - a.daysOverdue)
            .slice(0, 5);
    }, [payablesList]);

    const upcomingPayments = useMemo(() => {
        const next30Days = Date.now() + 30 * 24 * 60 * 60 * 1000;
        return (payablesList?.accountsPayable ?? [])
            .filter((p) => p.status === 'PENDING' && new Date(p.dueDate).getTime() <= next30Days && p.daysOverdue === 0)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
    }, [payablesList]);

    const recv = receivablesSummary?.accountsReceivableSummary;
    const pay = payablesSummary?.accountsPayableSummary;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <div>
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                            Visão geral do negócio
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400">
                            Resumo financeiro, operacional e alertas críticos em tempo real
                        </p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="relative w-1.5 h-1.5">
                        <span className="absolute inset-0 rounded-full bg-emerald-500" />
                        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-70" />
                    </span>
                    Dados ao vivo
                </span>
            </div>

            {/* KPIs financeiros */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                    label="A receber"
                    value={recv ? formatBRL(recv.pending + recv.overdue) : '—'}
                    helper={recv ? `${recv.countTotal} contas no total` : 'Carregando...'}
                    icon={<ArrowUpCircle className="w-4 h-4" />}
                    accent="emerald"
                />
                <KpiCard
                    label="A pagar"
                    value={pay ? formatBRL(pay.pending + pay.overdue) : '—'}
                    helper={pay ? `${pay.countTotal} contas no total` : 'Carregando...'}
                    icon={<ArrowDownCircle className="w-4 h-4" />}
                    accent="rose"
                />
                <KpiCard
                    label="Saldo projetado"
                    value={formatBRL(cashFlow.net)}
                    helper={cashFlow.net >= 0 ? 'Superávit estimado' : 'Déficit — atenção'}
                    icon={<Wallet className="w-4 h-4" />}
                    accent={cashFlow.net >= 0 ? 'emerald' : 'rose'}
                />
                <KpiCard
                    label="Já recebido"
                    value={recv ? formatBRL(recv.paid) : '—'}
                    helper={pay ? `Pago: ${formatBRL(pay.paid)}` : 'Carregando...'}
                    icon={<BadgeCheck className="w-4 h-4" />}
                    accent="sky"
                />
            </div>

            {/* KPIs de estoque */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                    label="Estoque crítico"
                    value={lowStockCount}
                    helper={
                        outOfStockCount > 0
                            ? `${outOfStockCount} produto${outOfStockCount === 1 ? '' : 's'} zerado${outOfStockCount === 1 ? '' : 's'}`
                            : 'Nenhum sem estoque'
                    }
                    icon={<AlertTriangle className="w-4 h-4" />}
                    accent={outOfStockCount > 0 ? 'rose' : lowStockCount > 0 ? 'amber' : 'emerald'}
                />
                <KpiCard
                    label="Vencidas (a receber)"
                    value={overdueReceivables.length}
                    helper={recv ? formatBRL(recv.overdue) : '—'}
                    icon={<TrendingDown className="w-4 h-4" />}
                    accent="rose"
                />
                <KpiCard
                    label="Vencidas (a pagar)"
                    value={overduePayables.length}
                    helper={pay ? formatBRL(pay.overdue) : '—'}
                    icon={<TrendingDown className="w-4 h-4" />}
                    accent="amber"
                />
                <KpiCard
                    label="Próximos 30 dias"
                    value={upcomingPayments.length}
                    helper="Despesas a vencer"
                    icon={<Calendar className="w-4 h-4" />}
                    accent="violet"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Inadimplentes */}
                <SectionCard
                    title="Top inadimplentes"
                    subtitle="Clientes com contas mais atrasadas"
                    icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
                    onSeeMore={() => navigate('/listar-contas-receber')}
                >
                    {overdueReceivables.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <BadgeCheck className="w-10 h-10 mx-auto text-emerald-300 dark:text-emerald-700" />
                            <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">
                                Nenhum cliente em atraso. Excelente!
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                            {overdueReceivables.map((r) => (
                                <li key={r.id}>
                                    <button
                                        onClick={() => navigate('/listar-contas-receber')}
                                        className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-semibold text-[12px]">
                                            {(r.customer?.name ?? '?').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
                                                {r.customer?.name ?? '—'}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {r.description}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[12.5px] font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                                                {formatBRL(r.finalAmount)}
                                            </p>
                                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                                {r.daysOverdue}d atraso
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>

                {/* Despesas vencidas */}
                <SectionCard
                    title="Despesas vencidas"
                    subtitle="Pagamentos atrasados aos fornecedores"
                    icon={<CircleDollarSign className="w-4 h-4 text-amber-500" />}
                    onSeeMore={() => navigate('/listar-contas-pagas')}
                >
                    {overduePayables.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <BadgeCheck className="w-10 h-10 mx-auto text-emerald-300 dark:text-emerald-700" />
                            <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">
                                Tudo em dia com fornecedores.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                            {overduePayables.map((p) => (
                                <li key={p.id}>
                                    <button
                                        onClick={() => navigate('/listar-contas-pagas')}
                                        className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-semibold text-[12px]">
                                            {p.supplierName.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
                                                {p.supplierName}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {p.description}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[12.5px] font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                                                {formatBRL(p.finalAmount)}
                                            </p>
                                            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
                                                {p.daysOverdue}d atraso
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>

                {/* Próximas despesas */}
                <SectionCard
                    title="Próximas despesas"
                    subtitle="Contas a pagar nos próximos 30 dias"
                    icon={<Calendar className="w-4 h-4 text-violet-500" />}
                    onSeeMore={() => navigate('/listar-contas-pagas')}
                >
                    {upcomingPayments.length === 0 ? (
                        <div className="px-5 py-10 text-center text-[13px] text-slate-500 dark:text-slate-400">
                            Nenhuma despesa agendada para os próximos 30 dias.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                            {upcomingPayments.map((p) => {
                                const daysAhead = Math.ceil(
                                    (new Date(p.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                                );
                                return (
                                    <li
                                        key={p.id}
                                        className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                    >
                                        <div className="w-10 h-10 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[10px] uppercase tracking-wide leading-none">
                                                {new Date(p.dueDate).toLocaleDateString('pt-BR', { month: 'short' })}
                                            </span>
                                            <span className="text-[14px] font-bold leading-none mt-0.5">
                                                {new Date(p.dueDate).getDate()}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
                                                {p.supplierName}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                em {daysAhead} dia{daysAhead === 1 ? '' : 's'} · {p.description}
                                            </p>
                                        </div>
                                        <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                                            {formatBRL(p.amount)}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </SectionCard>

                {/* Estoque mais crítico */}
                <SectionCard
                    title="Estoque mais crítico"
                    subtitle="Produtos com maior risco de ruptura"
                    icon={<Boxes className="w-4 h-4 text-rose-500" />}
                    onSeeMore={() => navigate('/estoque/alertas')}
                >
                    {lowStock.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <Package className="w-10 h-10 mx-auto text-emerald-300 dark:text-emerald-700" />
                            <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">
                                Estoque saudável em todos os produtos.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                            {lowStock.slice(0, 5).map((p) => {
                                const isOut = p.quantity === 0;
                                return (
                                    <li key={p.id}>
                                        <button
                                            onClick={() => navigate(`/produtos/${p.id}`)}
                                            className="w-full text-left flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                        >
                                            <span
                                                className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                                                    isOut
                                                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                                                }`}
                                            >
                                                {isOut ? (
                                                    <PackageX className="w-4 h-4" />
                                                ) : (
                                                    <Package className="w-4 h-4" />
                                                )}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
                                                    {p.nameProduct}
                                                </p>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {p.quantity}/{p.minStock} {p.unit}
                                                </p>
                                            </div>
                                            <span
                                                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                                    isOut
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                                                }`}
                                            >
                                                {isOut ? 'Zerado' : 'Baixo'}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </SectionCard>
            </div>

            {/* Indicador de saúde geral */}
            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                        <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white">
                            Saúde do negócio
                        </h3>
                        <p className="text-[12.5px] text-slate-700 dark:text-slate-300 mt-1">
                            {cashFlow.net > 0 && lowStockCount === 0 && overdueReceivables.length === 0
                                ? 'Excelente. Fluxo de caixa positivo, estoque saudável e clientes em dia. 🎉'
                                : cashFlow.net < 0
                                  ? `Atenção: o saldo projetado é negativo em ${formatBRL(Math.abs(cashFlow.net))}. Revise pagamentos pendentes e priorize recebíveis.`
                                  : lowStockCount > 0
                                    ? `${lowStockCount} produto${lowStockCount === 1 ? '' : 's'} precisa${lowStockCount === 1 ? '' : 'm'} de reposição. Vá em Estoque crítico para ver a sugestão de compra.`
                                    : `${overdueReceivables.length} cliente${overdueReceivables.length === 1 ? '' : 's'} em atraso. Considere acionar a cobrança.`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
