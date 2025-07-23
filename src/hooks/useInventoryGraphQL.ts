import { useCallback } from 'react';
<<<<<<< HEAD
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
=======
import { useGraphQLQuery } from './useGraphQLQuery';
import { useGraphQLMutation } from './useGraphQLMutation';
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


type CategoriesData = {
    categories: {
        items: {
            id: string;
            name: string;
            // etc...
        }[];
        total: number;
        page: number;
        limit: number;
    }
};

type ActiveCategoriesData = {
    activeCategories: {
        id: string;
        name: string;
        color: string;
    }[];
}
type ProductsData = {
    products: {
        items: {
            id: string;
            name: string;
            category: {
                id: string;
                name: string;
                color: string;
            };
            // etc...
        }[];
        total: number;
        page: number;
        limit: number;
    }
};

type InventoryEntriesData = {
    inventoryEntries: {
        items: {
            id: string;
            product: {
                id: string;
                name: string;
                category: {
                    name: string;
                };
            };
            quantity: number;
            costPrice: number;
            supplier: {
                id: string;
                name: string;
            };
            notes: string;
            createdAt: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
};

type InventoryExitsData = {
    invetory: {
        items: {
            id: string;
            product: {
                id: string;
                name: string;
                category: {
                    name: string;
                };
            };
            quantity: number;
            unitPrice: number;
            reason: string;
            customer: {
                id: string;
                name: string;
            };
            notes: string;
            createdAt: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
};

type DashboardMetricsData = {
    dashboardMetrics: {
        totalProducts: number;
        totalCategories: number;
        totalSuppliers: number;
        totalCustomers: number;
        totalSales: number;
        totalRevenue: number;
        totalProfit: number;
        dailyRevenue: number;
        dailyProfit: number;
        monthlyRevenue: number;
        monthlyProfit: number;
        totalStockValue: number;
        lowStockProducts: number;
    }
}


type GetLowStockProductsData = {
    lowStockProducts: {
        id: string;
        name: string;
        category: {
            id: string;
            name: string;
            color: string;
        };
        stock: number;
        minStock: number;
        supplier: {
            id: string;
            name: string;
        };
        active: boolean;
        createdAt: string;
        updatedAt: string;
    }[];
}

export function useInventoryGraphQL() {
    // Queries
    const {
        data: productsData,
        loading: productsLoading,
        error: productsError,
        refetch: refetchProducts,
    } = useGraphQLQuery<ProductsData>(GET_PRODUCTS, {
        pagination: { page: 1, limit: 50 }
    });

    const {
        data: categoriesData,
        loading: categoriesLoading,
        error: categoriesError,
        refetch: refetchCategories,
    } = useGraphQLQuery<CategoriesData>(GET_CATEGORIES, {
        pagination: { page: 1, limit: 100 }
    });

    const {
        data: activeCategoriesData,
        loading: activeCategoriesLoading,
        refetch: refetchActiveCategories,
    } = useGraphQLQuery<ActiveCategoriesData>(GET_ACTIVE_CATEGORIES);

    const {
        data: entriesData,
        loading: entriesLoading,
        error: entriesError,
        refetch: refetchEntries,
    } = useGraphQLQuery<InventoryEntriesData>(GET_INVENTORY_ENTRIES, {
        pagination: { page: 1, limit: 50 }
    });

    const {
        data: exitsData,
        loading: exitsLoading,
        error: exitsError,
        refetch: refetchExits,
    } = useGraphQLQuery<InventoryExitsData>(GET_INVENTORY_EXITS, {
        pagination: { page: 1, limit: 50 }
    });

    const {
        data: metricsData,
        loading: metricsLoading,
        error: metricsError,
        refetch: refetchMetrics,
    } = useGraphQLQuery<DashboardMetricsData>(GET_DASHBOARD_METRICS);

    const {
        data: lowStockData,
        loading: lowStockLoading,
        refetch: refetchLowStock,
    } = useGraphQLQuery<GetLowStockProductsData>(GET_LOW_STOCK_PRODUCTS, { threshold: 10 });

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
        products: (productsData && typeof productsData === 'object' && productsData !== null && 'products' in productsData ? productsData.products : []),
        categories: (categoriesData && typeof categoriesData === 'object' && categoriesData !== null && 'categories' in categoriesData && categoriesData.categories?.items) ? categoriesData.categories.items : [],
        activeCategories: activeCategoriesData?.activeCategories || [],
        entries: entriesData && entriesData.inventoryEntries && entriesData.inventoryEntries.items ? entriesData.inventoryEntries.items : [],
        exits: exitsData?.invetory?.items || [],
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
>>>>>>> 1e228c1 (fix: fix dashboard login)
}