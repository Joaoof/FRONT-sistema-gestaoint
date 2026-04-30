import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
    ArrowDown,
    ArrowUp,
    Minus,
    Package,
    Plus,
    RotateCcw,
    X,
} from 'lucide-react';
import { UPDATE_PRODUCT_DETAIL } from '../../graphql/queries/product-detail';

type AdjustmentMode = 'add' | 'remove' | 'set';

interface StockAdjustmentModalProps {
    productId: string;
    productName: string;
    currentQuantity: number;
    minStock: number;
    unit: string;
    onClose: () => void;
    onSaved: () => void;
}

const REASONS_BY_MODE: Record<AdjustmentMode, string[]> = {
    add: ['Compra de fornecedor', 'Devolução de cliente', 'Transferência (entrada)', 'Ajuste manual'],
    remove: ['Venda manual', 'Perda / quebra', 'Devolução ao fornecedor', 'Transferência (saída)', 'Ajuste manual'],
    set: ['Inventário físico', 'Correção de cadastro'],
};

export function StockAdjustmentModal({
    productId,
    productName,
    currentQuantity,
    minStock,
    unit,
    onClose,
    onSaved,
}: StockAdjustmentModalProps) {
    const [mode, setMode] = useState<AdjustmentMode>('add');
    const [delta, setDelta] = useState<string>('1');
    const [reason, setReason] = useState<string>(REASONS_BY_MODE.add[0]);
    const [notes, setNotes] = useState('');

    const [updateProduct, { loading }] = useMutation(UPDATE_PRODUCT_DETAIL);

    const numericDelta = Math.max(0, Number.parseInt(delta || '0', 10) || 0);
    const newQuantity =
        mode === 'add'
            ? currentQuantity + numericDelta
            : mode === 'remove'
              ? Math.max(0, currentQuantity - numericDelta)
              : numericDelta;

    const willBeLowAfter = newQuantity <= minStock;
    const willBeOutAfter = newQuantity === 0;
    const invalidRemove = mode === 'remove' && numericDelta > currentQuantity;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (numericDelta === 0 && mode !== 'set') {
            toast.error('Informe uma quantidade válida.');
            return;
        }
        try {
            await updateProduct({
                variables: {
                    input: {
                        id: productId,
                        quantity: newQuantity,
                    },
                },
            });
            const verb = mode === 'add' ? 'Adicionado' : mode === 'remove' ? 'Removido' : 'Ajustado';
            toast.success(`${verb} ${mode === 'set' ? 'para' : ''} ${mode === 'set' ? newQuantity : numericDelta} ${unit}`, {
                description: notes ? `${reason} — ${notes}` : reason,
            });
            onSaved();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao ajustar estoque');
        }
    };

    const switchMode = (next: AdjustmentMode) => {
        setMode(next);
        setReason(REASONS_BY_MODE[next][0]);
        if (next === 'set') setDelta(currentQuantity.toString());
        else setDelta('1');
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-white/[0.06]">
                    <span className="w-9 h-9 rounded-lg bg-violet-500/15 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Package className="w-4 h-4" strokeWidth={2} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white truncate">Ajustar estoque</h3>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate">{productName}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                        aria-label="Fechar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
                    {/* Resumo */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Atual</p>
                            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                                {currentQuantity}
                            </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5 flex items-center justify-center">
                            <span className="text-slate-400 text-2xl">→</span>
                        </div>
                        <div
                            className={`rounded-lg p-2.5 ${
                                willBeOutAfter
                                    ? 'bg-rose-100 dark:bg-rose-500/15'
                                    : willBeLowAfter
                                      ? 'bg-amber-100 dark:bg-amber-500/15'
                                      : 'bg-emerald-100 dark:bg-emerald-500/15'
                            }`}
                        >
                            <p
                                className={`text-[10px] uppercase tracking-wide ${
                                    willBeOutAfter
                                        ? 'text-rose-700 dark:text-rose-300'
                                        : willBeLowAfter
                                          ? 'text-amber-800 dark:text-amber-300'
                                          : 'text-emerald-700 dark:text-emerald-300'
                                }`}
                            >
                                Novo
                            </p>
                            <p
                                className={`mt-1 text-lg font-bold tabular-nums ${
                                    willBeOutAfter
                                        ? 'text-rose-700 dark:text-rose-200'
                                        : willBeLowAfter
                                          ? 'text-amber-800 dark:text-amber-200'
                                          : 'text-emerald-700 dark:text-emerald-200'
                                }`}
                            >
                                {newQuantity}
                            </p>
                        </div>
                    </div>

                    {(willBeLowAfter || willBeOutAfter) && (
                        <div
                            className={`text-[11.5px] px-3 py-2 rounded-md ${
                                willBeOutAfter
                                    ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300'
                                    : 'bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300'
                            }`}
                        >
                            {willBeOutAfter
                                ? '⚠️ O produto ficará sem estoque após o ajuste.'
                                : `⚠️ Após o ajuste o estoque ficará ≤ mínimo (${minStock} ${unit}).`}
                        </div>
                    )}

                    {/* Modo */}
                    <div className="grid grid-cols-3 gap-1.5">
                        <ModeButton
                            active={mode === 'add'}
                            onClick={() => switchMode('add')}
                            color="emerald"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            label="Adicionar"
                        />
                        <ModeButton
                            active={mode === 'remove'}
                            onClick={() => switchMode('remove')}
                            color="rose"
                            icon={<Minus className="w-3.5 h-3.5" />}
                            label="Remover"
                        />
                        <ModeButton
                            active={mode === 'set'}
                            onClick={() => switchMode('set')}
                            color="violet"
                            icon={<RotateCcw className="w-3.5 h-3.5" />}
                            label="Definir"
                        />
                    </div>

                    {/* Quantidade */}
                    <div>
                        <label className="block text-[11.5px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            {mode === 'set' ? 'Nova quantidade total' : `Quantidade a ${mode === 'add' ? 'adicionar' : 'remover'}`}
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={delta}
                                onChange={(e) => setDelta(e.target.value)}
                                className={`w-full pl-3 pr-12 py-2.5 border rounded-lg text-lg font-semibold tabular-nums dark:bg-slate-800 dark:text-white ${
                                    invalidRemove
                                        ? 'border-rose-400 dark:border-rose-500/50'
                                        : 'border-gray-300 dark:border-white/15'
                                }`}
                                required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] font-medium text-slate-500 dark:text-slate-400 pointer-events-none">
                                {unit}
                            </span>
                        </div>
                        {invalidRemove && (
                            <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                <ArrowDown className="w-3 h-3" />
                                Não é possível remover mais do que há em estoque.
                            </p>
                        )}
                    </div>

                    {/* Motivo */}
                    <div>
                        <label className="block text-[11.5px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Motivo
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg text-[13px]"
                        >
                            {REASONS_BY_MODE[mode].map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Observação */}
                    <div>
                        <label className="block text-[11.5px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                            Observação <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            placeholder="Ex: NF #1234, lote XPTO..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg text-[13px]"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-[13px] font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || invalidRemove || (mode !== 'set' && numericDelta === 0)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium"
                        >
                            {mode === 'add' && <ArrowUp className="w-3.5 h-3.5" />}
                            {mode === 'remove' && <ArrowDown className="w-3.5 h-3.5" />}
                            {loading ? 'Salvando...' : 'Confirmar ajuste'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ModeButton({
    active,
    onClick,
    color,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    color: 'emerald' | 'rose' | 'violet';
    icon: React.ReactNode;
    label: string;
}) {
    const colorMap = {
        emerald: active
            ? 'bg-emerald-500 text-white border-emerald-500'
            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-emerald-300 hover:text-emerald-600 dark:hover:text-emerald-400',
        rose: active
            ? 'bg-rose-500 text-white border-rose-500'
            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-rose-300 hover:text-rose-600 dark:hover:text-rose-400',
        violet: active
            ? 'bg-violet-600 text-white border-violet-600'
            : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-violet-300 hover:text-violet-600 dark:hover:text-violet-400',
    };
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors ${colorMap[color]}`}
        >
            {icon}
            {label}
        </button>
    );
}
