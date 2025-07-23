// Service instances following Dependency Injection pattern
import { ProductService, IProductService } from './products.service';
import { CategoryService, ICategoryService } from './categories.service';
import { InventoryService, IInventoryService } from './inventory.service';
import { AnalyticsService, IAnalyticsService } from './analytics.service';

// Service container for dependency injection
export class GraphQLServiceContainer {
<<<<<<< HEAD
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
=======
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
>>>>>>> 1e228c1 (fix: fix dashboard login)
}

// Export service container instance
export const graphqlServiceContainer = GraphQLServiceContainer.getInstance();

// Export individual services for direct use
export {
<<<<<<< HEAD
  ProductService,
  CategoryService,
  InventoryService,
  AnalyticsService,
=======
    ProductService,
    CategoryService,
    InventoryService,
    AnalyticsService,
>>>>>>> 1e228c1 (fix: fix dashboard login)
};

// Export interfaces
export type {
<<<<<<< HEAD
  IProductService,
  ICategoryService,
  IInventoryService,
  IAnalyticsService,
=======
    IProductService,
    ICategoryService,
    IInventoryService,
    IAnalyticsService,
>>>>>>> 1e228c1 (fix: fix dashboard login)
};