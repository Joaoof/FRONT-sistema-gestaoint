import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentNode } from '@apollo/client';
import { apolloClient } from '../lib/apollo-client';

export interface UseGraphQLQueryOptions {
    skip?: boolean;
    pollInterval?: number;
    fetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only' | 'no-cache' | 'standby';
    errorPolicy?: 'none' | 'ignore' | 'all';
    onCompleted?: (data: any) => void;
    onError?: (error: any) => void;
}

export interface UseGraphQLQueryReturn<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: (variables?: any) => Promise<void>;
    fetchMore: (variables: any) => Promise<void>;
}

function stableKey(value: unknown): string {
    if (value === undefined) return '';
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

export function useGraphQLQuery<T>(
    query: DocumentNode,
    variables?: any,
    options: UseGraphQLQueryOptions = {}
): UseGraphQLQueryReturn<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(!options.skip);
    const [error, setError] = useState<string | null>(null);

    const variablesRef = useRef(variables);
    const optionsRef = useRef(options);
    variablesRef.current = variables;
    optionsRef.current = options;

    const variablesKey = stableKey(variables);
    const skip = options.skip ?? false;
    const fetchPolicy = options.fetchPolicy ?? 'cache-first';
    const errorPolicy = options.errorPolicy ?? 'all';
    const pollInterval = options.pollInterval ?? 0;

    const executeQuery = useCallback(
        async (overrideVariables?: any) => {
            if (optionsRef.current.skip) return;
            setLoading(true);
            setError(null);
            try {
                const result = await apolloClient.query({
                    query,
                    variables: overrideVariables ?? variablesRef.current,
                    fetchPolicy: optionsRef.current.fetchPolicy ?? ('cache-first' as any),
                    errorPolicy: optionsRef.current.errorPolicy ?? 'all',
                });

                if (result.errors && result.errors.length > 0) {
                    const errorMessage = result.errors.map((err) => err.message).join(', ');
                    setError(errorMessage);
                    optionsRef.current.onError?.(result.errors);
                } else {
                    setData(result.data);
                    optionsRef.current.onCompleted?.(result.data);
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                setError(errorMessage);
                optionsRef.current.onError?.(err);
            } finally {
                setLoading(false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [query, variablesKey, fetchPolicy, errorPolicy],
    );

    const refetch = useCallback(
        async (refetchVariables?: any) => {
            await executeQuery(refetchVariables);
        },
        [executeQuery],
    );

    const fetchMore = useCallback(
        async (fetchMoreVariables: any) => {
            try {
                const result = await apolloClient.query({
                    query,
                    variables: { ...variablesRef.current, ...fetchMoreVariables },
                    fetchPolicy: 'network-only',
                });
                if (result.data) {
                    setData((prevData) => {
                        if (Array.isArray(result.data)) {
                            return [...((prevData as any[]) || []), ...result.data] as T;
                        }
                        return result.data;
                    });
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                setError(errorMessage);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [query, variablesKey],
    );

    useEffect(() => {
        if (skip) {
            setLoading(false);
            return;
        }
        executeQuery();
    }, [executeQuery, skip]);

    useEffect(() => {
        if (!pollInterval || pollInterval <= 0 || skip) return;
        const interval = setInterval(() => {
            executeQuery();
        }, pollInterval);
        return () => clearInterval(interval);
    }, [executeQuery, pollInterval, skip]);

    return {
        data,
        loading,
        error,
        refetch,
        fetchMore,
    };
}
