import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, PackageX } from 'lucide-react';
import { useLowStock } from '../hooks/useLowStock';
import { ProductImage } from './ProductImage';

export function LowStockAlert() {
    const navigate = useNavigate();
    const { lowStock, outOfStockCount, count, loading } = useLowStock();

    if (loading && lowStock.length === 0) return null;
    if (count === 0) return null;

    const top = lowStock.slice(0, 5);
    const remaining = count - top.length;

    return (
        <section
            aria-labelledby="low-stock-heading"
            className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/20 rounded-xl overflow-hidden"
        >
            <header className="flex items-center gap-3 px-5 py-4 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
                <span className="w-9 h-9 rounded-lg bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                    <h2
                        id="low-stock-heading"
                        className="text-[14px] font-semibold text-amber-900 dark:text-amber-200"
                    >
                        Estoque baixo
                    </h2>
                    <p className="text-[12px] text-amber-700 dark:text-amber-300/80">
                        {count} produto{count === 1 ? '' : 's'} no limite ou abaixo do estoque mínimo
                        {outOfStockCount > 0 && (
                            <>
                                {' '}
                                — <span className="font-semibold">{outOfStockCount} sem estoque</span>
                            </>
                        )}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/produtos')}
                    className="hidden sm:inline-flex items-center gap-1 h-8 px-3 text-[12px] font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-500/15 rounded-md"
                >
                    Ver tudo
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </header>

            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {top.map((p) => {
                    const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
                    const isOut = p.quantity === 0;
                    return (
                        <li key={p.id}>
                            <button
                                type="button"
                                onClick={() => navigate(`/produtos/${p.id}`)}
                                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] text-left transition-colors"
                            >
                                <ProductImage
                                    src={cover}
                                    alt={p.nameProduct}
                                    className="w-10 h-10 rounded-md object-cover shrink-0"
                                    fallbackClassName="w-10 h-10 rounded-md shrink-0"
                                    iconSize={16}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium text-slate-900 dark:text-white truncate">
                                        {p.nameProduct}
                                    </p>
                                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                        {p.sku ? <span className="font-mono">{p.sku}</span> : <em>sem SKU</em>}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                            isOut
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                                        }`}
                                    >
                                        {isOut && <PackageX className="w-3 h-3" />}
                                        {isOut ? 'Sem estoque' : `${p.quantity} ${p.unit}`}
                                    </span>
                                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                                        mín. {p.minStock}
                                    </p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                            </button>
                        </li>
                    );
                })}
            </ul>

            {remaining > 0 && (
                <div className="px-5 py-2.5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                    <button
                        type="button"
                        onClick={() => navigate('/produtos')}
                        className="text-[12px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                        +{remaining} produto{remaining === 1 ? '' : 's'} adicional{remaining === 1 ? '' : 'is'} com estoque baixo
                    </button>
                </div>
            )}
        </section>
    );
}
