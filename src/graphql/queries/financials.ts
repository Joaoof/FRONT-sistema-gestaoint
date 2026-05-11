import { gql } from '@apollo/client';

export const CASH_FLOW_PROJECTION = gql`
  query CashFlowProjection($days: Int) {
    cashFlowProjection(days: $days) {
      startBalance totalIn totalOut finalBalance
      days { date expectedIn expectedOut netForDay cumulativeBalance }
    }
  }
`;

export const DRE_REPORT = gql`
  query DREReport($from: String, $to: String) {
    dreReport(from: $from, to: $to) {
      from to
      months { month revenue cogs grossProfit expenses netIncome }
      totals { revenue cogs grossProfit expenses netIncome }
    }
  }
`;
