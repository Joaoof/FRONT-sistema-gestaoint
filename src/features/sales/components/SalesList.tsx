import { Sale } from '../../sales-management/types';

interface SalesListProps {
  sales: Sale[];
}

export function SalesList({ sales }: SalesListProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-3 text-base font-semibold">Vendas registradas</h3>
      <ul className="space-y-2">
        {sales.map((sale) => (
          <li key={sale.id} className="rounded border p-3 text-sm">
            <p>Vendedor: <strong>{sale.seller.name}</strong></p>
            <p>Produto: <strong>{sale.product.name}</strong></p>
            <p>Quantidade: {sale.quantity}</p>
            <p>Data: {new Date(sale.soldAt).toLocaleString('pt-BR')}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
