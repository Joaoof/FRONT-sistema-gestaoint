import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    AlertTriangle,
    Download,
    Edit3,
    Grid3x3,
    List,
    Package,
    PackageX,
    Plus,
    Search,
    Sliders,
    Tag,
    Trash2,
} from 'lucide-react';
import { LIST_PRODUCTS_WITH_IMAGES, DELETE_PRODUCT_WITH_IMAGES } from '../../graphql/mutations/product-with-images';
import { ProductImage } from '../../components/ProductImage';
import { StockAdjustmentModal } from './StockAdjustmentModal';

interface ProductImage {
    id: string;
    url: string;
    isPrimary: boolean;
    order: number;
}

interface Product {
    id: string;
    sku: string | null;
    nameProduct: string;
    quantity: number;
    minStock: number;
    unit: string;
    costPrice: number;
    salePrice: number;
    status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
    images: ProductImage[];
    createdAt: string;
}

type ViewMode = 'list' | 'grid';
type StockFilter = 'all' | 'in-stock' | 'low' | 'out';
type StatusFilter = 'all' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

const formatBRL = (n: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

export function ProductsList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [view, setView] = useState<ViewMode>('list');
    const [stockFilter, setStockFilter] = useState<StockFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'value'>('name');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

    const { data, loading, error, refetch } = useQuery<{ products: Product[] }>(
        LIST_PRODUCTS_WITH_IMAGES,
        { variables: { search: search || undefined, take: 200, skip: 0 }, fetchPolicy: 'cache-and-network' },
    );
    const [deleteProduct, { loading: deleting }] = useMutation(DELETE_PRODUCT_WITH_IMAGES);

    const all = data?.products ?? [];

    const filtered = useMemo(() => {
        let list = [...all];

        if (stockFilter === 'out') list = list.filter((p) => p.quantity === 0);
        else if (stockFilter === 'low') list = list.filter((p) => p.quantity > 0 && p.quantity <= p.minStock);
        else if (stockFilter === 'in-stock') list = list.filter((p) => p.quantity > p.minStock);

        if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);

        list.sort((a, b) => {
            switch (sortBy) {
                case 'price':
                    return b.salePrice - a.salePrice;
                case 'stock':
                    return b.quantity - a.quantity;
                case 'value':
                    return b.costPrice * b.quantity - a.costPrice * a.quantity;
                default:
                    return a.nameProduct.localeCompare(b.nameProduct);
            }
        });

        return list;
    }, [all, stockFilter, statusFilter, sortBy]);

    const stats = useMemo(() => {
        return {
            total: all.length,
            active: all.filter((p) => p.status === 'ACTIVE').length,
            lowStock: all.filter((p) => p.quantity <= p.minStock).length,
            inactive: all.filter((p) => p.status !== 'ACTIVE').length,
            totalValue: all.reduce((s, p) => s + p.costPrice * p.quantity, 0),
            totalUnits: all.reduce((s, p) => s + p.quantity, 0),
        };
    }, [all]);

    function toggleSelect(id: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map((p) => p.id)));
    }

    async function handleDelete(id: string, name: string) {
        if (!window.confirm(`Excluir o produto "${name}"? Esta ação não pode ser desfeita.`)) return;
        setDeletingId(id);
        try {
            await deleteProduct({ variables: { id } });
            toast.success(`"${name}" excluído`);
            await refetch();
            setSelected((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (err: any) {
            toast.error(err?.message ?? 'Erro ao excluir');
        } finally {
            setDeletingId(null);
        }
    }

    async function handleBulkDelete() {
        if (selected.size === 0) return;
        if (!window.confirm(`Excluir ${selected.size} produto(s)? Esta ação não pode ser desfeita.`)) return;
        let success = 0;
        for (const id of selected) {
            try {
                await deleteProduct({ variables: { id } });
                success++;
            } catch {
                // continue
            }
        }
        toast.success(`${success} de ${selected.size} excluídos`);
        setSelected(new Set());
        refetch();
    }

    function exportCsv() {
        const header = ['SKU', 'Nome', 'Estoque', 'Mínimo', 'Unidade', 'Custo', 'Venda', 'Status'];
        const lines = [header.join(';')];
        for (const p of filtered) {
            lines.push(
                [
                    p.sku ?? '',
                    `"${p.nameProduct.replace(/"/g, '""')}"`,
                    p.quantity,
                    p.minStock,
                    p.unit,
                    p.costPrice.toFixed(2).replace('.', ','),
                    p.salePrice.toFixed(2).replace('.', ','),
                    p.status,
                ].join(';'),
            );
        }
        const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `produtos-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
                <div>
                    <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
                        Produtos
                    </h1>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
                        {loading ? 'Carregando…' : `${stats.total} produto${stats.total === 1 ? '' : 's'} no catálogo · ${stats.totalUnits.toLocaleString('pt-BR')} unidades · ${formatBRL(stats.totalValue)} imobilizado`}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={exportCsv}
                        disabled={filtered.length === 0}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-md disabled:opacity-50"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Exportar
                    </button>
                    <button
                        onClick={() => navigate('/produtos/cadastrar')}
                        className="inline-flex items-center gap-1.5 h-9 px-3 text-[12.5px] font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Novo produto
                    </button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatTile label="Total" value={stats.total} icon={<Package className="w-3.5 h-3.5" />} accent="sky" />
                <StatTile label="Ativos" value={stats.active} icon={<Tag className="w-3.5 h-3.5" />} accent="emerald" />
                <StatTile label="Estoque baixo" value={stats.lowStock} icon={<AlertTriangle className="w-3.5 h-3.5" />} accent={stats.lowStock > 0 ? 'amber' : 'slate'} />
                <StatTile label="Inativos" value={stats.inactive} icon={<PackageX className="w-3.5 h-3.5" />} accent="slate" />
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
                <div className="flex flex-col md:flex-row gap-2 px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome ou SKU…"
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[13px]"
                        />
                    </div>
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                        className="px-3 py-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[12.5px]"
                    >
                        <option value="all">Todo estoque</option>
                        <option value="in-stock">Em estoque</option>
                        <option value="low">Estoque baixo</option>
                        <option value="out">Sem estoque</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="px-3 py-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[12.5px]"
                    >
                        <option value="all">Todos status</option>
                        <option value="ACTIVE">Ativos</option>
                        <option value="INACTIVE">Inativos</option>
                        <option value="DISCONTINUED">Descontinuados</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 border border-slate-200 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-md text-[12.5px]"
                    >
                        <option value="name">Ordenar por nome</option>
                        <option value="price">Por preço</option>
                        <option value="stock">Por estoque</option>
                        <option value="value">Por valor imobilizado</option>
                    </select>
                    <div className="flex items-center border border-slate-200 dark:border-white/15 rounded-md">
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            title="Lista"
                            className={`p-2 ${view === 'list' ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white' : 'text-slate-500'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView('grid')}
                            title="Grade"
                            className={`p-2 ${view === 'grid' ? 'bg-slate-100 dark:bg-white/[0.06] text-slate-900 dark:text-white' : 'text-slate-500'}`}
                        >
                            <Grid3x3 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Bulk action bar */}
                {selected.size > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5 bg-violet-50 dark:bg-violet-500/10 border-b border-violet-200 dark:border-violet-500/20">
                        <span className="text-[12.5px] text-violet-800 dark:text-violet-200 font-medium">
                            {selected.size} selecionado{selected.size === 1 ? '' : 's'}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelected(new Set())}
                                className="text-[12px] text-violet-700 dark:text-violet-300 hover:underline"
                            >
                                Limpar
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={deleting}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[12px] font-medium disabled:opacity-50"
                            >
                                <Trash2 className="w-3 h-3" />
                                Excluir selecionados
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                {error ? (
                    <div className="px-4 py-8 text-center text-rose-600 dark:text-rose-400 text-[13px]">
                        Erro ao carregar produtos: {error.message}
                        <button onClick={() => refetch()} className="ml-2 underline">
                            Tentar novamente
                        </button>
                    </div>
                ) : !loading && filtered.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                        <p className="mt-3 text-[13.5px] font-medium text-slate-700 dark:text-slate-300">
                            {all.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado com os filtros atuais'}
                        </p>
                        {all.length === 0 && (
                            <button
                                onClick={() => navigate('/produtos/cadastrar')}
                                className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Cadastrar primeiro produto
                            </button>
                        )}
                    </div>
                ) : view === 'list' ? (
                    <ProductsTable
                        products={filtered}
                        selected={selected}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={toggleSelectAll}
                        onDelete={handleDelete}
                        onAdjust={(p) => setAdjustingProduct(p)}
                        deletingId={deletingId}
                    />
                ) : (
                    <ProductsGrid
                        products={filtered}
                        selected={selected}
                        onToggleSelect={toggleSelect}
                        onDelete={handleDelete}
                        onAdjust={(p) => setAdjustingProduct(p)}
                        deletingId={deletingId}
                    />
                )}
            </div>

            {adjustingProduct && (
                <StockAdjustmentModal
                    productId={adjustingProduct.id}
                    productName={adjustingProduct.nameProduct}
                    currentQuantity={adjustingProduct.quantity}
                    minStock={adjustingProduct.minStock}
                    unit={adjustingProduct.unit}
                    onClose={() => setAdjustingProduct(null)}
                    onSaved={() => {
                        setAdjustingProduct(null);
                        refetch();
                    }}
                />
            )}
        </div>
    );
}

function ProductsTable({
    products,
    selected,
    onToggleSelect,
    onToggleSelectAll,
    onDelete,
    onAdjust,
    deletingId,
}: {
    products: Product[];
    selected: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onDelete: (id: string, name: string) => void;
    onAdjust: (p: Product) => void;
    deletingId: string | null;
}) {
    const navigate = useNavigate();
    const allSelected = products.length > 0 && selected.size === products.length;

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-white/[0.06]">
                    <tr>
                        <th className="w-10 p-3">
                            <input
                                type="checkbox"
                                checked={allSelected}
                                onChange={onToggleSelectAll}
                                className="rounded border-slate-300"
                            />
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Produto
                        </th>
                        <th className="px-3 py-2.5 text-left text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            SKU
                        </th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Estoque
                        </th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Custo
                        </th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Venda
                        </th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Margem
                        </th>
                        <th className="px-3 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Valor
                        </th>
                        <th className="w-32 px-3 py-2.5 text-right text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    {products.map((p) => {
                        const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
                        const low = p.quantity <= p.minStock;
                        const out = p.quantity === 0;
                        const margin = p.salePrice > 0 ? ((p.salePrice - p.costPrice) / p.salePrice) * 100 : 0;
                        const totalValue = p.costPrice * p.quantity;
                        const isSelected = selected.has(p.id);

                        return (
                            <tr
                                key={p.id}
                                className={`hover:bg-slate-50 dark:hover:bg-white/[0.02] ${isSelected ? 'bg-violet-50 dark:bg-violet-500/[0.05]' : ''}`}
                            >
                                <td className="p-3">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(p.id)}
                                        className="rounded border-slate-300"
                                    />
                                </td>
                                <td className="px-3 py-2.5">
                                    <button
                                        type="button"
                                        onClick={() => navigate(`/produtos/${p.id}`)}
                                        className="flex items-center gap-3 text-left"
                                    >
                                        <ProductImage
                                            src={cover}
                                            alt={p.nameProduct}
                                            className="w-10 h-10 rounded object-cover shrink-0"
                                            fallbackClassName="w-10 h-10 rounded shrink-0"
                                            iconSize={18}
                                        />
                                        <div>
                                            <p className="text-[13px] font-medium text-slate-900 dark:text-white max-w-[260px] truncate">
                                                {p.nameProduct}
                                            </p>
                                            {p.status !== 'ACTIVE' && (
                                                <span className="text-[10px] uppercase tracking-wide text-slate-500">
                                                    {p.status === 'INACTIVE' ? 'Inativo' : 'Descontinuado'}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                </td>
                                <td className="px-3 py-2.5 text-[12px] font-mono text-slate-600 dark:text-slate-300">
                                    {p.sku ?? <span className="text-slate-400">—</span>}
                                </td>
                                <td className="px-3 py-2.5 text-right">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-semibold tabular-nums ${
                                            out
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                                                : low
                                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                                                  : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        {p.quantity} {p.unit}
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-right text-[12.5px] text-slate-600 dark:text-slate-300 tabular-nums">
                                    {formatBRL(p.costPrice)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-[12.5px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {formatBRL(p.salePrice)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-[12px] tabular-nums">
                                    <span
                                        className={
                                            margin >= 30
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : margin >= 10
                                                  ? 'text-amber-600 dark:text-amber-400'
                                                  : 'text-rose-600 dark:text-rose-400'
                                        }
                                    >
                                        {margin.toFixed(1)}%
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-right text-[12px] text-slate-600 dark:text-slate-300 tabular-nums">
                                    {formatBRL(totalValue)}
                                </td>
                                <td className="px-3 py-2.5">
                                    <div className="flex items-center gap-1 justify-end">
                                        <button
                                            onClick={() => onAdjust(p)}
                                            title="Ajustar estoque"
                                            className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded"
                                        >
                                            <Sliders className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => navigate(`/produtos/${p.id}`)}
                                            title="Editar"
                                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(p.id, p.nameProduct)}
                                            disabled={deletingId === p.id}
                                            title="Excluir"
                                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded disabled:opacity-50"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function ProductsGrid({
    products,
    selected,
    onToggleSelect,
    onDelete,
    onAdjust,
    deletingId,
}: {
    products: Product[];
    selected: Set<string>;
    onToggleSelect: (id: string) => void;
    onDelete: (id: string, name: string) => void;
    onAdjust: (p: Product) => void;
    deletingId: string | null;
}) {
    const navigate = useNavigate();

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {products.map((p) => {
                const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
                const low = p.quantity <= p.minStock;
                const out = p.quantity === 0;
                const isSelected = selected.has(p.id);

                return (
                    <div
                        key={p.id}
                        className={`relative bg-white dark:bg-slate-900 border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                            isSelected
                                ? 'border-violet-400 dark:border-violet-500/40 ring-2 ring-violet-200 dark:ring-violet-500/20'
                                : 'border-slate-200 dark:border-white/[0.08]'
                        }`}
                    >
                        <div className="absolute top-2 left-2 z-10">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelect(p.id)}
                                className="rounded border-slate-300 w-4 h-4"
                            />
                        </div>
                        {(out || low) && (
                            <span
                                className={`absolute top-2 right-2 z-10 inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                    out
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-amber-500 text-white'
                                }`}
                            >
                                {out ? 'Zerado' : 'Baixo'}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => navigate(`/produtos/${p.id}`)}
                            className="block w-full text-left"
                        >
                            <ProductImage
                                src={cover}
                                alt={p.nameProduct}
                                className="w-full aspect-square object-cover"
                                fallbackClassName="w-full aspect-square"
                                iconSize={36}
                            />
                            <div className="p-3">
                                <p className="text-[12.5px] font-medium text-slate-900 dark:text-white truncate">
                                    {p.nameProduct}
                                </p>
                                {p.sku && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                                        {p.sku}
                                    </p>
                                )}
                                <div className="flex items-baseline justify-between mt-2">
                                    <span className="text-[14px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                        {formatBRL(p.salePrice)}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                                        {p.quantity} {p.unit}
                                    </span>
                                </div>
                            </div>
                        </button>
                        <div className="flex border-t border-slate-100 dark:border-white/[0.06]">
                            <button
                                onClick={() => onAdjust(p)}
                                title="Ajustar"
                                className="flex-1 py-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 flex items-center justify-center"
                            >
                                <Sliders className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => navigate(`/produtos/${p.id}`)}
                                title="Editar"
                                className="flex-1 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center border-l border-slate-100 dark:border-white/[0.06]"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => onDelete(p.id, p.nameProduct)}
                                disabled={deletingId === p.id}
                                title="Excluir"
                                className="flex-1 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center border-l border-slate-100 dark:border-white/[0.06] disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function StatTile({
    label,
    value,
    icon,
    accent,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    accent: 'sky' | 'emerald' | 'amber' | 'slate';
}) {
    const palette = {
        sky: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/[0.08]',
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
            </p>
        </div>
    );
}
