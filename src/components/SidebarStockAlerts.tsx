import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    ChevronDown,
    ExternalLink,
    Package,
    PackageX,
    RefreshCcw,
} from 'lucide-react';
import { useLowStock } from '../hooks/useLowStock';

export function SidebarStockAlerts() {
    const navigate = useNavigate();
    const { lowStock, outOfStockCount, criticalCount, count, loading, refetch } = useLowStock();
    const [expanded, setExpanded] = useState(true);

    const top = lowStock.slice(0, 6);
    const remaining = count - top.length;

    return (
        <div className="mt-4 mx-2 mb-2">
            <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                    count > 0
                        ? outOfStockCount > 0
                            ? 'bg-rose-500/10 hover:bg-rose-500/15'
                            : 'bg-amber-500/10 hover:bg-amber-500/15'
                        : 'bg-emerald-500/5 hover:bg-emerald-500/10'
                }`}
                aria-expanded={expanded}
            >
                <span
                    className={`relative w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                        count > 0
                            ? outOfStockCount > 0
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                    }`}
                >
                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                    {count > 0 && (
                        <span
                            className={`absolute inset-0 rounded animate-ping ${
                                outOfStockCount > 0 ? 'bg-rose-500/30' : 'bg-amber-500/30'
                            }`}
                            aria-hidden
                        />
                    )}
                </span>
                <div className="flex-1 min-w-0 text-left">
                    <p
                        className={`text-[11.5px] font-semibold leading-tight ${
                            count > 0
                                ? outOfStockCount > 0
                                    ? 'text-rose-200'
                                    : 'text-amber-200'
                                : 'text-emerald-200'
                        }`}
                    >
                        {count > 0 ? `Estoque crítico (${count})` : 'Estoque OK'}
                    </p>
                    <p className="text-[10.5px] text-slate-400 leading-tight mt-0.5 truncate">
                        {count === 0
                            ? 'Todos os produtos acima do mínimo'
                            : outOfStockCount > 0
                              ? `${outOfStockCount} sem estoque · ${criticalCount} crítico${criticalCount === 1 ? '' : 's'}`
                              : `${criticalCount} crítico${criticalCount === 1 ? '' : 's'} · ${count - criticalCount} próximo${count - criticalCount === 1 ? '' : 's'} do limite`}
                    </p>
                </div>
                <motion.span
                    animate={{ rotate: expanded ? 0 : -90 }}
                    transition={{ duration: 0.18 }}
                    className="text-slate-500 shrink-0"
                    aria-hidden
                >
                    <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {expanded && count > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <ul className="mt-2 space-y-1">
                            {top.map((p) => {
                                const isOut = p.quantity === 0;
                                const ratio = p.minStock > 0 ? Math.min(100, (p.quantity / p.minStock) * 100) : 0;
                                const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
                                return (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/produtos/${p.id}`)}
                                            className="w-full text-left px-2 py-1.5 rounded-md hover:bg-white/[0.05] transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded bg-white/[0.06] overflow-hidden flex items-center justify-center shrink-0">
                                                    {cover ? (
                                                        <img src={cover} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-3 h-3 text-slate-500" strokeWidth={1.5} />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11.5px] font-medium text-slate-200 truncate group-hover:text-white">
                                                        {p.nameProduct}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span
                                                            className={`text-[10px] font-semibold ${
                                                                isOut ? 'text-rose-400' : 'text-amber-400'
                                                            } tabular-nums`}
                                                        >
                                                            {isOut ? (
                                                                <span className="inline-flex items-center gap-0.5">
                                                                    <PackageX className="w-2.5 h-2.5" />
                                                                    Zerado
                                                                </span>
                                                            ) : (
                                                                `${p.quantity} ${p.unit}`
                                                            )}
                                                        </span>
                                                        <span className="text-[9.5px] text-slate-500 tabular-nums">
                                                            mín {p.minStock}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-300 shrink-0" />
                                            </div>
                                            <div className="mt-1.5 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        isOut
                                                            ? 'bg-rose-500'
                                                            : ratio <= 50
                                                              ? 'bg-amber-500'
                                                              : 'bg-yellow-500'
                                                    }`}
                                                    style={{ width: `${Math.max(2, ratio)}%` }}
                                                />
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="mt-2 flex items-center gap-1">
                            {remaining > 0 && (
                                <button
                                    type="button"
                                    onClick={() => navigate('/estoque/alertas')}
                                    className="flex-1 text-[10.5px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/[0.04] transition-colors text-left"
                                >
                                    +{remaining} a mais →
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => refetch()}
                                disabled={loading}
                                title="Atualizar agora"
                                className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                            >
                                <RefreshCcw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} strokeWidth={2} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/estoque/alertas')}
                            className="w-full mt-1 text-[11px] font-medium text-violet-300 hover:text-violet-200 px-2 py-1.5 rounded hover:bg-violet-500/10 transition-colors"
                        >
                            Ver relatório completo →
                        </button>
                    </motion.div>
                )}

                {expanded && count === 0 && !loading && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="px-2 pt-2 text-[10.5px] text-slate-500">
                            Tudo em ordem! Nenhum produto abaixo do estoque mínimo.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
