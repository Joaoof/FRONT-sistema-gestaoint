import { useQuery } from '@apollo/client';
import { GET_ACTIVE_CATEGORIES } from '../graphql/queries/categories';

export interface Category {
    id: string;
    name: string;
    color: string;
    active?: boolean;
}

export function useCategories() {
    const { data, loading, error, refetch } = useQuery<{ activeCategories: Category[] }>(
        GET_ACTIVE_CATEGORIES,
        {
            fetchPolicy: 'cache-and-network',
        },
    );

    return {
        categories: data?.activeCategories ?? [],
        loading,
        error: error?.message ?? null,
        refetch,
    };
}
