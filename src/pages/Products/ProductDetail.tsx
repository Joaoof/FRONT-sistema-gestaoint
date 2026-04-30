import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import {
    AlertTriangle,
    ArrowLeft,
    Box,
    Edit3,
    Package,
    Save,
    Sliders,
    Tag,
    X,
} from 'lucide-react';
import {
    GET_PRODUCT_DETAIL,
    UPDATE_PRODUCT_DETAIL,
} from '../../graphql/queries/product-detail';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface ProductImage {
    id: string;
    url: string;
    isPrimary: boolean;
    order: number;
}

interface ProductDetail {
    id: string;
    sku: string | null;
    nameProduct: string;
    quantity: number;
    minStock: number;
    unit: string;
    weight: number | null;
    costPrice: number;
    salePrice: number;
    status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
    categoryId: string | null;
    supplierId: string | null;
    description: string | null;
    images: ProductImage[];
    createdAt: string;
    updatedAt: string;
}

interface FormState {
    nameProduct: string;
    sku: string;
    unit: string;
    quantity: number;
    minStock: number;
    weight: number | null;
    costPrice: number;
    salePrice: number;
    description: string;
    active: boolean;
}

const formatBRL = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function StatusBadge({ status }: { status: ProductDetail['status'] }) {
    const map = {
        ACTIVE: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400', label: 'Ativo' },
        INACTIVE: { cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400', label: 'Inativo' },
        DISCONTINUED: { cls: 'bg-rose-100 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400', label: 'Descontinuado' },
    };
    const m = map[status];
    return <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${m.cls}`}>{m.label}</span>;
}

export function ProductDetail() {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [adjusting, setAdjusting] = useState(false);
    const [form, setForm] = useState<FormState | null>(null);

    const { data, loading, refetch } = useQuery<{ product: ProductDetail | null }>(
        GET_PRODUCT_DETAIL,
        { variables: { id }, fetchPolicy: 'cache-and-network', skip: !id },
    );

    const [updateProduct, { loading: saving }] = useMutation(UPDATE_PRODUCT_DETAIL);

    useEffect(() => {
        if (data?.product) {
            setForm({
                nameProduct: data.product.nameProduct,
                sku: data.product.sku ?? '',
                unit: data.product.unit,
                quantity: data.product.quantity,
                minStock: data.product.minStock,
                weight: data.product.weight,
                costPrice: data.product.costPrice,
                salePrice: data.product.salePrice,
                description: data.product.description ?? '',
                active: data.product.status === 'ACTIVE',
            });
        }
    }, [data?.product]);

    const product = data?.product;

    if (loading && !product) {
        return (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                Carregando produto...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="p-12 text-center">
                <Package className="w-12 h-12 mx-auto text-slate-300" />
                <p className="mt-4 text-slate-500 dark:text-slate-400">Produto não encontrado.</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 dark:text-blue-400">← Voltar</button>
            </div>
        );
    }

    const cover = product.images.find((i) => i.isPrimary) ?? product.images[0];
    const lowStock = product.quantity <= product.minStock;

    const handleSave = async () => {
        if (!form) return;
        try {
            await updateProduct({
                variables: {
                    input: {
                        id: product.id,
                        nameProduct: form.nameProduct,
                        sku: form.sku || undefined,
                        unit: form.unit,
                        quantity: Number(form.quantity),
                        minStock: Number(form.minStock),
                        weight: form.weight !== null ? Number(form.weight) : undefined,
                        costPrice: Number(form.costPrice),
                        salePrice: Number(form.salePrice),
                        description: form.description || undefined,
                        active: form.active,
                    },
                },
            });
            toast.success('Produto atualizado');
            setEditing(false);
            refetch();
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao atualizar produto');
        }
    };

    const margin =
        product.costPrice > 0
            ? ((product.salePrice - product.costPrice) / product.costPrice) * 100
            : 0;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <div className="flex items-center gap-2">
                    {!editing ? (
                        <>
                            <button
                                onClick={() => setAdjusting(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                            >
                                <Sliders className="w-4 h-4" /> Ajustar estoque
                            </button>
                            <button
                                onClick={() => setEditing(true)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Edit3 className="w-4 h-4" /> Editar
                            </button>
                        </>
                    ) : null}
                    {editing && (
                        <>
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    if (product) {
                                        setForm({
                                            nameProduct: product.nameProduct,
                                            sku: product.sku ?? '',
                                            unit: product.unit,
                                            quantity: product.quantity,
                                            minStock: product.minStock,
                                            weight: product.weight,
                                            costPrice: product.costPrice,
                                            salePrice: product.salePrice,
                                            description: product.description ?? '',
                                            active: product.status === 'ACTIVE',
                                        });
                                    }
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
                            >
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {lowStock && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold">Estoque baixo!</p>
                        <p>Restam apenas <span className="font-bold">{product.quantity} {product.unit}</span> deste produto. Estoque mínimo: <span className="font-bold">{product.minStock} {product.unit}</span>.</p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                    <div className="md:col-span-1">
                        {cover ? (
                            <img
                                src={cover.url}
                                alt={product.nameProduct}
                                className="w-full aspect-square object-cover rounded-lg border border-slate-200 dark:border-white/10"
                            />
                        ) : (
                            <div className="w-full aspect-square rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <Package className="w-16 h-16 text-slate-400" />
                            </div>
                        )}
                        {product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {product.images.slice(0, 4).map((img) => (
                                    <img
                                        key={img.id}
                                        src={img.url}
                                        alt=""
                                        className="aspect-square object-cover rounded border border-slate-200 dark:border-white/10"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-5">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <StatusBadge status={product.status} />
                                {product.sku && (
                                    <span className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400">
                                        <Tag className="w-3 h-3" />
                                        SKU: <span className="font-mono">{product.sku}</span>
                                    </span>
                                )}
                            </div>
                            {editing && form ? (
                                <input
                                    value={form.nameProduct}
                                    onChange={(e) => setForm({ ...form, nameProduct: e.target.value })}
                                    className="w-full text-2xl font-semibold p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                />
                            ) : (
                                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                    {product.nameProduct}
                                </h1>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Preço de venda</p>
                                {editing && form ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.salePrice}
                                        onChange={(e) => setForm({ ...form, salePrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full mt-1 p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-lg font-semibold"
                                    />
                                ) : (
                                    <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                        {formatBRL(product.salePrice)}
                                    </p>
                                )}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Preço de custo</p>
                                {editing && form ? (
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.costPrice}
                                        onChange={(e) => setForm({ ...form, costPrice: parseFloat(e.target.value) || 0 })}
                                        className="w-full mt-1 p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded text-lg font-semibold"
                                    />
                                ) : (
                                    <p className="text-2xl font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                                        {formatBRL(product.costPrice)}
                                    </p>
                                )}
                                <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">
                                    Margem: <span className={margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{margin.toFixed(1)}%</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <FieldDisplay
                                label="Estoque"
                                value={editing && form ? (
                                    <input
                                        type="number"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                                    />
                                ) : (
                                    <span className={lowStock ? 'text-amber-600 dark:text-amber-400' : ''}>
                                        {product.quantity} {product.unit}
                                    </span>
                                )}
                                icon={<Box className="w-3 h-3" />}
                            />
                            <FieldDisplay
                                label="Estoque mín."
                                value={editing && form ? (
                                    <input
                                        type="number"
                                        value={form.minStock}
                                        onChange={(e) => setForm({ ...form, minStock: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                                    />
                                ) : `${product.minStock}`}
                            />
                            <FieldDisplay
                                label="Unidade"
                                value={editing && form ? (
                                    <input
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                        className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                                    />
                                ) : product.unit}
                            />
                            <FieldDisplay
                                label="Peso"
                                value={editing && form ? (
                                    <input
                                        type="number"
                                        step="0.001"
                                        value={form.weight ?? ''}
                                        onChange={(e) => setForm({ ...form, weight: e.target.value ? parseFloat(e.target.value) : null })}
                                        className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                                    />
                                ) : product.weight !== null ? `${product.weight} kg` : '—'}
                            />
                        </div>

                        {editing && form && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">SKU</label>
                                <input
                                    value={form.sku}
                                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                    className="w-full p-2 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded"
                                />
                            </div>
                        )}

                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Descrição</p>
                            {editing && form ? (
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
                                />
                            ) : (
                                <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                    {product.description || <span className="text-slate-400">Sem descrição</span>}
                                </p>
                            )}
                        </div>

                        {editing && form && (
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                                />
                                Produto ativo
                            </label>
                        )}

                        <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] grid grid-cols-2 gap-3 text-[12px] text-slate-500 dark:text-slate-400">
                            <div>
                                <span className="block text-[10px] uppercase tracking-wide">Criado em</span>
                                <span>{new Date(product.createdAt).toLocaleString('pt-BR')}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] uppercase tracking-wide">Última atualização</span>
                                <span>{new Date(product.updatedAt).toLocaleString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {adjusting && (
                <StockAdjustmentModal
                    productId={product.id}
                    productName={product.nameProduct}
                    currentQuantity={product.quantity}
                    minStock={product.minStock}
                    unit={product.unit}
                    onClose={() => setAdjusting(false)}
                    onSaved={() => {
                        setAdjusting(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

function FieldDisplay({
    label,
    value,
    icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
}) {
    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1">
                {icon}
                {label}
            </p>
            <div className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200 tabular-nums">
                {value}
            </div>
        </div>
    );
}
