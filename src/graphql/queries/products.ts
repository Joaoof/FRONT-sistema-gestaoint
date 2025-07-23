import { gql } from '@apollo/client';

export const GET_PRODUCTS = gql`
  query GetProducts($pagination: PaginationInput, $filters: ProductFiltersInput) {
    products(pagination: $pagination, filters: $filters) {
      items {
        id
        name
        description
        category {
          id
          name
          color
        }
        costPrice
        sellingPrice
        stock
        minStock
        supplier {
          id
          name
        }
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

export const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      name
      description
      category {
        id
        name
        color
      }
      costPrice
      sellingPrice
      stock
      minStock
      supplier {
        id
        name
        document
        email
        phone
      }
      active
      createdAt
      updatedAt
    }
  }
`;

export const GET_LOW_STOCK_PRODUCTS = gql`
  query GetLowStockProducts($threshold: Int) {
    lowStockProducts(threshold: $threshold) {
      id
      name
      stock
      minStock
      category {
        id
        name
        color
      }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($search: String!, $limit: Int) {
    searchProducts(search: $search, limit: $limit) {
      id
      name
      stock
      sellingPrice
      category {
        name
      }
    }
  }
`;