import { BaseApiService } from './base.service';
import { ApiResponse, PaginatedResponse, QueryParams, CreateCustomerDto, UpdateCustomerDto } from '../../types/api';

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

export interface ICustomerService {
  getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Customer>>>;
  getById(id: string): Promise<ApiResponse<Customer>>;
  create(data: CreateCustomerDto): Promise<ApiResponse<Customer>>;
  update(id: string, data: UpdateCustomerDto): Promise<ApiResponse<Customer>>;
  delete(id: string): Promise<ApiResponse<void>>;
  getActive(): Promise<ApiResponse<Customer[]>>;
}

export class CustomerService extends BaseApiService implements ICustomerService {
  private readonly endpoint = '/customers';

  async getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Customer>>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.get<PaginatedResponse<Customer>>(`${this.endpoint}${queryString}`);
  }

  async getById(id: string): Promise<ApiResponse<Customer>> {
    return this.get<Customer>(`${this.endpoint}/${id}`);
  }

  async create(data: CreateCustomerDto): Promise<ApiResponse<Customer>> {
    return this.post<Customer>(this.endpoint, data);
  }

  async update(id: string, data: UpdateCustomerDto): Promise<ApiResponse<Customer>> {
    return this.put<Customer>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  async getActive(): Promise<ApiResponse<Customer[]>> {
    return this.get<Customer[]>(`${this.endpoint}/active`);
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