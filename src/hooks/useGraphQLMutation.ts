import { useState, useCallback } from 'react';
import { DocumentNode } from '@apollo/client';
import { apolloClient } from '../lib/apollo-client';

export interface UseGraphQLMutationOptions<T> {
  onCompleted?: (data: T) => void;
  onError?: (error: any) => void;
  refetchQueries?: string[];
  awaitRefetchQueries?: boolean;
  errorPolicy?: 'none' | 'ignore' | 'all';
}

export interface UseGraphQLMutationReturn<T, V> {
  mutate: (variables?: V, options?: UseGraphQLMutationOptions<T>) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  data: T | null;
  reset: () => void;
}

export function useGraphQLMutation<T, V = any>(
  mutation: DocumentNode,
  defaultOptions: UseGraphQLMutationOptions<T> = {}
): UseGraphQLMutationReturn<T, V> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (
    variables?: V,
    options: UseGraphQLMutationOptions<T> = {}
  ): Promise<T | null> => {
    const mergedOptions = { ...defaultOptions, ...options };
    
    setLoading(true);
    setError(null);

    try {
      const result = await apolloClient.mutate({
        mutation,
        variables,
        errorPolicy: mergedOptions.errorPolicy || 'all',
        refetchQueries: mergedOptions.refetchQueries || [],
        awaitRefetchQueries: mergedOptions.awaitRefetchQueries || false,
      });

      if (result.errors && result.errors.length > 0) {
        const errorMessage = result.errors.map(err => err.message).join(', ');
        setError(errorMessage);
        mergedOptions.onError?.(result.errors);
        return null;
      } else {
        setData(result.data);
        mergedOptions.onCompleted?.(result.data);
        return result.data;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      mergedOptions.onError?.(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutation, defaultOptions]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    mutate,
    loading,
    error,
    data,
    reset,
  };
}