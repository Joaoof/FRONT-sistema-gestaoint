// GraphQL Types
export interface Product {
<<<<<<< HEAD
  id: string;
  name: string;
  description?: string;
  category: Category;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  supplier?: Supplier;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  type: 'PF' | 'PJ';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryEntry {
  id: string;
  product: Product;
  quantity: number;
  costPrice: number;
  supplier?: Supplier;
  notes?: string;
  createdAt: string;
}

export interface InventoryExit {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  reason: 'SALE' | 'LOSS' | 'RETURN' | 'TRANSFER';
  customer?: Customer;
  notes?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  dailyRevenue: number;
  dailyProfit: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  totalProducts: number;
  lowStockProducts: number;
  totalStockValue: number;
=======
    id: string;
    name: string;
    description?: string;
    category: Category;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    minStock: number;
    supplier?: Supplier;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    color: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    name: string;
    document: string;
    type: 'PF' | 'PJ';
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Supplier {
    id: string;
    name: string;
    document: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface InventoryEntry {
    id: string;
    product: Product;
    quantity: number;
    costPrice: number;
    supplier?: Supplier;
    notes?: string;
    createdAt: string;
}

export interface InventoryExit {
    id: string;
    product: Product;
    quantity: number;
    unitPrice: number;
    reason: 'SALE' | 'LOSS' | 'RETURN' | 'TRANSFER';
    customer?: Customer;
    notes?: string;
    createdAt: string;
}

export interface DashboardMetrics {
    dailyRevenue: number;
    dailyProfit: number;
    monthlyRevenue: number;
    monthlyProfit: number;
    totalProducts: number;
    lowStockProducts: number;
    totalStockValue: number;
>>>>>>> 1e228c1 (fix: fix dashboard login)
}

// Input Types
export interface CreateProductInput {
<<<<<<< HEAD
  name: string;
  description?: string;
  categoryId: string;
  costPrice: number;
  sellingPrice: number;
  stock?: number;
  minStock?: number;
  supplierId?: string;
  active?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  categoryId?: string;
  costPrice?: number;
  sellingPrice?: number;
  stock?: number;
  minStock?: number;
  supplierId?: string;
  active?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  color: string;
  active?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  color?: string;
  active?: boolean;
}

export interface CreateCustomerInput {
  name: string;
  document: string;
  type: 'PF' | 'PJ';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active?: boolean;
}

export interface UpdateCustomerInput {
  name?: string;
  document?: string;
  type?: 'PF' | 'PJ';
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active?: boolean;
}

export interface CreateSupplierInput {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active?: boolean;
}

export interface UpdateSupplierInput {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active?: boolean;
}

export interface CreateInventoryEntryInput {
  productId: string;
  quantity: number;
  costPrice: number;
  supplierId?: string;
  notes?: string;
}

export interface CreateInventoryExitInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  reason: 'SALE' | 'LOSS' | 'RETURN' | 'TRANSFER';
  customerId?: string;
  notes?: string;
=======
    name: string;
    description?: string;
    categoryId: string;
    costPrice: number;
    sellingPrice: number;
    stock?: number;
    minStock?: number;
    supplierId?: string;
    active?: boolean;
}

export interface UpdateProductInput {
    name?: string;
    description?: string;
    categoryId?: string;
    costPrice?: number;
    sellingPrice?: number;
    stock?: number;
    minStock?: number;
    supplierId?: string;
    active?: boolean;
}

export interface CreateCategoryInput {
    name: string;
    description?: string;
    color: string;
    active?: boolean;
}

export interface UpdateCategoryInput {
    name?: string;
    description?: string;
    color?: string;
    active?: boolean;
}

export interface CreateCustomerInput {
    name: string;
    document: string;
    type: 'PF' | 'PJ';
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    active?: boolean;
}

export interface UpdateCustomerInput {
    name?: string;
    document?: string;
    type?: 'PF' | 'PJ';
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    active?: boolean;
}

export interface CreateSupplierInput {
    name: string;
    document: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    active?: boolean;
}

export interface UpdateSupplierInput {
    name?: string;
    document?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    active?: boolean;
}

export interface CreateInventoryEntryInput {
    productId: string;
    quantity: number;
    costPrice: number;
    supplierId?: string;
    notes?: string;
}

export interface CreateInventoryExitInput {
    productId: string;
    quantity: number;
    unitPrice: number;
    reason: 'SALE' | 'LOSS' | 'RETURN' | 'TRANSFER';
    customerId?: string;
    notes?: string;
>>>>>>> 1e228c1 (fix: fix dashboard login)
}

// Pagination
export interface PaginationInput {
<<<<<<< HEAD
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
=======
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
>>>>>>> 1e228c1 (fix: fix dashboard login)
}