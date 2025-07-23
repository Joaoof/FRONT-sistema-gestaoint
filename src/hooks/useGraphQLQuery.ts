import { useState, useEffect, useCallback } from 'react';
import { DocumentNode } from '@apollo/client';
import { apolloClient } from '../lib/apollo-client';
<<<<<<< HEAD
import { GraphQLResponse } from '../services/graphql/base.service';

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

export function useGraphQLQuery<T>(
  query: DocumentNode,
  variables?: any,
  options: UseGraphQLQueryOptions = {}
): UseGraphQLQueryReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!options.skip);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async (queryVariables?: any) => {
    if (options.skip) return;

    setLoading(true);
    setError(null);

    try {
      const result = await apolloClient.query({
        query,
        variables: queryVariables || variables,
        fetchPolicy: options.fetchPolicy || 'cache-first',
        errorPolicy: options.errorPolicy || 'all',
      });

      if (result.errors && result.errors.length > 0) {
        const errorMessage = result.errors.map(err => err.message).join(', ');
        setError(errorMessage);
        options.onError?.(result.errors);
      } else {
        setData(result.data);
        options.onCompleted?.(result.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      options.onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [query, variables, options]);

  const refetch = useCallback(async (refetchVariables?: any) => {
    await executeQuery(refetchVariables);
  }, [executeQuery]);

  const fetchMore = useCallback(async (fetchMoreVariables: any) => {
    try {
      const result = await apolloClient.query({
        query,
        variables: { ...variables, ...fetchMoreVariables },
        fetchPolicy: 'network-only',
      });

      if (result.data) {
        setData(prevData => {
          // Merge logic depends on your data structure
          // This is a basic example - customize based on your needs
          if (Array.isArray(result.data)) {
            return [...(prevData as any[] || []), ...result.data] as T;
          }
          return result.data;
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
    }
  }, [query, variables]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  // Handle polling
  useEffect(() => {
    if (options.pollInterval && options.pollInterval > 0) {
      const interval = setInterval(() => {
        executeQuery();
      }, options.pollInterval);

      return () => clearInterval(interval);
    }
  }, [executeQuery, options.pollInterval]);

  return {
    data,
    loading,
    error,
    refetch,
    fetchMore,
  };
=======

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

export function useGraphQLQuery<T>(
    query: DocumentNode,
    variables?: any,
    options: UseGraphQLQueryOptions = {}
): UseGraphQLQueryReturn<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(!options.skip);
    const [error, setError] = useState<string | null>(null);

    const executeQuery = useCallback(async (queryVariables?: any) => {
        if (options.skip) return;

        setLoading(true);
        setError(null);

        try {
            const result = await apolloClient.query({
                query,
                variables: queryVariables || variables,
                fetchPolicy: options.fetchPolicy || 'cache-first' as any,
                errorPolicy: options.errorPolicy || 'all',
            });

            if (result.errors && result.errors.length > 0) {
                const errorMessage = result.errors.map(err => err.message).join(', ');
                setError(errorMessage);
                options.onError?.(result.errors);
            } else {
                setData(result.data);
                options.onCompleted?.(result.data);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
            options.onError?.(err);
        } finally {
            setLoading(false);
        }
    }, [query, variables, options]);

    const refetch = useCallback(async (refetchVariables?: any) => {
        await executeQuery(refetchVariables);
    }, [executeQuery]);

    const fetchMore = useCallback(async (fetchMoreVariables: any) => {
        try {
            const result = await apolloClient.query({
                query,
                variables: { ...variables, ...fetchMoreVariables },
                fetchPolicy: 'network-only',
            });

            if (result.data) {
                setData(prevData => {
                    // Merge logic depends on your data structure
                    // This is a basic example - customize based on your needs
                    if (Array.isArray(result.data)) {
                        return [...(prevData as any[] || []), ...result.data] as T;
                    }
                    return result.data;
                });
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
            setError(errorMessage);
        }
    }, [query, variables]);

    useEffect(() => {
        executeQuery();
    }, [executeQuery]);

    // Handle polling
    useEffect(() => {
        if (options.pollInterval && options.pollInterval > 0) {
            const interval = setInterval(() => {
                executeQuery();
            }, options.pollInterval);

            return () => clearInterval(interval);
        }
    }, [executeQuery, options.pollInterval]);

    return {
        data,
        loading,
        error,
        refetch,
        fetchMore,
    };
>>>>>>> 1e228c1 (fix: fix dashboard login)
}