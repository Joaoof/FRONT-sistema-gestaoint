import { useCallback } from 'react';
import { serviceContainer } from '../services/api';
import { useApiData } from './useApiData';
import { useApiMutation } from './useApiMutation';
import { Product, ProductEntry, ProductExit } from '../types';
import { 
  QueryParams, 
  CreateProductDto, 
  CreateProductEntryDto, 
  CreateProductExitDto 
} from '../types/api';

export function useInventoryApi() {
  // Products
  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useApiData(
    useCallback((params?: QueryParams) => 
      serviceContainer.productService.getAll(params), []
    )
  );

  // Product Entries
  const {
    data: entries,
    loading: entriesLoading,
    error: entriesError,
    refetch: refetchEntries,
  } = useApiData(
    useCallback((params?: QueryParams) => 
      serviceContainer.inventoryService.getEntries(params), []
    )
  );

  // Product Exits
  const {
    data: exits,
    loading: exitsLoading,
    error: exitsError,
    refetch: refetchExits,
  } = useApiData(
    useCallback((params?: QueryParams) => 
      serviceContainer.inventoryService.getExits(params), []
    )
  );

  // Dashboard Metrics
  const {
    data: metrics,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useApiData(
    useCallback(() => 
      serviceContainer.analyticsService.getDashboardMetrics(), []
    )
  );

  // Mutations
  const createProduct = useApiMutation(
    (data: CreateProductDto) => serviceContainer.productService.create(data),
    {
      onSuccess: () => {
        refetchProducts();
        refetchMetrics();
      }
    }
  );

  const createEntry = useApiMutation(
    (data: CreateProductEntryDto) => serviceContainer.inventoryService.createEntry(data),
    {
      onSuccess: () => {
        refetchEntries();
        refetchProducts();
        refetchMetrics();
      }
    }
  );

  const createExit = useApiMutation(
    (data: CreateProductExitDto) => serviceContainer.inventoryService.createExit(data),
    {
      onSuccess: () => {
        refetchExits();
        refetchProducts();
        refetchMetrics();
      }
    }
  );

  const deleteProduct = useApiMutation(
    (id: string) => serviceContainer.productService.delete(id),
    {
      onSuccess: () => {
        refetchProducts();
        refetchMetrics();
      }
    }
  );

  // Utility functions
  const refetchAll = useCallback(() => {
    refetchProducts();
    refetchEntries();
    refetchExits();
    refetchMetrics();
  }, [refetchProducts, refetchEntries, refetchExits, refetchMetrics]);

  return {
    // Data
    products: products?.items || [],
    entries: entries?.items || [],
    exits: exits?.items || [],
    metrics,
    
    // Loading states
    loading: {
      products: productsLoading,
      entries: entriesLoading,
      exits: exitsLoading,
      metrics: metricsLoading,
    },
    
    // Error states
    errors: {
      products: productsError,
      entries: entriesError,
      exits: exitsError,
      metrics: metricsError,
    },
    
    // Mutations
    mutations: {
      createProduct,
      createEntry,
      createExit,
      deleteProduct,
    },
    
    // Refetch functions
    refetch: {
      products: refetchProducts,
      entries: refetchEntries,
      exits: refetchExits,
      metrics: refetchMetrics,
      all: refetchAll,
    },
  };
}