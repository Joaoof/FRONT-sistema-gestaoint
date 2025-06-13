import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, QueryParams } from '../types/api';

export interface UseApiDataOptions<T> {
  initialData?: T;
  autoFetch?: boolean;
  dependencies?: any[];
}

export interface UseApiDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

export function useApiData<T>(
  apiCall: (params?: QueryParams) => Promise<ApiResponse<T>>,
  params?: QueryParams,
  options: UseApiDataOptions<T> = {}
): UseApiDataReturn<T> {
  const { initialData = null, autoFetch = true, dependencies = [] } = options;
  
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(params);
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message);
        setData(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [apiCall, params, ...dependencies]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  };
}