import { gql } from '@apollo/client';

export const GET_DASHBOARD_STATS = gql`
  query DashboardStats {
    dashboardStats {
      today {
        entries
        exits
        balance
      }
      monthlyTotal
    }
  }
`;