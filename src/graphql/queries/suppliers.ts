import { gql } from '@apollo/client';

export const GET_SUPPLIERS = gql`
  query GetSuppliers($pagination: PaginationInput, $filters: SupplierFiltersInput) {
    suppliers(pagination: $pagination, filters: $filters) {
      items {
        id
        name
        document
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

export const GET_SUPPLIER_BY_ID = gql`
  query GetSupplierById($id: ID!) {
    supplier(id: $id) {
      id
      name
      document
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

export const GET_ACTIVE_SUPPLIERS = gql`
  query GetActiveSuppliers {
    activeSuppliers {
      id
      name
      document
    }
  }
`;

export const SEARCH_SUPPLIERS = gql`
  query SearchSuppliers($search: String!, $limit: Int) {
    searchSuppliers(search: $search, limit: $limit) {
      id
      name
      document
    }
  }
`;