import { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { toast } from 'sonner';
import { Plus, Factory } from 'lucide-react';

const GET_PRODUCTS = gql`
  query GetProductsForProduction($search: String) {
    products(search: $search, take: 200) {
      id
      nameProduct
      quantity
      unit
    }
  }
`;

const QUICK_PRODUCTION_ENTRY = gql`
  mutation QuickProductionEntry($productId: String!, $quantity: Int!, $notes: String) {
    quickProductionEntry(productId: $productId, quantity: $quantity, notes: $notes) {
      id
      nameProduct
      quantity
    }
  }
`;

interface ProductRow {
  id: string;
  nameProduct: string;
  quantity: number;
  unit: string;
}

interface PendingLine {
  productId: string;
  productName: string;
  quantity: number;
}

export function ProductionEntry() {
  const { data, refetch } = useQuery<{ products: ProductRow[] }>(GET_PRODUCTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState<PendingLine[]>([]);

  const [doEntry, { loading }] = useMutation(QUICK_PRODUCTION_ENTRY);

  const products = data?.products ?? [];
  const selected = products.find((p) => p.id === productId);

  const addLine = () => {
    if (!selected || quantity <= 0) {
      toast.error('Selecione um produto e quantidade.');
      return;
    }
    setPending((prev) => [
      ...prev,
      { productId: selected.id, productName: selected.nameProduct, quantity },
    ]);
    setProductId('');
    setQuantity(0);
  };

  const submitAll = async () => {
    if (pending.length === 0) {
      toast.error('Nenhum item para registrar.');
      return;
    }
    let ok = 0;
    for (const line of pending) {
      try {
        await doEntry({
          variables: {
            productId: line.productId,
            quantity: line.quantity,
            notes: notes || null,
          },
        });
        ok += 1;
      } catch (err: any) {
        toast.error(`Falha em ${line.productName}: ${err.message}`);
      }
    }
    if (ok > 0) {
      toast.success(`${ok} produto(s) lançado(s) na produção.`);
      setPending([]);
      setNotes('');
      refetch();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Factory className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <div>
          <h1 className="text-[22px] font-semibold text-slate-900 dark:text-white">Entrada de produção</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registre o que foi produzido hoje. Atualiza o estoque automaticamente.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Produto</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
            >
              <option value="">Selecione um produto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameProduct} (estoque: {p.quantity}{p.unit ? ` ${p.unit}` : ''})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantity || ''}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLine();
                }
              }}
              className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addLine}
          className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
        >
          <Plus className="w-4 h-4" /> Adicionar linha
        </button>
      </div>

      {pending.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">A lançar</h2>
          <ul className="divide-y divide-slate-200 dark:divide-white/10">
            {pending.map((line, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate-800 dark:text-slate-100">{line.productName}</span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold tabular-nums">+{line.quantity}</span>
                  <button
                    onClick={() => setPending((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    remover
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Observações (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Ex: "Galego — produção do dia"'
              className="w-full p-2 border border-slate-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg"
            />
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={submitAll}
              disabled={loading}
              className="inline-flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg"
            >
              {loading ? 'Lançando…' : 'Lançar tudo no estoque'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
