import { BaseApiService } from './base.service';
import { ProductEntry, ProductExit } from '../../types';
import { 
  ApiResponse, 
  PaginatedResponse, 
  QueryParams, 
  CreateProductEntryDto, 
  CreateProductExitDto 
} from '../../types/api';

export interface IInventoryService {
  getEntries(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<ProductEntry>>>;
  getExits(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<ProductExit>>>;
  createEntry(data: CreateProductEntryDto): Promise<ApiResponse<ProductEntry>>;
  createExit(data: CreateProductExitDto): Promise<ApiResponse<ProductExit>>;
  getMovementHistory(productId: string): Promise<ApiResponse<(ProductEntry | ProductExit)[]>>;
}

export class InventoryService extends BaseApiService implements IInventoryService {
  private readonly entriesEndpoint = '/inventory/entries';
  private readonly exitsEndpoint = '/inventory/exits';

  async getEntries(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<ProductEntry>>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.get<PaginatedResponse<ProductEntry>>(`${this.entriesEndpoint}${queryString}`);
  }

  async getExits(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<ProductExit>>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.get<PaginatedResponse<ProductExit>>(`${this.exitsEndpoint}${queryString}`);
  }

  async createEntry(data: CreateProductEntryDto): Promise<ApiResponse<ProductEntry>> {
    return this.post<ProductEntry>(this.entriesEndpoint, data);
  }

  async createExit(data: CreateProductExitDto): Promise<ApiResponse<ProductExit>> {
    return this.post<ProductExit>(this.exitsEndpoint, data);
  }

  async getMovementHistory(productId: string): Promise<ApiResponse<(ProductEntry | ProductExit)[]>> {
    return this.get<(ProductEntry | ProductExit)[]>(`/inventory/movements/${productId}`);
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