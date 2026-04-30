import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Package, AlertTriangle, Tag } from 'lucide-react';
import { LIST_PRODUCTS_WITH_IMAGES } from '../../graphql/mutations/product-with-images';

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
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  images: ProductImage[];
  createdAt: string;
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);

export function ProductsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data, loading, error, refetch } = useQuery<{ products: Product[] }>(
    LIST_PRODUCTS_WITH_IMAGES,
    {
      variables: { search: search || undefined, take: 100, skip: 0 },
      fetchPolicy: 'cache-and-network',
    },
  );

  const products = data?.products ?? [];
  const total = products.length;
  const lowStock = products.filter((p) => p.quantity <= p.minStock).length;
  const inactive = products.filter((p) => p.status !== 'ACTIVE').length;

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-white/[0.06]">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white tracking-tight">
            Produtos cadastrados
          </h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">
            {loading ? 'Carregando…' : `${total} item(ns) no catálogo`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/produtos/cadastrar')}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Novo produto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat icon={<Package className="w-3.5 h-3.5" />} label="Total" value={total} accent="sky" />
        <Stat
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="Estoque baixo"
          value={lowStock}
          accent={lowStock > 0 ? 'amber' : 'slate'}
        />
        <Stat
          icon={<Tag className="w-3.5 h-3.5" />}
          label="Inativos"
          value={inactive}
          accent="slate"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
          <label className="relative flex items-center h-9 px-3 rounded-md bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
            <Search className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={1.75} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou SKU…"
              className="ml-2 flex-1 bg-transparent border-0 outline-none text-[13px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 p-0 m-0 focus:ring-0"
            />
          </label>
        </div>

        {error && (
          <div className="px-4 py-8 text-center text-rose-600 dark:text-rose-400 text-[13px]">
            Erro ao carregar produtos: {error.message}
            <button
              onClick={() => refetch()}
              className="ml-2 underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!error && !loading && products.length === 0 && (
          <div className="px-4 py-12 text-center">
            <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
            <p className="mt-3 text-[13.5px] font-medium text-slate-700 dark:text-slate-300">
              Nenhum produto cadastrado
            </p>
            <p className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
              Comece adicionando o primeiro item ao seu catálogo.
            </p>
            <button
              onClick={() => navigate('/produtos/cadastrar')}
              className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 text-[12.5px] font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar produto
            </button>
          </div>
        )}

        {products.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
            {products.map((p) => {
              const cover = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url;
              const low = p.quantity <= p.minStock;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-12 h-12 rounded-md bg-slate-100 dark:bg-white/[0.05] overflow-hidden shrink-0 flex items-center justify-center">
                    {cover ? (
                      <img src={cover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13.5px] font-medium text-slate-900 dark:text-white truncate">
                        {p.nameProduct}
                      </p>
                      {p.status !== 'ACTIVE' && (
                        <span className="text-[10.5px] uppercase tracking-wide font-medium text-slate-500 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
                          {p.status === 'OUT_OF_STOCK' ? 'Sem estoque' : 'Inativo'}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {p.sku ? <span className="font-mono">{p.sku}</span> : <em>sem SKU</em>}
                      <span className="mx-1.5">·</span>
                      <span className={low ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                        {p.quantity} {p.unit}{low && ' (baixo)'}
                      </span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13.5px] font-semibold text-slate-900 dark:text-white tabular-nums">
                      {formatBRL(p.salePrice)}
                    </p>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 tabular-nums">
                      custo {formatBRL(p.costPrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: 'sky' | 'amber' | 'slate';
}) {
  const palette = {
    sky: 'bg-sky-50 text-sky-700 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-500/20',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
    slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/[0.08]',
  } as const;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/[0.08] rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className={`w-7 h-7 rounded-md ring-1 flex items-center justify-center ${palette[accent]}`}>
          {icon}
        </span>
        <span className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-2.5 text-[24px] font-semibold leading-none text-slate-900 dark:text-white tabular-nums tracking-tight">
        {value}
      </p>
    </div>
  );
}
