import { BaseApiService } from './base.service';
import { ApiResponse } from '../../types/api';

export interface DashboardMetrics {
  dailyRevenue: number;
  dailyProfit: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  totalProducts: number;
  lowStockProducts: number;
  totalStockValue: number;
}

export interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CategoryExpenses {
  category: string;
  amount: number;
  percentage: number;
}

export interface IAnalyticsService {
  getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>>;
  getRevenueChart(period: 'daily' | 'monthly' | 'yearly'): Promise<ApiResponse<ChartData[]>>;
  getCategoryExpenses(): Promise<ApiResponse<CategoryExpenses[]>>;
  getTopProducts(limit?: number): Promise<ApiResponse<any[]>>;
}

export class AnalyticsService extends BaseApiService implements IAnalyticsService {
  private readonly endpoint = '/analytics';

  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return this.get<DashboardMetrics>(`${this.endpoint}/dashboard`);
  }

  async getRevenueChart(period: 'daily' | 'monthly' | 'yearly' = 'monthly'): Promise<ApiResponse<ChartData[]>> {
    return this.get<ChartData[]>(`${this.endpoint}/revenue-chart?period=${period}`);
  }

  async getCategoryExpenses(): Promise<ApiResponse<CategoryExpenses[]>> {
    return this.get<CategoryExpenses[]>(`${this.endpoint}/category-expenses`);
  }

  async getTopProducts(limit: number = 10): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`${this.endpoint}/top-products?limit=${limit}`);
  }
}