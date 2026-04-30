import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    Download,
    Package,
    PackageX,
    Printer,
    RefreshCcw,
    Search,
    ShoppingBag,
} from 'lucide-react';
import { useLowStock, LowStockProduct } from '../../hooks/useLowStock';

type Severity = 'OUT' | 'CRITICAL' | 'WARNING';

function classify(p: LowStockProduct): Severity {
    if (p.quantity === 0) return 'OUT';
    if (p.minStock > 0 && p.quantity / p.minStock <= 0.5) return 'CRITICAL';
    return 'WARNING';
}

const SEVERITY_LABEL: Record<Severity, string> = {
    OUT: 'Sem estoque',
    CRITICAL: 'Crítico',
    WARNING: 'Atenção',
};

const SEVERITY_BADGE: Record<Severity, string> = {
    OUT: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
    CRITICAL: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400',
    WARNING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
};

function suggestReorder(p: LowStockProduct): number {
    // Sugestão simples: repor até 2x o estoque mínimo (buffer de 100%)
    const target = Math.max(p.minStock * 2, 1);
    return Math.max(0, target - p.quantity);
}

function formatBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function downloadCsv(rows: LowStockProduct[]) {
    const header = ['SKU', 'Produto', 'Estoque', 'Mínimo', 'Sugestão de compra', 'Unidade', 'Preço venda'];
    const lines = [header.join(';')];
    for (const p of rows) {
        const reorder = suggestReorder(p);
        lines.push(
            [
                p.sku ?? '',
                `"${p.nameProduct.replace(/"/g, '""')}"`,
                String(p.quantity),
                String(p.minStock),
                String(reorder),
                p.unit,
                p.salePrice.toFixed(2).replace('.', ','),
            ].join(';'),
        );
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoque-critico-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function StockAlertsReport() {
    const navigate = useNavigate();
    const { lowStock, loading, refetch } = useLowStock();
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return lowStock.filter((p) => {
            const matchesSearch =
                !term ||
                p.nameProduct.toLowerCase().includes(term) ||
                (p.sku ?? '').toLowerCase().includes(term);
            const matchesSeverity =
                severityFilter === 'all' || classify(p) === severityFilter;
            return matchesSearch && matchesSeverity;
        });
    }, [lowStock, search, severityFilter]);

    const stats = useMemo(() => {
        const out = lowStock.filter((p) => p.quantity === 0).length;
        const critical = lowStock.filter((p) => classify(p) === 'CRITICAL').length;
        const warning = lowStock.filter((p) => classify(p) === 'WARNING').length;
        const totalReorderUnits = lowStock.reduce((sum, p) => sum + suggestReorder(p), 0);
        const estimatedRevenueAtRisk = lowStock.reduce(
            (sum, p) => sum + p.salePrice * Math.max(0, p.minStock - p.quantity),
            0,
        );
        return { out, critical, warning, totalReorderUnits, estimatedRevenueAtRisk };
    }, [lowStock]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <div>
                        <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                            Estoque crítico
                        </h1>
                        <p className="text-[13px] text-slate-500 dark:text-slate-400">
                            Produtos no limite ou abaixo do estoque mínimo, com sugestão de reposição
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => refetch()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md disabled:opacity-50"
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                    <button
                        onClick={() => downloadCsv(filtered)}
                        disabled={filtered.length === 0}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Exportar CSV
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimir
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                    label="Sem estoque"
                    value={stats.out}
                    icon={<PackageX className="w-3.5 h-3.5" />}
                    accent="rose"
                />
                <StatCard
                    label="Crítico"
                    value={stats.critical}
                    icon={<AlertTriangle className="w-3.5 h-3.5" />}
                    accent="orange"
                />
                <StatCard
                    label="Atenção"
                    value={stats.warning}
                    icon={<AlertTriangle className="w-3.5 h-3.5" />}
                    accent="amber"
                />
                <StatCard
                    label="Reposição sugerida"
                    value={stats.totalReorderUnits}
                    icon={<ShoppingBag className="w-3.5 h-3.5" />}
                    accent="violet"
                    suffix="un"
                />
            </div>

            {stats.estimatedRevenueAtRisk > 0 && (
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-lg px-4 py-3 text-[13px] text-rose-800 dark:text-rose-200">
                    💸 Receita potencial em risco:{' '}
                    <strong className="tabular-nums">{formatBRL(stats.estimatedRevenueAtRisk)}</strong>{' '}
                    <span className="text-rose-700/80 dark:text-rose-300/80">
                        (preço de venda × unidades faltando para o mínimo)
                    </span>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou SKU..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                        />
                    </div>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                    >
                        <option value="all">Todos os níveis</option>
                        <option value="OUT">Sem estoque</option>
                        <option value="CRITICAL">Crítico</option>
                        <option value="WARNING">Atenção</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-950/40">
                            <tr>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Produto</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estoque</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mínimo</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Comprar</th>
                                <th className="px-4 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receita risco</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Severidade</th>
                                <th className="px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                            {loading && filtered.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-[13px] text-slate-500">Carregando...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <Package className="w-10 h-10 mx-auto text-emerald-300 dark:text-emerald-700" />
                                        <p className="mt-3 text-[13px] text-slate-500 dark:text-slate-400">
                                            Nenhum produto encontrado.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p) => {
                                    const sev = classify(p);
                                    const reorder = suggestReorder(p);
                                    const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
                                    const revenueAtRisk = p.salePrice * Math.max(0, p.minStock - p.quantity);
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded bg-slate-100 dark:bg-white/[0.05] overflow-hidden flex items-center justify-center shrink-0">
                                                        {cover ? (
                                                            <img src={cover} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-4 h-4 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate max-w-[260px]">
                                                            {p.nameProduct}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            {formatBRL(p.salePrice)} / {p.unit}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-[12px] text-slate-600 dark:text-slate-300 font-mono">
                                                {p.sku ?? <span className="text-slate-400">—</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className={`text-[13px] font-semibold tabular-nums ${
                                                        sev === 'OUT'
                                                            ? 'text-rose-600 dark:text-rose-400'
                                                            : sev === 'CRITICAL'
                                                              ? 'text-orange-600 dark:text-orange-400'
                                                              : 'text-amber-600 dark:text-amber-400'
                                                    }`}
                                                >
                                                    {p.quantity} {p.unit}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-[13px] text-slate-600 dark:text-slate-300 tabular-nums">
                                                {p.minStock}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-[12px] font-semibold tabular-nums">
                                                    +{reorder}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-[12px] text-rose-600 dark:text-rose-400 tabular-nums">
                                                {revenueAtRisk > 0 ? formatBRL(revenueAtRisk) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10.5px] font-semibold ${SEVERITY_BADGE[sev]}`}>
                                                    {SEVERITY_LABEL[sev]}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => navigate(`/produtos/${p.id}`)}
                                                    className="text-[12px] text-violet-600 dark:text-violet-400 font-medium hover:underline"
                                                >
                                                    Ver →
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    icon,
    accent,
    suffix,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    accent: 'rose' | 'orange' | 'amber' | 'violet';
    suffix?: string;
}) {
    const palette = {
        rose: 'bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
        orange: 'bg-orange-50 text-orange-700 ring-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20',
        amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        violet: 'bg-violet-50 text-violet-700 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    };
    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
            <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-md ring-1 flex items-center justify-center ${palette[accent]}`}>
                    {icon}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
                    {label}
                </span>
            </div>
            <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums">
                {value}
                {suffix && <span className="text-[14px] text-slate-400 ml-1">{suffix}</span>}
            </p>
        </div>
    );
}
