import { useCallback, useEffect, useState } from 'react';

export async function gql<T = any>(
    query: string,
    variables?: Record<string, unknown>,
): Promise<T> {
    const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
    const token = localStorage.getItem('accessToken');
    const res = await fetch(endpoint ?? '', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0]?.message ?? 'Erro GraphQL');
    return json.data as T;
}

export function useQuery<T>(
    query: string,
    variables?: Record<string, unknown>,
    deps: any[] = [],
): { data: T | null; loading: boolean; error: string | null; refetch: () => Promise<void> } {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const run = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await gql<T>(query, variables);
            setData(res);
        } catch (e: any) {
            setError(e.message ?? 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => { void run(); }, [run]);

    return { data, loading, error, refetch: run };
}

// "X seg/min/horas atrás" simples
export function timeAgo(date: Date | string | number): string {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} dias`;
}

export function formatBRL(value: number): string {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number): string {
    return value.toLocaleString('pt-BR');
}
