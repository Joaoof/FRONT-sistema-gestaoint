import { gql } from '@apollo/client';

const ACCOUNT_FIELDS = `
  id
  companyId
  code
  name
  type
  parentId
  active
  description
  createdAt
  updatedAt
`;

export const GET_FINANCIAL_ACCOUNTS = gql`
  query GetFinancialAccounts($filter: FinancialAccountFilterInput) {
    financialAccounts(filter: $filter) {
      ${ACCOUNT_FIELDS}
    }
  }
`;

export const GET_FINANCIAL_ACCOUNTS_TREE = gql`
  query GetFinancialAccountsTree($filter: FinancialAccountFilterInput) {
    financialAccountsTree(filter: $filter) {
      account { ${ACCOUNT_FIELDS} }
      children {
        account { ${ACCOUNT_FIELDS} }
        children {
          account { ${ACCOUNT_FIELDS} }
          children {
            account { ${ACCOUNT_FIELDS} }
          }
        }
      }
    }
  }
`;

export const CREATE_FINANCIAL_ACCOUNT = gql`
  mutation CreateFinancialAccount($input: CreateFinancialAccountInput!) {
    createFinancialAccount(input: $input) {
      ${ACCOUNT_FIELDS}
    }
  }
`;

export const UPDATE_FINANCIAL_ACCOUNT = gql`
  mutation UpdateFinancialAccount(
    $id: String!
    $input: UpdateFinancialAccountInput!
  ) {
    updateFinancialAccount(id: $id, input: $input) {
      ${ACCOUNT_FIELDS}
    }
  }
`;

export const DELETE_FINANCIAL_ACCOUNT = gql`
  mutation DeleteFinancialAccount($id: String!) {
    deleteFinancialAccount(id: $id)
  }
`;

export const SEED_DEFAULT_FINANCIAL_ACCOUNTS = gql`
  mutation SeedDefaultFinancialAccounts {
    seedDefaultFinancialAccounts {
      ${ACCOUNT_FIELDS}
    }
  }
`;
