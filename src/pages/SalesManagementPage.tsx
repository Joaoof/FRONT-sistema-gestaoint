import { useState } from 'react';
import { AsyncState } from '../components/common/AsyncState';
import { ProductForm } from '../features/products/components/ProductForm';
import { ProductList } from '../features/products/components/ProductList';
import { SaleForm } from '../features/sales/components/SaleForm';
import { SalesList } from '../features/sales/components/SalesList';
import { SellerForm } from '../features/sellers/components/SellerForm';
import { SellerList } from '../features/sellers/components/SellerList';
import { useSalesManagement } from '../hooks/useSalesManagement';

export function SalesManagementPage() {
  const [askConfirmation, setAskConfirmation] = useState(true);
  const {
    sellers,
    products,
    sales,
    metrics,
    loading,
    mutationLoading,
    error,
    createSeller,
    createProduct,
    registerSale,
  } = useSalesManagement();

  const onRegisterSale = async (payload: { sellerId: string; productId: string; quantity: number }) => {
    if (askConfirmation && !window.confirm('Confirma o registro desta venda?')) {
      return;
    }

    await registerSale(payload);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-lg border bg-white p-5">
        <h1 className="text-2xl font-bold text-slate-800">Gestão comercial</h1>
        <p className="text-sm text-slate-600">Cadastro de vendedores e produtos, registro de vendas e acompanhamento de comissão/pontuação (calculadas no back-end).</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SellerForm onSubmit={createSeller} loading={mutationLoading} />
        <ProductForm onSubmit={createProduct} loading={mutationLoading} />
        <SaleForm sellers={sellers} products={products} onSubmit={onRegisterSale} loading={mutationLoading} />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={askConfirmation} onChange={(e) => setAskConfirmation(e.target.checked)} />
        Pedir confirmação antes de registrar venda
      </label>

      <AsyncState loading={loading} error={error} isEmpty={sellers.length === 0 && products.length === 0 && sales.length === 0} emptyMessage="Nenhum dado cadastrado ainda.">
        <div className="grid gap-4 xl:grid-cols-3">
          <SellerList sellers={sellers} metrics={metrics} />
          <ProductList products={products} />
          <SalesList sales={sales} />
        </div>
      </AsyncState>
    </div>
  );
}
