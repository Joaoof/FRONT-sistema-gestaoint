import { BaseApiService } from './base.service';
import { ApiResponse, PaginatedResponse, QueryParams, CreateCategoryDto, UpdateCategoryDto } from '../../types/api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICategoryService {
  getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Category>>>;
  getById(id: string): Promise<ApiResponse<Category>>;
  create(data: CreateCategoryDto): Promise<ApiResponse<Category>>;
  update(id: string, data: UpdateCategoryDto): Promise<ApiResponse<Category>>;
  delete(id: string): Promise<ApiResponse<void>>;
  getActive(): Promise<ApiResponse<Category[]>>;
}

export class CategoryService extends BaseApiService implements ICategoryService {
  private readonly endpoint = '/categories';

  async getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Category>>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.get<PaginatedResponse<Category>>(`${this.endpoint}${queryString}`);
  }

  async getById(id: string): Promise<ApiResponse<Category>> {
    return this.get<Category>(`${this.endpoint}/${id}`);
  }

  async create(data: CreateCategoryDto): Promise<ApiResponse<Category>> {
    return this.post<Category>(this.endpoint, data);
  }

  async update(id: string, data: UpdateCategoryDto): Promise<ApiResponse<Category>> {
    return this.put<Category>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.endpoint}/${id}`);
  }

  async getActive(): Promise<ApiResponse<Category[]>> {
    return this.get<Category[]>(`${this.endpoint}/active`);
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