import { gql } from '@apollo/client';

export const GET_INVENTORY_ENTRIES = gql`
  query GetInventoryEntries($pagination: PaginationInput, $filters: InventoryEntryFiltersInput) {
    inventoryEntries(pagination: $pagination, filters: $filters) {
      items {
        id
        product {
          id
          name
          category {
            name
          }
        }
        quantity
        costPrice
        supplier {
          id
          name
        }
        notes
        createdAt
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_INVENTORY_EXITS = gql`
  query GetInventoryExits($pagination: PaginationInput, $filters: InventoryExitFiltersInput) {
    inventoryExits(pagination: $pagination, filters: $filters) {
      items {
        id
        product {
          id
          name
          category {
            name
          }
        }
        quantity
        unitPrice
        reason
        customer {
          id
          name
        }
        notes
        createdAt
      }
      total
      page
      limit
      totalPages
    }
  }
`;

export const GET_PRODUCT_MOVEMENTS = gql`
  query GetProductMovements($productId: ID!, $pagination: PaginationInput) {
    productMovements(productId: $productId, pagination: $pagination) {
      entries {
        id
        quantity
        costPrice
        supplier {
          name
        }
        createdAt
      }
      exits {
        id
        quantity
        unitPrice
        reason
        customer {
          name
        }
        createdAt
      }
    }
  }
`;