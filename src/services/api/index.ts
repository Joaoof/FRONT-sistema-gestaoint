// Service instances following Dependency Injection pattern
import { ProductService, IProductService } from './products.service';
import { InventoryService, IInventoryService } from './inventory.service';
import { CategoryService, ICategoryService } from './categories.service';
import { CustomerService, ICustomerService } from './customers.service';
import { SupplierService, ISupplierService } from './suppliers.service';
import { AnalyticsService, IAnalyticsService } from './analytics.service';

// Service container for dependency injection
export class ServiceContainer {
  private static instance: ServiceContainer;
  
  private _productService: IProductService;
  private _inventoryService: IInventoryService;
  private _categoryService: ICategoryService;
  private _customerService: ICustomerService;
  private _supplierService: ISupplierService;
  private _analyticsService: IAnalyticsService;

  private constructor() {
    // Initialize services
    this._productService = new ProductService();
    this._inventoryService = new InventoryService();
    this._categoryService = new CategoryService();
    this._customerService = new CustomerService();
    this._supplierService = new SupplierService();
    this._analyticsService = new AnalyticsService();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  // Getters for services (following Interface Segregation Principle)
  get productService(): IProductService {
    return this._productService;
  }

  get inventoryService(): IInventoryService {
    return this._inventoryService;
  }

  get categoryService(): ICategoryService {
    return this._categoryService;
  }

  get customerService(): ICustomerService {
    return this._customerService;
  }

  get supplierService(): ISupplierService {
    return this._supplierService;
  }

  get analyticsService(): IAnalyticsService {
    return this._analyticsService;
  }
}

// Export service container instance
export const serviceContainer = ServiceContainer.getInstance();

// Export individual services for direct use
export {
  ProductService,
  InventoryService,
  CategoryService,
  CustomerService,
  SupplierService,
  AnalyticsService,
};

// Export interfaces
export type {
  IProductService,
  IInventoryService,
  ICategoryService,
  ICustomerService,
  ISupplierService,
  IAnalyticsService,
};