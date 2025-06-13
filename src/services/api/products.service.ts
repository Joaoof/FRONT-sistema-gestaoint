import { BaseApiService } from './base.service';
import { Product } from '../../types';
import { 
  ApiResponse, 
  PaginatedResponse, 
  QueryParams, 
  CreateProductDto, 
  UpdateProductDto 
} from '../../types/api';

export interface IProductService {
  getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Product>>>;
  getById(id: string): Promise<ApiResponse<Product>>;
  create(data: CreateProductDto): Promise<ApiResponse<Product>>;
  update(id: string, data: UpdateProductDto): Promise<ApiResponse<Product>>;
  delete(id: string): Promise<ApiResponse<void>>;
  getLowStock(threshold?: number): Promise<ApiResponse<Product[]>>;
}

export class ProductService extends BaseApiService implements IProductService {
  private readonly endpoint = '/products';

  async getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Product>>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.get<PaginatedResponse<Product>>(`${this.endpoint}${queryString}`);
  }

  async getById(id: string): Promise<ApiResponse<Product>> {
    return this.get<Product>(`${this.endpoint}/${id}`);
  }

  async create(data: CreateProductDto): Promise<ApiResponse<Product>> {
    return this.post<Product>(this.endpoint, data);
  }

  async update(id: string, data: UpdateProductDto): Promise<ApiResponse<Product>> {
    return this.put<Product>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  async getLowStock(threshold: number = 10): Promise<ApiResponse<Product[]>> {
    return this.get<Product[]>(`${this.endpoint}/low-stock?threshold=${threshold}`);
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