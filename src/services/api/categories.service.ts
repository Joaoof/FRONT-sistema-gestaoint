import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react';

// Tipos
interface Categoria {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  ativo: boolean;
}

// Serviço da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
}

export interface CreateCategoryDto {
  name: string;
  description: string;
  cor: string;
  status: string;
}

export interface UpdateCategoryDto {
  nome?: string;
  descricao?: string;
  cor?: string;
  ativo?: boolean;
}

export class BaseApiService {
  protected async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erro na requisição' };
    }
  }

  protected async post<T>(url: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch('http://localhost:3000/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erro na requisição' };
    }
  }

  protected async put<T>(url: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erro na requisição' };
    }
  }

  protected async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Erro na requisição' };
    }
  }

  protected buildQueryString(params: QueryParams): string {
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

export interface ICategoryService {
  getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Categoria>>>;
  getById(id: string): Promise<ApiResponse<Categoria>>;
  create(data: CreateCategoryDto): Promise<ApiResponse<Categoria>>;
  update(id: string, data: UpdateCategoryDto): Promise<ApiResponse<Categoria>>;
  deleteById(id: string): Promise<ApiResponse<void>>;
  getActive(): Promise<ApiResponse<Categoria[]>>;
}

export class CategoryService extends BaseApiService {
  private readonly endpoint = '/categories';

  async getAll(params?: QueryParams): Promise<ApiResponse<PaginatedResponse<Categoria>>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.get<PaginatedResponse<Categoria>>(`${this.endpoint}${queryString}`);
  }

  async getById(id: string): Promise<ApiResponse<Categoria>> {
    return this.get<Categoria>(`${this.endpoint}/${id}`);
  }

  async create(data: CreateCategoryDto): Promise<ApiResponse<Categoria>> {
    return this.post<Categoria>(this.endpoint, data);
  }

  async update(id: string, data: UpdateCategoryDto): Promise<ApiResponse<Categoria>> {
    return this.put<Categoria>(`${this.endpoint}/${id}`, data);
  }

  async deleteById(id: string): Promise<ApiResponse<void>> {
    return super.delete<void>(`${this.endpoint}/${id}`);
  }

  async getActive(): Promise<ApiResponse<Categoria[]>> {
    return this.get<Categoria[]>(`${this.endpoint}/active`);
  }
}
