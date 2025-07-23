import { BaseGraphQLService, GraphQLResponse } from './base.service';
import {
    Category,
    CreateCategoryInput,
    UpdateCategoryInput,
    PaginatedResponse,
    PaginationInput
} from '../../graphql/types';
import {
    GET_CATEGORIES,
    GET_CATEGORY_BY_ID,
    GET_ACTIVE_CATEGORIES,
} from '../../graphql/queries/categories';
import {
    CREATE_CATEGORY,
    UPDATE_CATEGORY,
    DELETE_CATEGORY,
    TOGGLE_CATEGORY_STATUS,
} from '../../graphql/mutations/categories';

export interface ICategoryService {
    getCategories(pagination?: PaginationInput, filters?: any): Promise<GraphQLResponse<{ categories: PaginatedResponse<Category> }>>;
    getCategoryById(id: string): Promise<GraphQLResponse<{ category: Category }>>;
    getActiveCategories(): Promise<GraphQLResponse<{ activeCategories: Category[] }>>;
    createCategory(input: CreateCategoryInput): Promise<GraphQLResponse<{ createCategory: Category }>>;
    updateCategory(id: string, input: UpdateCategoryInput): Promise<GraphQLResponse<{ updateCategory: Category }>>;
    deleteCategory(id: string): Promise<GraphQLResponse<{ deleteCategory: { success: boolean; message: string } }>>;
    toggleCategoryStatus(id: string): Promise<GraphQLResponse<{ toggleCategoryStatus: Category }>>;
}

export class CategoryService extends BaseGraphQLService implements ICategoryService {
    async getCategories(
        pagination?: PaginationInput,
        filters?: any
    ): Promise<GraphQLResponse<{ categories: PaginatedResponse<Category> }>> {
        return this.query(GET_CATEGORIES, { pagination, filters });
    }

    async getCategoryById(id: string): Promise<GraphQLResponse<{ category: Category }>> {
        return this.query(GET_CATEGORY_BY_ID, { id });
    }

    async getActiveCategories(): Promise<GraphQLResponse<{ activeCategories: Category[] }>> {
        return this.query(GET_ACTIVE_CATEGORIES);
    }

    async createCategory(input: CreateCategoryInput): Promise<GraphQLResponse<{ createCategory: Category }>> {
        const result = await this.mutate(CREATE_CATEGORY, { input }, {
            refetchQueries: ['GetCategories', 'GetActiveCategories'],
        });

        if (result.success) {
            await this.refetchQueries(['GetCategories', 'GetActiveCategories']);
        }

        return result as any;
    }

    async updateCategory(id: string, input: UpdateCategoryInput): Promise<GraphQLResponse<{ updateCategory: Category }>> {
        const result = await this.mutate(UPDATE_CATEGORY, { id, input }, {
            refetchQueries: ['GetCategories', 'GetCategoryById', 'GetActiveCategories'],
        });

        if (result.success) {
            await this.refetchQueries(['GetCategories', 'GetActiveCategories']);
        }

        return result as any;
    }

    async deleteCategory(id: string): Promise<GraphQLResponse<{ deleteCategory: { success: boolean; message: string } }>> {
        const result = await this.mutate(DELETE_CATEGORY, { id }, {
            refetchQueries: ['GetCategories', 'GetActiveCategories'],
        });

        if (result.success) {
            await this.refetchQueries(['GetCategories', 'GetActiveCategories']);
        }

        return result as any;
    }

    async toggleCategoryStatus(id: string): Promise<GraphQLResponse<{ toggleCategoryStatus: Category }>> {
        return this.mutate(TOGGLE_CATEGORY_STATUS, { id }, {
            refetchQueries: ['GetCategories', 'GetCategoryById', 'GetActiveCategories'],
        });
    }
}