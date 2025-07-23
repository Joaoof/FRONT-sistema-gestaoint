import { useCallback } from 'react';
import { graphqlServiceContainer } from '../services/graphql';
import { useGraphQLQuery } from './useGraphQLQuery';
import { useGraphQLMutation } from './useGraphQLMutation';
import { 
  CreateProductInput, 
  CreateInventoryEntryInput, 
  CreateInventoryExitInput,
  CreateCategoryInput,
  PaginationInput 
} from '../graphql/types';
import { 
  GET_PRODUCTS, 
  GET_LOW_STOCK_PRODUCTS 
} from '../graphql/queries/products';
import { 
  GET_CATEGORIES, 
  GET_ACTIVE_CATEGORIES 
} from '../graphql/queries/categories';
import { 
  GET_INVENTORY_ENTRIES, 
  GET_INVENTORY_EXITS 
} from '../graphql/queries/inventory';
import { 
  GET_DASHBOARD_METRICS 
} from '../graphql/queries/analytics';
import { 
  CREATE_PRODUCT, 
  UPDATE_PRODUCT, 
  DELETE_PRODUCT 
} from '../graphql/mutations/products';
import { 
  CREATE_CATEGORY, 
  UPDATE_CATEGORY, 
  DELETE_CATEGORY 
} from '../graphql/mutations/categories';
import { 
  CREATE_INVENTORY_ENTRY, 
  CREATE_INVENTORY_EXIT 
} from '../graphql/mutations/inventory';

export function useInventoryGraphQL() {
  // Queries
  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useGraphQLQuery(GET_PRODUCTS, { 
    pagination: { page: 1, limit: 50 } 
  });

  const {
    data: categoriesData,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useGraphQLQuery(GET_CATEGORIES, { 
    pagination: { page: 1, limit: 100 } 
  });

  const {
    data: activeCategoriesData,
    loading: activeCategoriesLoading,
    refetch: refetchActiveCategories,
  } = useGraphQLQuery(GET_ACTIVE_CATEGORIES);

  const {
    data: entriesData,
    loading: entriesLoading,
    error: entriesError,
    refetch: refetchEntries,
  } = useGraphQLQuery(GET_INVENTORY_ENTRIES, { 
    pagination: { page: 1, limit: 50 } 
  });

  const {
    data: exitsData,
    loading: exitsLoading,
    error: exitsError,
    refetch: refetchExits,
  } = useGraphQLQuery(GET_INVENTORY_EXITS, { 
    pagination: { page: 1, limit: 50 } 
  });

  const {
    data: metricsData,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useGraphQLQuery(GET_DASHBOARD_METRICS);

  const {
    data: lowStockData,
    loading: lowStockLoading,
    refetch: refetchLowStock,
  } = useGraphQLQuery(GET_LOW_STOCK_PRODUCTS, { threshold: 10 });

  // Mutations
  const createProductMutation = useGraphQLMutation(CREATE_PRODUCT, {
    refetchQueries: ['GetProducts', 'GetDashboardMetrics'],
    onCompleted: () => {
      refetchProducts();
      refetchMetrics();
    },
  });

  const updateProductMutation = useGraphQLMutation(UPDATE_PRODUCT, {
    refetchQueries: ['GetProducts', 'GetDashboardMetrics'],
    onCompleted: () => {
      refetchProducts();
      refetchMetrics();
    },
  });

  const deleteProductMutation = useGraphQLMutation(DELETE_PRODUCT, {
    refetchQueries: ['GetProducts', 'GetDashboardMetrics'],
    onCompleted: () => {
      refetchProducts();
      refetchMetrics();
    },
  });

  const createCategoryMutation = useGraphQLMutation(CREATE_CATEGORY, {
    refetchQueries: ['GetCategories', 'GetActiveCategories'],
    onCompleted: () => {
      refetchCategories();
      refetchActiveCategories();
    },
  });

  const updateCategoryMutation = useGraphQLMutation(UPDATE_CATEGORY, {
    refetchQueries: ['GetCategories', 'GetActiveCategories'],
    onCompleted: () => {
      refetchCategories();
      refetchActiveCategories();
    },
  });

  const deleteCategoryMutation = useGraphQLMutation(DELETE_CATEGORY, {
    refetchQueries: ['GetCategories', 'GetActiveCategories'],
    onCompleted: () => {
      refetchCategories();
      refetchActiveCategories();
    },
  });

  const createEntryMutation = useGraphQLMutation(CREATE_INVENTORY_ENTRY, {
    refetchQueries: ['GetInventoryEntries', 'GetProducts', 'GetDashboardMetrics'],
    onCompleted: () => {
      refetchEntries();
      refetchProducts();
      refetchMetrics();
    },
  });

  const createExitMutation = useGraphQLMutation(CREATE_INVENTORY_EXIT, {
    refetchQueries: ['GetInventoryExits', 'GetProducts', 'GetDashboardMetrics'],
    onCompleted: () => {
      refetchExits();
      refetchProducts();
      refetchMetrics();
    },
  });

  // Helper functions
  const refetchAll = useCallback(() => {
    refetchProducts();
    refetchCategories();
    refetchActiveCategories();
    refetchEntries();
    refetchExits();
    refetchMetrics();
    refetchLowStock();
  }, [
    refetchProducts,
    refetchCategories,
    refetchActiveCategories,
    refetchEntries,
    refetchExits,
    refetchMetrics,
    refetchLowStock,
  ]);

  return {
    // Data
    products: productsData?.products?.items || [],
    categories: categoriesData?.categories?.items || [],
    activeCategories: activeCategoriesData?.activeCategories || [],
    entries: entriesData?.inventoryEntries?.items || [],
    exits: exitsData?.inventoryExits?.items || [],
    metrics: metricsData?.dashboardMetrics,
    lowStockProducts: lowStockData?.lowStockProducts || [],
    
    // Loading states
    loading: {
      products: productsLoading,
      categories: categoriesLoading,
      activeCategories: activeCategoriesLoading,
      entries: entriesLoading,
      exits: exitsLoading,
      metrics: metricsLoading,
      lowStock: lowStockLoading,
    },
    
    // Error states
    errors: {
      products: productsError,
      categories: categoriesError,
      entries: entriesError,
      exits: exitsError,
      metrics: metricsError,
    },
    
    // Mutations
    mutations: {
      createProduct: createProductMutation,
      updateProduct: updateProductMutation,
      deleteProduct: deleteProductMutation,
      createCategory: createCategoryMutation,
      updateCategory: updateCategoryMutation,
      deleteCategory: deleteCategoryMutation,
      createEntry: createEntryMutation,
      createExit: createExitMutation,
    },
    
    // Refetch functions
    refetch: {
      products: refetchProducts,
      categories: refetchCategories,
      activeCategories: refetchActiveCategories,
      entries: refetchEntries,
      exits: refetchExits,
      metrics: refetchMetrics,
      lowStock: refetchLowStock,
      all: refetchAll,
    },
  };
}