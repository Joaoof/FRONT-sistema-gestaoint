import { FormEvent, useState } from 'react';
import { CreateSellerInput } from '../../sales-management/types';

interface SellerFormProps {
  onSubmit: (payload: CreateSellerInput) => Promise<void>;
  loading?: boolean;
}

export function SellerForm({ onSubmit, loading = false }: SellerFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ name: name.trim(), email: email.trim() });
    setName('');
    setEmail('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="text-base font-semibold">Cadastrar vendedor</h3>
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full rounded border p-2" />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full rounded border p-2" />
      <button disabled={loading} className="rounded bg-purple-700 px-4 py-2 text-white disabled:opacity-60">
        {loading ? 'Salvando...' : 'Salvar vendedor'}
      </button>
    </form>
  );
}
