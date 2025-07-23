import { BaseGraphQLService, GraphQLResponse } from './base.service';
import {
    Product,
    CreateProductInput,
    UpdateProductInput,
    PaginatedResponse,
    PaginationInput
} from '../../graphql/types';
import {
    GET_PRODUCTS,
    GET_PRODUCT_BY_ID,
    GET_LOW_STOCK_PRODUCTS,
    SEARCH_PRODUCTS,
} from '../../graphql/queries/products';
import {
    CREATE_PRODUCT,
    UPDATE_PRODUCT,
    DELETE_PRODUCT,
    UPDATE_PRODUCT_STOCK,
    TOGGLE_PRODUCT_STATUS,
} from '../../graphql/mutations/products';

export interface IProductService {
    getProducts(pagination?: PaginationInput, filters?: any): Promise<GraphQLResponse<{ products: PaginatedResponse<Product> }>>;
    getProductById(id: string): Promise<GraphQLResponse<{ product: Product }>>;
    getLowStockProducts(threshold?: number): Promise<GraphQLResponse<{ lowStockProducts: Product[] }>>;
    searchProducts(search: string, limit?: number): Promise<GraphQLResponse<{ searchProducts: Product[] }>>;
    createProduct(input: CreateProductInput): Promise<GraphQLResponse<{ createProduct: Product }>>;
    updateProduct(id: string, input: UpdateProductInput): Promise<GraphQLResponse<{ updateProduct: Product }>>;
    deleteProduct(id: string): Promise<GraphQLResponse<{ deleteProduct: { success: boolean; message: string } }>>;
    updateProductStock(id: string, stock: number): Promise<GraphQLResponse<{ updateProductStock: Product }>>;
    toggleProductStatus(id: string): Promise<GraphQLResponse<{ toggleProductStatus: Product }>>;
}

export class ProductService extends BaseGraphQLService implements IProductService {
    async getProducts(
        pagination?: PaginationInput,
        filters?: any
    ): Promise<GraphQLResponse<{ products: PaginatedResponse<Product> }>> {
        return this.query(GET_PRODUCTS, { pagination, filters });
    }

    async getProductById(id: string): Promise<GraphQLResponse<{ product: Product }>> {
        return this.query(GET_PRODUCT_BY_ID, { id });
    }

    async getLowStockProducts(threshold?: number): Promise<GraphQLResponse<{ lowStockProducts: Product[] }>> {
        return this.query(GET_LOW_STOCK_PRODUCTS, { threshold });
    }

    async searchProducts(search: string, limit?: number): Promise<GraphQLResponse<{ searchProducts: Product[] }>> {
        return this.query(SEARCH_PRODUCTS, { search, limit });
    }

    async createProduct(input: CreateProductInput): Promise<GraphQLResponse<{ createProduct: Product }>> {
        const result = await this.mutate(CREATE_PRODUCT, { input }, {
            refetchQueries: ['GetProducts', 'GetDashboardMetrics'],
        });

        if (result.success) {
            await this.refetchQueries(['GetProducts']);
        }

        return result as any;
    }

    async updateProduct(id: string, input: UpdateProductInput): Promise<GraphQLResponse<{ updateProduct: Product }>> {
        const result = await this.mutate(UPDATE_PRODUCT, { id, input }, {
            refetchQueries: ['GetProducts', 'GetProductById'],
        });

        if (result.success) {
            await this.refetchQueries(['GetProducts']);
        }

        return result as any;
    }

    async deleteProduct(id: string): Promise<GraphQLResponse<{ deleteProduct: { success: boolean; message: string } }>> {
        const result = await this.mutate(DELETE_PRODUCT, { id }, {
            refetchQueries: ['GetProducts', 'GetDashboardMetrics'],
        });

        if (result.success) {
            await this.refetchQueries(['GetProducts']);
        }

        return result as any;
    }

    async updateProductStock(id: string, stock: number): Promise<GraphQLResponse<{ updateProductStock: Product }>> {
        return this.mutate(UPDATE_PRODUCT_STOCK, { id, stock }, {
            refetchQueries: ['GetProducts', 'GetProductById', 'GetDashboardMetrics'],
        });
    }

    async toggleProductStatus(id: string): Promise<GraphQLResponse<{ toggleProductStatus: Product }>> {
        return this.mutate(TOGGLE_PRODUCT_STATUS, { id }, {
            refetchQueries: ['GetProducts', 'GetProductById'],
        });
    }
}