import { FormEvent, useMemo, useState } from 'react';
import { Product, RegisterSaleInput, Seller } from '../../sales-management/types';

interface SaleFormProps {
  sellers: Seller[];
  products: Product[];
  onSubmit: (payload: RegisterSaleInput) => Promise<void>;
  loading?: boolean;
}

export function SaleForm({ sellers, products, onSubmit, loading = false }: SaleFormProps) {
  const [sellerId, setSellerId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');

  const isDisabled = useMemo(() => loading || sellers.length === 0 || products.length === 0, [loading, products.length, sellers.length]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ sellerId, productId, quantity: Number(quantity) });
    setQuantity('1');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="text-base font-semibold">Registrar venda</h3>
      <select required value={sellerId} onChange={(e) => setSellerId(e.target.value)} className="w-full rounded border p-2">
        <option value="">Selecione o vendedor</option>
        {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
      </select>
      <select required value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded border p-2">
        <option value="">Selecione o produto</option>
        {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
      </select>
      <input required min="1" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded border p-2" />
      <button disabled={isDisabled} className="rounded bg-purple-700 px-4 py-2 text-white disabled:opacity-60">
        {loading ? 'Registrando...' : 'Registrar venda'}
      </button>
    </form>
  );
}
