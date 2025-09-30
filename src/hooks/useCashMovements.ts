import { useQuery } from '@apollo/client';
import { useAuth } from '../contexts/AuthContext';
import { GET_CASH_MOVEMENTS } from '../graphql/queries/queries';

export const useCashMovements = () => {
    const { user, isLoading: isAuthLoading } = useAuth();

    const variables = user?.id ? {
        input: {
            userId: user.id,
        }
    } : {};

    const { data, loading, error, refetch } = useQuery(GET_CASH_MOVEMENTS, {
        variables: variables,
        skip: !user?.id || isAuthLoading,
    });

    return {
        movements: data?.cashMovements || [],
        loading: loading || isAuthLoading, // Considere o carregamento do AuthContext
        error,
        refetch,
    };
};