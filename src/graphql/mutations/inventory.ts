import { gql } from '@apollo/client';

export const CREATE_INVENTORY_ENTRY = gql`
  mutation CreateInventoryEntry($input: CreateInventoryEntryInput!) {
    createInventoryEntry(input: $input) {
      id
      product {
        id
        name
        stock
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
  }
`;

export const CREATE_INVENTORY_EXIT = gql`
  mutation CreateInventoryExit($input: CreateInventoryExitInput!) {
    createInventoryExit(input: $input) {
      id
      product {
        id
        name
        stock
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
  }
`;

export const BULK_UPDATE_STOCK = gql`
  mutation BulkUpdateStock($updates: [StockUpdateInput!]!) {
    bulkUpdateStock(updates: $updates) {
      success
      updatedProducts {
        id
        name
        stock
      }
      errors {
        productId
        message
      }
    }
  }
`;

export const ADJUST_STOCK = gql`
  mutation AdjustStock($productId: ID!, $adjustment: Int!, $reason: String!) {
    adjustStock(productId: $productId, adjustment: $adjustment, reason: $reason) {
      id
      product {
        id
        name
        stock
      }
      adjustment
      reason
      createdAt
    }
  }
`;