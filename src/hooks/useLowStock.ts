import { useQuery } from '@apollo/client';
import { useMemo } from 'react';
import { LIST_PRODUCTS_WITH_IMAGES } from '../graphql/mutations/product-with-images';

export interface LowStockProduct {
    id: string;
    nameProduct: string;
    sku: string | null;
    quantity: number;
    minStock: number;
    unit: string;
    salePrice: number;
    images: { id: string; url: string; isPrimary: boolean; order: number }[];
}

interface ListResponse {
    products: LowStockProduct[];
}

export function useLowStock() {
    const { data, loading, error, refetch } = useQuery<ListResponse>(
        LIST_PRODUCTS_WITH_IMAGES,
        {
            variables: { take: 200, skip: 0 },
            fetchPolicy: 'cache-and-network',
            pollInterval: 60_000,
        },
    );

    const lowStock = useMemo(() => {
        const list = data?.products ?? [];
        return list
            .filter((p) => p.quantity <= p.minStock)
            .sort((a, b) => a.quantity - b.quantity);
    }, [data]);

    const outOfStock = useMemo(
        () => lowStock.filter((p) => p.quantity === 0),
        [lowStock],
    );

    return {
        lowStock,
        outOfStock,
        count: lowStock.length,
        outOfStockCount: outOfStock.length,
        loading,
        error,
        refetch,
    };
}
