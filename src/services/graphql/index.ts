// Service instances following Dependency Injection pattern
import { ProductService, IProductService } from './products.service';
import { CategoryService, ICategoryService } from './categories.service';
import { InventoryService, IInventoryService } from './inventory.service';
import { AnalyticsService, IAnalyticsService } from './analytics.service';

// Service container for dependency injection
export class GraphQLServiceContainer {
  private static instance: GraphQLServiceContainer;
  
  private _productService: IProductService;
  private _categoryService: ICategoryService;
  private _inventoryService: IInventoryService;
  private _analyticsService: IAnalyticsService;

  private constructor() {
    // Initialize services
    this._productService = new ProductService();
    this._categoryService = new CategoryService();
    this._inventoryService = new InventoryService();
    this._analyticsService = new AnalyticsService();
  }

  public static getInstance(): GraphQLServiceContainer {
    if (!GraphQLServiceContainer.instance) {
      GraphQLServiceContainer.instance = new GraphQLServiceContainer();
    }
    return GraphQLServiceContainer.instance;
  }

  // Getters for services (following Interface Segregation Principle)
  get productService(): IProductService {
    return this._productService;
  }

  get categoryService(): ICategoryService {
    return this._categoryService;
  }

  get inventoryService(): IInventoryService {
    return this._inventoryService;
  }

  get analyticsService(): IAnalyticsService {
    return this._analyticsService;
  }
}

// Export service container instance
export const graphqlServiceContainer = GraphQLServiceContainer.getInstance();

// Export individual services for direct use
export {
  ProductService,
  CategoryService,
  InventoryService,
  AnalyticsService,
};

// Export interfaces
export type {
  IProductService,
  ICategoryService,
  IInventoryService,
  IAnalyticsService,
};