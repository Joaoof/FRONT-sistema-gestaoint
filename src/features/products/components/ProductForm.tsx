import { FormEvent, useState } from 'react';
import { CreateProductInput } from '../../sales-management/types';

interface ProductFormProps {
  onSubmit: (payload: CreateProductInput) => Promise<void>;
  loading?: boolean;
}

export function ProductForm({ onSubmit, loading = false }: ProductFormProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ name: name.trim(), sku: sku.trim(), price: Number(price) });
    setName('');
    setSku('');
    setPrice('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="text-base font-semibold">Cadastrar produto</h3>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full rounded border p-2" />
      <input required value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className="w-full rounded border p-2" />
      <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço" className="w-full rounded border p-2" />
      <button disabled={loading} className="rounded bg-purple-700 px-4 py-2 text-white disabled:opacity-60">
        {loading ? 'Salvando...' : 'Salvar produto'}
      </button>
    </form>
  );
}
