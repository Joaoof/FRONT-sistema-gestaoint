export interface Seller {
  id: string;
  name: string;
  email: string;
  commissionTotal: number;
  scoreTotal: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

export interface Sale {
  id: string;
  quantity: number;
  soldAt: string;
  seller: Pick<Seller, 'id' | 'name'>;
  product: Pick<Product, 'id' | 'name' | 'price'>;
}

export interface SellerMetrics {
  sellerId: string;
  sellerName: string;
  commissionTotal: number;
  scoreTotal: number;
}

export interface CreateSellerInput {
  name: string;
  email: string;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  price: number;
}

export interface RegisterSaleInput {
  sellerId: string;
  productId: string;
  quantity: number;
}
