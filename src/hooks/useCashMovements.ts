// /src/hooks/useCashMovements.ts
import { useQuery } from '@apollo/client';
import { GET_ALL_MOVEMENTS } from '../graphql/queries/queries';

export const useCashMovements = () => {
    const { data, loading, error, refetch } = useQuery(GET_ALL_MOVEMENTS as any);

    return {
        movements: data?.entryMovement || [],
        loading,
        error,
        refetch,
    };
};