import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
    AlertTriangle,
    ArrowDownCircle,
    ArrowUpCircle,
    CheckCircle2,
    Clock,
    PackageX,
} from 'lucide-react';
import {
    GET_ACCOUNTS_PAYABLE,
    GET_ACCOUNTS_RECEIVABLE,
} from '../graphql/queries/accounts';
import {
    AccountPayableData,
    AccountReceivableData,
    formatBRL,
} from '../types/accounts';
import { useLowStock } from '../hooks/useLowStock';

interface ActivityItem {
    id: string;
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    subtitle: string;
    timestamp: number;
    timestampLabel: string;
    onClick?: () => void;
    badge?: { label: string; cls: string };
}

function timeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'agora';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min atrás`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h atrás`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d atrás`;
    return date.toLocaleDateString('pt-BR');
}

export function RecentActivityWidget() {
    const navigate = useNavigate();
    const { data: receivablesData } = useQuery<{ accountsReceivable: AccountReceivableData[] }>(
        GET_ACCOUNTS_RECEIVABLE,
        { fetchPolicy: 'cache-and-network' },
    );
    const { data: payablesData } = useQuery<{ accountsPayable: AccountPayableData[] }>(
        GET_ACCOUNTS_PAYABLE,
        { fetchPolicy: 'cache-and-network' },
    );
    const { lowStock } = useLowStock();

    const items = useMemo<ActivityItem[]>(() => {
        const list: ActivityItem[] = [];

        for (const r of receivablesData?.accountsReceivable ?? []) {
            const ts = new Date(r.updatedAt ?? r.createdAt);
            const isPaid = r.status === 'PAID';
            const isOverdue = r.daysOverdue > 0 && r.status !== 'PAID' && r.status !== 'CANCELED';
            list.push({
                id: `recv-${r.id}`,
                icon: isPaid ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isOverdue ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                ),
                iconBg: isPaid
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : isOverdue
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
                title: isPaid
                    ? `Recebido: ${r.customer?.name ?? 'Cliente'}`
                    : isOverdue
                      ? `Atrasada (${r.daysOverdue}d): ${r.customer?.name ?? 'Cliente'}`
                      : `A receber: ${r.customer?.name ?? 'Cliente'}`,
                subtitle: `${formatBRL(r.finalAmount)} · ${r.description}`,
                timestamp: ts.getTime(),
                timestampLabel: timeAgo(ts),
                onClick: () => navigate('/listar-contas-receber'),
                badge: isOverdue
                    ? { label: 'Vencida', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' }
                    : undefined,
            });
        }

        for (const p of payablesData?.accountsPayable ?? []) {
            const ts = new Date(p.updatedAt ?? p.createdAt);
            const isPaid = p.status === 'PAID';
            const isOverdue = p.daysOverdue > 0 && p.status !== 'PAID' && p.status !== 'CANCELED';
            list.push({
                id: `pay-${p.id}`,
                icon: isPaid ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isOverdue ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                ) : (
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                ),
                iconBg: isPaid
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : isOverdue
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                title: isPaid
                    ? `Pago: ${p.supplierName}`
                    : isOverdue
                      ? `Atrasada (${p.daysOverdue}d): ${p.supplierName}`
                      : `A pagar: ${p.supplierName}`,
                subtitle: `${formatBRL(p.finalAmount)} · ${p.description}`,
                timestamp: ts.getTime(),
                timestampLabel: timeAgo(ts),
                onClick: () => navigate('/listar-contas-pagas'),
                badge: isOverdue
                    ? { label: 'Vencida', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' }
                    : undefined,
            });
        }

        for (const product of lowStock.slice(0, 5)) {
            const isOut = product.quantity === 0;
            list.push({
                id: `stock-${product.id}`,
                icon: isOut ? <PackageX className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />,
                iconBg: isOut
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                title: isOut ? `Sem estoque: ${product.nameProduct}` : `Estoque baixo: ${product.nameProduct}`,
                subtitle: `${product.quantity}/${product.minStock} ${product.unit}`,
                timestamp: Date.now(),
                timestampLabel: 'agora',
                onClick: () => navigate(`/produtos/${product.id}`),
                badge: isOut
                    ? { label: 'Crítico', cls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400' }
                    : { label: 'Atenção', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300' },
            });
        }

        return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
    }, [receivablesData, payablesData, lowStock, navigate]);

    return (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
            <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
                <div>
                    <h2 className="text-[14px] font-semibold text-slate-900 dark:text-white">Atividade recente</h2>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Últimas movimentações financeiras e alertas operacionais
                    </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="relative w-1.5 h-1.5">
                        <span className="absolute inset-0 rounded-full bg-emerald-500" />
                        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-70" />
                    </span>
                    Ao vivo
                </span>
            </header>

            {items.length === 0 ? (
                <div className="px-5 py-12 text-center text-[13px] text-slate-500 dark:text-slate-400">
                    Nenhuma atividade recente.
                </div>
            ) : (
                <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {items.map((item) => (
                        <li key={item.id}>
                            <button
                                type="button"
                                onClick={item.onClick}
                                className="w-full text-left flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                            >
                                <span
                                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${item.iconBg}`}
                                >
                                    {item.icon}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
                                            {item.title}
                                        </p>
                                        {item.badge && (
                                            <span
                                                className={`shrink-0 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${item.badge.cls}`}
                                            >
                                                {item.badge.label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {item.subtitle}
                                    </p>
                                </div>
                                <span className="shrink-0 inline-flex items-center gap-1 text-[10.5px] text-slate-400 dark:text-slate-500 tabular-nums">
                                    <Clock className="w-2.5 h-2.5" />
                                    {item.timestampLabel}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
