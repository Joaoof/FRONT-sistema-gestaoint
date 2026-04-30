import { useQuery } from '@apollo/client';
import { useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
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

const NOTIFIED_KEY = 'low-stock-notified-ids';
const DISMISSED_KEY = 'low-stock-dismissed-until';

function readNotifiedSet(): Set<string> {
    try {
        const raw = sessionStorage.getItem(NOTIFIED_KEY);
        if (!raw) return new Set();
        return new Set(JSON.parse(raw) as string[]);
    } catch {
        return new Set();
    }
}

function writeNotifiedSet(set: Set<string>) {
    try {
        sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
    } catch {
        /* noop */
    }
}

export function useLowStock(options?: { liveToasts?: boolean }) {
    const liveToasts = options?.liveToasts ?? false;
    const { data, loading, error, refetch } = useQuery<ListResponse>(
        LIST_PRODUCTS_WITH_IMAGES,
        {
            variables: { take: 200, skip: 0 },
            fetchPolicy: 'cache-and-network',
            pollInterval: 15_000,
            notifyOnNetworkStatusChange: true,
        },
    );

    const previousIdsRef = useRef<Set<string> | null>(null);

    const lowStock = useMemo(() => {
        const list = data?.products ?? [];
        return list
            .filter((p) => p.quantity <= p.minStock)
            .sort((a, b) => {
                const ratioA = a.minStock > 0 ? a.quantity / a.minStock : 0;
                const ratioB = b.minStock > 0 ? b.quantity / b.minStock : 0;
                return ratioA - ratioB;
            });
    }, [data]);

    const outOfStock = useMemo(
        () => lowStock.filter((p) => p.quantity === 0),
        [lowStock],
    );

    const critical = useMemo(
        () =>
            lowStock.filter(
                (p) => p.quantity > 0 && p.minStock > 0 && p.quantity / p.minStock <= 0.5,
            ),
        [lowStock],
    );

    // Live toast quando produto NOVO entra em alerta
    useEffect(() => {
        if (!liveToasts) return;
        const dismissedUntil = Number(sessionStorage.getItem(DISMISSED_KEY) ?? '0');
        if (Date.now() < dismissedUntil) return;

        const currentIds = new Set(lowStock.map((p) => p.id));
        const previousIds = previousIdsRef.current;

        if (previousIds === null) {
            previousIdsRef.current = currentIds;
            return;
        }

        const notified = readNotifiedSet();
        const newAlerts = lowStock.filter(
            (p) => !previousIds.has(p.id) && !notified.has(p.id),
        );

        for (const p of newAlerts) {
            const isOut = p.quantity === 0;
            toast(
                isOut
                    ? `🚨 Sem estoque: ${p.nameProduct}`
                    : `⚠️ Estoque baixo: ${p.nameProduct}`,
                {
                    description: isOut
                        ? `Reposição urgente — mínimo: ${p.minStock} ${p.unit}`
                        : `Restam ${p.quantity} ${p.unit} (mín. ${p.minStock})`,
                    duration: 8000,
                },
            );
            notified.add(p.id);
        }

        writeNotifiedSet(notified);
        previousIdsRef.current = currentIds;
    }, [lowStock, liveToasts]);

    return {
        lowStock,
        outOfStock,
        critical,
        count: lowStock.length,
        outOfStockCount: outOfStock.length,
        criticalCount: critical.length,
        loading,
        error,
        refetch,
    };
}

export function snoozeLowStockToasts(minutes = 30) {
    sessionStorage.setItem(
        DISMISSED_KEY,
        String(Date.now() + minutes * 60 * 1000),
    );
}
