import { Product } from '../../sales-management/types';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <h3 className="mb-3 text-base font-semibold">Produtos</h3>
      <ul className="space-y-2">
        {products.map((product) => (
          <li key={product.id} className="rounded border p-3 text-sm">
            <p className="font-medium">{product.name}</p>
            <p className="text-slate-600">SKU: {product.sku}</p>
            <p className="text-slate-700">Preço: R$ {product.price.toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
