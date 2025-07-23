import { gql } from '@apollo/client';

export const GET_DASHBOARD_METRICS = gql`
  query GetDashboardMetrics {
    dashboardMetrics {
      dailyRevenue
      dailyProfit
      monthlyRevenue
      monthlyProfit
      totalProducts
      lowStockProducts
      totalStockValue
    }
  }
`;

export const GET_REVENUE_CHART = gql`
  query GetRevenueChart($period: ChartPeriod!, $startDate: DateTime, $endDate: DateTime) {
    revenueChart(period: $period, startDate: $startDate, endDate: $endDate) {
      labels
      revenue
      expenses
      profit
    }
  }
`;

export const GET_CATEGORY_EXPENSES = gql`
  query GetCategoryExpenses($startDate: DateTime, $endDate: DateTime) {
    categoryExpenses(startDate: $startDate, endDate: $endDate) {
      category {
        id
        name
        color
      }
      amount
      percentage
    }
  }
`;

export const GET_TOP_PRODUCTS = gql`
  query GetTopProducts($limit: Int, $period: TopProductsPeriod) {
    topProducts(limit: $limit, period: $period) {
      product {
        id
        name
        category {
          name
        }
      }
      totalSold
      totalRevenue
    }
  }
`;

export const GET_SALES_SUMMARY = gql`
  query GetSalesSummary($startDate: DateTime!, $endDate: DateTime!) {
    salesSummary(startDate: $startDate, endDate: $endDate) {
      totalSales
      totalRevenue
      totalProfit
      averageTicket
      topSellingProduct {
        id
        name
      }
    }
  }
`;