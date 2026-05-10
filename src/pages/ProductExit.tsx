import { useState } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { toast } from 'sonner';
import { Minus, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

const GET_PRODUCTS = gql`
  query GetProductsForExit($search: String) {
    products(search: $search, take: 200) {
      id
      nameProduct
      quantity
      unit
      salePrice
    }
  }
`;

const QUICK_PRODUCT_EXIT = gql`
  mutation QuickProductExit(
    $productId: String!
    $quantity: Int!
    $reason: String!
    $notes: String
  ) {
    quickProductExit(
      productId: $productId
      quantity: $quantity
      reason: $reason
      notes: $notes
    ) {
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
  salePrice: number;
}

interface ProductExitProps {
  // Mantido para compat com chamada existente; não é mais usado.
  onAddExit?: (entry: any) => void;
  products?: Product[];
}

const REASONS = [
  { value: 'venda', label: 'Venda' },
  { value: 'perda', label: 'Perda/Avaria' },
  { value: 'devolucao', label: 'Devolução' },
  { value: 'transferencia', label: 'Transferência' },
];

export function ProductExit({ onAddExit }: ProductExitProps) {
  const { data, refetch } = useQuery<{ products: ProductRow[] }>(GET_PRODUCTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState<string>('venda');
  const [notes, setNotes] = useState('');
  const [doExit, { loading }] = useMutation(QUICK_PRODUCT_EXIT);

  const products = data?.products ?? [];
  const selected = products.find((p) => p.id === productId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) {
      toast.error('Selecione um produto.');
      return;
    }
    if (quantity <= 0) {
      toast.error('Quantidade deve ser maior que zero.');
      return;
    }
    if (quantity > selected.quantity) {
      toast.error(`Estoque insuficiente. Disponível: ${selected.quantity}.`);
      return;
    }
    try {
      await doExit({
        variables: {
          productId: selected.id,
          quantity,
          reason,
          notes: notes || null,
        },
      });
      toast.success(`Saída registrada: -${quantity} ${selected.nameProduct}.`);
      // Atualiza UI
      refetch();
      // Compat com legado (se algum componente pai espera callback)
      onAddExit?.({
        productId: selected.id,
        productName: selected.nameProduct,
        quantity,
        unitPrice: selected.salePrice,
        reason,
        notes,
        date: new Date().toISOString(),
      });
      setProductId('');
      setQuantity(0);
      setNotes('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao registrar saída.');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight dark:text-white mb-2">
          Saída de Produtos
        </h1>
        <p className="text-gray-600 dark:text-slate-300">
          Registra venda manual, perda, devolução ou transferência. Atualiza o estoque na hora.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-8 max-w-2xl">
        <div className="flex items-center mb-6">
          <ShoppingCart className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Registrar Saída</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Produto *
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Selecione um produto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameProduct} — Estoque: {p.quantity}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Quantidade *
              </label>
              <input
                type="number"
                min={1}
                value={quantity || ''}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Motivo *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Observações
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-white/15 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg"
            >
              <Minus className="w-4 h-4" />
              {loading ? 'Registrando…' : 'Registrar saída'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
