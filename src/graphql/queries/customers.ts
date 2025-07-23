import { gql } from '@apollo/client';

export const GET_CUSTOMERS = gql`
  query GetCustomers($pagination: PaginationInput, $filters: CustomerFiltersInput) {
    customers(pagination: $pagination, filters: $filters) {
      items {
        id
        name
        document
        type
        email
        phone
        address
        city
        state
        zipCode
        active
        createdAt
        updatedAt
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_CUSTOMER_BY_ID = gql`
  query GetCustomerById($id: ID!) {
    customer(id: $id) {
      id
      name
      document
      type
      email
      phone
      address
      city
      state
      zipCode
      active
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACTIVE_CUSTOMERS = gql`
  query GetActiveCustomers {
    activeCustomers {
      id
      name
      document
      type
    }
  }
`;

export const SEARCH_CUSTOMERS = gql`
  query SearchCustomers($search: String!, $limit: Int) {
    searchCustomers(search: $search, limit: $limit) {
      id
      name
      document
      type
    }
  }
`;