import { gql } from '@apollo/client';

export const DASHBOARD_OVERVIEW = gql`
  query DashboardOverview {
    dashboardOverview {
      daily { sales profit cost ordersCount }
      monthly { sales profit expenses cost }
      margin
      sales30Days { date sales orders }
      revenueVsExpenses6m { month revenue expenses }
      expensesByCategory { category amount }
      topProducts { productId name quantity revenue }
      topCategoriesByRevenue { categoryId name revenue }
      inventory {
        totalProducts totalStockValue lowStockCount
        lowStockItems { id name quantity minStock }
      }
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query DashboardStats($input: DashboardStatsInput) {
    dashboardStats(input: $input) {
      todayEntries
      todayExits
      todayBalance
      monthlyTotal
    }
  }
`;