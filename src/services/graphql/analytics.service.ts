import { BaseGraphQLService, GraphQLResponse } from './base.service';
import { DashboardMetrics } from '../../graphql/types';
import {
<<<<<<< HEAD
  GET_DASHBOARD_METRICS,
  GET_REVENUE_CHART,
  GET_CATEGORY_EXPENSES,
  GET_TOP_PRODUCTS,
  GET_SALES_SUMMARY,
} from '../../graphql/queries/analytics';

export interface IAnalyticsService {
  getDashboardMetrics(): Promise<GraphQLResponse<{ dashboardMetrics: DashboardMetrics }>>;
  getRevenueChart(period: string, startDate?: string, endDate?: string): Promise<GraphQLResponse<any>>;
  getCategoryExpenses(startDate?: string, endDate?: string): Promise<GraphQLResponse<any>>;
  getTopProducts(limit?: number, period?: string): Promise<GraphQLResponse<any>>;
  getSalesSummary(startDate: string, endDate: string): Promise<GraphQLResponse<any>>;
}

export class AnalyticsService extends BaseGraphQLService implements IAnalyticsService {
  async getDashboardMetrics(): Promise<GraphQLResponse<{ dashboardMetrics: DashboardMetrics }>> {
    return this.query(GET_DASHBOARD_METRICS);
  }

  async getRevenueChart(
    period: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<GraphQLResponse<any>> {
    return this.query(GET_REVENUE_CHART, { period, startDate, endDate });
  }

  async getCategoryExpenses(
    startDate?: string, 
    endDate?: string
  ): Promise<GraphQLResponse<any>> {
    return this.query(GET_CATEGORY_EXPENSES, { startDate, endDate });
  }

  async getTopProducts(
    limit?: number, 
    period?: string
  ): Promise<GraphQLResponse<any>> {
    return this.query(GET_TOP_PRODUCTS, { limit, period });
  }

  async getSalesSummary(
    startDate: string, 
    endDate: string
  ): Promise<GraphQLResponse<any>> {
    return this.query(GET_SALES_SUMMARY, { startDate, endDate });
  }
=======
    GET_DASHBOARD_METRICS,
    GET_REVENUE_CHART,
    GET_CATEGORY_EXPENSES,
    GET_TOP_PRODUCTS,
    GET_SALES_SUMMARY,
} from '../../graphql/queries/analytics';

export interface IAnalyticsService {
    getDashboardMetrics(): Promise<GraphQLResponse<{ dashboardMetrics: DashboardMetrics }>>;
    getRevenueChart(period: string, startDate?: string, endDate?: string): Promise<GraphQLResponse<any>>;
    getCategoryExpenses(startDate?: string, endDate?: string): Promise<GraphQLResponse<any>>;
    getTopProducts(limit?: number, period?: string): Promise<GraphQLResponse<any>>;
    getSalesSummary(startDate: string, endDate: string): Promise<GraphQLResponse<any>>;
}

export class AnalyticsService extends BaseGraphQLService implements IAnalyticsService {
    async getDashboardMetrics(): Promise<GraphQLResponse<{ dashboardMetrics: DashboardMetrics }>> {
        return this.query(GET_DASHBOARD_METRICS);
    }

    async getRevenueChart(
        period: string,
        startDate?: string,
        endDate?: string
    ): Promise<GraphQLResponse<any>> {
        return this.query(GET_REVENUE_CHART, { period, startDate, endDate });
    }

    async getCategoryExpenses(
        startDate?: string,
        endDate?: string
    ): Promise<GraphQLResponse<any>> {
        return this.query(GET_CATEGORY_EXPENSES, { startDate, endDate });
    }

    async getTopProducts(
        limit?: number,
        period?: string
    ): Promise<GraphQLResponse<any>> {
        return this.query(GET_TOP_PRODUCTS, { limit, period });
    }

    async getSalesSummary(
        startDate: string,
        endDate: string
    ): Promise<GraphQLResponse<any>> {
        return this.query(GET_SALES_SUMMARY, { startDate, endDate });
    }
>>>>>>> 1e228c1 (fix: fix dashboard login)
}