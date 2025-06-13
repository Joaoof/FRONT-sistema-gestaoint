import { BaseApiService } from './base.service';
import { ApiResponse, PaginatedResponse, QueryParams, CreateSupplierDto, UpdateSupplierDto } from '../../types/api';

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

export interface ISupplierService {
  getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Supplier>>>;
  getById(id: string): Promise<ApiResponse<Supplier>>;
  create(data: CreateSupplierDto): Promise<ApiResponse<Supplier>>;
  update(id: string, data: UpdateSupplierDto): Promise<ApiResponse<Supplier>>;
  delete(id: string): Promise<ApiResponse<void>>;
  getActive(): Promise<ApiResponse<Supplier[]>>;
}

export class SupplierService extends BaseApiService implements ISupplierService {
  private readonly endpoint = '/suppliers';

  async getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.get<PaginatedResponse<Supplier>>(`${this.endpoint}${queryString}`);
  }

  async getById(id: string): Promise<ApiResponse<Supplier>> {
    return this.get<Supplier>(`${this.endpoint}/${id}`);
  }

  async create(data: CreateSupplierDto): Promise<ApiResponse<Supplier>> {
    return this.post<Supplier>(this.endpoint, data);
  }

  async update(id: string, data: UpdateSupplierDto): Promise<ApiResponse<Supplier>> {
    return this.put<Supplier>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  async getActive(): Promise<ApiResponse<Supplier[]>> {
    return this.get<Supplier[]>(`${this.endpoint}/active`);
  }

  private buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'filters' && typeof value === 'object') {
          Object.entries(value).forEach(([filterKey, filterValue]) => {
            if (filterValue !== undefined && filterValue !== null) {
              searchParams.append(`filter.${filterKey}`, String(filterValue));
            }
          });
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString() ? `?${searchParams.toString()}` : '';
  }
}