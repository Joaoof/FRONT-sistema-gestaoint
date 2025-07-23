import { BaseGraphQLService, GraphQLResponse } from './base.service';
import { 
  InventoryEntry, 
  InventoryExit, 
  CreateInventoryEntryInput, 
  CreateInventoryExitInput, 
  PaginatedResponse, 
  PaginationInput 
} from '../../graphql/types';
import {
  GET_INVENTORY_ENTRIES,
  GET_INVENTORY_EXITS,
  GET_PRODUCT_MOVEMENTS,
} from '../../graphql/queries/inventory';
import {
  CREATE_INVENTORY_ENTRY,
  CREATE_INVENTORY_EXIT,
  BULK_UPDATE_STOCK,
  ADJUST_STOCK,
} from '../../graphql/mutations/inventory';

export interface IInventoryService {
  getInventoryEntries(pagination?: PaginationInput, filters?: any): Promise<GraphQLResponse<{ inventoryEntries: PaginatedResponse<InventoryEntry> }>>;
  getInventoryExits(pagination?: PaginationInput, filters?: any): Promise<GraphQLResponse<{ inventoryExits: PaginatedResponse<InventoryExit> }>>;
  getProductMovements(productId: string, pagination?: PaginationInput): Promise<GraphQLResponse<{ productMovements: { entries: InventoryEntry[]; exits: InventoryExit[] } }>>;
  createInventoryEntry(input: CreateInventoryEntryInput): Promise<GraphQLResponse<{ createInventoryEntry: InventoryEntry }>>;
  createInventoryExit(input: CreateInventoryExitInput): Promise<GraphQLResponse<{ createInventoryExit: InventoryExit }>>;
  bulkUpdateStock(updates: any[]): Promise<GraphQLResponse<{ bulkUpdateStock: any }>>;
  adjustStock(productId: string, adjustment: number, reason: string): Promise<GraphQLResponse<{ adjustStock: any }>>;
}

export class InventoryService extends BaseGraphQLService implements IInventoryService {
  async getInventoryEntries(
    pagination?: PaginationInput, 
    filters?: any
  ): Promise<GraphQLResponse<{ inventoryEntries: PaginatedResponse<InventoryEntry> }>> {
    return this.query(GET_INVENTORY_ENTRIES, { pagination, filters });
  }

  async getInventoryExits(
    pagination?: PaginationInput, 
    filters?: any
  ): Promise<GraphQLResponse<{ inventoryExits: PaginatedResponse<InventoryExit> }>> {
    return this.query(GET_INVENTORY_EXITS, { pagination, filters });
  }

  async getProductMovements(
    productId: string, 
    pagination?: PaginationInput
  ): Promise<GraphQLResponse<{ productMovements: { entries: InventoryEntry[]; exits: InventoryExit[] } }>> {
    return this.query(GET_PRODUCT_MOVEMENTS, { productId, pagination });
  }

  async createInventoryEntry(input: CreateInventoryEntryInput): Promise<GraphQLResponse<{ createInventoryEntry: InventoryEntry }>> {
    const result = await this.mutate(CREATE_INVENTORY_ENTRY, { input }, {
      refetchQueries: ['GetInventoryEntries', 'GetProducts', 'GetDashboardMetrics'],
    });

    if (result.success) {
      await this.refetchQueries(['GetInventoryEntries', 'GetProducts', 'GetDashboardMetrics']);
    }

    return result;
  }

  async createInventoryExit(input: CreateInventoryExitInput): Promise<GraphQLResponse<{ createInventoryExit: InventoryExit }>> {
    const result = await this.mutate(CREATE_INVENTORY_EXIT, { input }, {
      refetchQueries: ['GetInventoryExits', 'GetProducts', 'GetDashboardMetrics'],
    });

    if (result.success) {
      await this.refetchQueries(['GetInventoryExits', 'GetProducts', 'GetDashboardMetrics']);
    }

    return result;
  }

  async bulkUpdateStock(updates: any[]): Promise<GraphQLResponse<{ bulkUpdateStock: any }>> {
    const result = await this.mutate(BULK_UPDATE_STOCK, { updates }, {
      refetchQueries: ['GetProducts', 'GetDashboardMetrics'],
    });

    if (result.success) {
      await this.refetchQueries(['GetProducts', 'GetDashboardMetrics']);
    }

    return result;
  }

  async adjustStock(productId: string, adjustment: number, reason: string): Promise<GraphQLResponse<{ adjustStock: any }>> {
    const result = await this.mutate(ADJUST_STOCK, { productId, adjustment, reason }, {
      refetchQueries: ['GetProducts', 'GetProductById', 'GetDashboardMetrics'],
    });

    if (result.success) {
      await this.refetchQueries(['GetProducts', 'GetDashboardMetrics']);
    }

    return result;
  }
}