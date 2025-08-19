import { gql } from '@apollo/client';

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