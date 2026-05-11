import { gql } from '@apollo/client';

const WH_FIELDS = `id companyId name code address isMain active notes createdAt updatedAt`;

export const WAREHOUSES = gql`
  query Warehouses($activeOnly: Boolean) {
    warehouses(activeOnly: $activeOnly) { ${WH_FIELDS} }
  }
`;

export const CREATE_WAREHOUSE = gql`
  mutation CreateWarehouse($input: CreateWarehouseInput!) {
    createWarehouse(input: $input) { ${WH_FIELDS} }
  }
`;

export const UPDATE_WAREHOUSE = gql`
  mutation UpdateWarehouse($input: UpdateWarehouseInput!) {
    updateWarehouse(input: $input) { ${WH_FIELDS} }
  }
`;

export const DEACTIVATE_WAREHOUSE = gql`
  mutation DeactivateWarehouse($id: String!) {
    deactivateWarehouse(id: $id)
  }
`;

export const PRODUCT_INVENTORY = gql`
  query ProductInventory($productId: String!) {
    productInventory(productId: $productId) {
      warehouseId warehouseName isMain quantity minStock
    }
  }
`;

export const INVENTORY_TRANSFER = gql`
  mutation InventoryTransfer($input: InventoryTransferInput!) {
    inventoryTransfer(input: $input) { transferId from to quantity }
  }
`;

export const INVENTORY_ENTRY = gql`
  mutation InventoryEntry($input: InventoryAdjustInput!) {
    inventoryEntry(input: $input) {
      productId warehouseId productQuantity averageCost
    }
  }
`;
