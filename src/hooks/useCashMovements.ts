// /src/hooks/useCashMovements.ts

import { useQuery } from '@apollo/client';
import { GET_CASH_MOVEMENTS } from '../graphql/queries/queries';
import { useAuth } from '../contexts/AuthContext';

export const useCashMovements = (filters: any = {}) => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const userId = user?.id;

    const input = userId ? {
        userId: userId, // O campo obrigatório
        ...filters,    // Combina quaisquer outros filtros (ex: { date: "2025-09-30" })
    } : null; // Se não tem userId, o input é nulo.

    // 3. Condição para pular a execução da query
    const shouldSkip = !userId || isAuthLoading;

    const { data, loading, error, refetch } = useQuery(GET_CASH_MOVEMENTS as any, {
        variables: { input: input }, // Passa o objeto de input construído
        skip: shouldSkip, // A query só roda se shouldSkip for false
    });

    return {
        // 4. Use o nome do campo de retorno correto: cashMovements
        movements: data?.cashMovements || [],
        loading: loading || isAuthLoading, // Considera o carregamento da autenticação
        error,
        refetch,
    };
};