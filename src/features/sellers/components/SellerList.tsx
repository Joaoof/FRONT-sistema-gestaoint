import { Seller, SellerMetrics } from '../../sales-management/types';

interface SellerListProps {
  sellers: Seller[];
  metrics: SellerMetrics[];
}

export function SellerList({ sellers, metrics }: SellerListProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-3 text-base font-semibold">Vendedores</h3>
      <ul className="space-y-2">
        {sellers.map((seller) => {
          const sellerMetric = metrics.find((item) => item.sellerId === seller.id);

          return (
            <li key={seller.id} className="rounded border p-3 text-sm">
              <p className="font-medium">{seller.name}</p>
              <p className="text-slate-600">{seller.email}</p>
              <p className="text-slate-700">Comissão total: R$ {(sellerMetric?.commissionTotal ?? seller.commissionTotal).toFixed(2)}</p>
              <p className="text-slate-700">Pontuação: {sellerMetric?.scoreTotal ?? seller.scoreTotal}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
