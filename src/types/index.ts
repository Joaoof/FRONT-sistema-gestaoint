export interface ProductEntry {
  id: string;
  name: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  description?: string;
  date: string;
}

export interface ProductExit {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  reason: 'venda' | 'perda' | 'devolucao' | 'transferencia';
  notes?: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  description: string;
}

// src/types/index.ts
export type MovementType =
  | 'venda'
  | 'troco'
  | 'outros'
  | 'despesa'
  | 'retirada'
  | 'pagamento';

export type Movement = {
  id: string;
  value: number;
  description: string;
  type: MovementType;
  subtype: string;
  date: string;
  createdAt: string;
};