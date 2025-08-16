export interface ProductEntryType {
  id: string;
  nameProduct: string;
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

export interface Receivable {
  id: string;
  client: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  interestRate?: number; // % ao dia (ex: 0.033 = 1% ao mês)
  notes?: string;
}

export type Payable = {
  id: string;
  supplierName: string;
  description: string;
  value: number;
  dueDate: string;
  status: 'pendente' | 'pago' | 'vencido';
};