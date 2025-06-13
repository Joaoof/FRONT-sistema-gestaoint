export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: Error;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

export interface CreateProductDto {
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  supplier?: string;
  description?: string;
  initialStock?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
}

export interface CreateProductEntryDto {
  productId: string;
  quantity: number;
  costPrice: number;
  supplier?: string;
  notes?: string;
}

export interface CreateProductExitDto {
  productId: string;
  quantity: number;
  reason: 'venda' | 'perda' | 'devolucao' | 'transferencia';
  notes?: string;
  customerId?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  color: string;
  active: boolean;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  id: string;
}

export interface CreateCustomerDto {
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
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  id: string;
}

export interface CreateSupplierDto {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  active: boolean;
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {
  id: string;
}