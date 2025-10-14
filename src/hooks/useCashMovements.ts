import { useQuery, useMutation } from '@apollo/client';
import { GET_CASH_MOVEMENTS } from '../graphql/queries/queries';
import { DELETE_CASH_MOVEMENT } from '../graphql/mutations/mutations';
import { useAuth } from '../contexts/AuthContext';
import { handleGraphQLError } from '../utils/handleGraphqlError';
import { toast } from 'sonner';

interface CashMovement {
    id: string;
    description: string;
    type: 'ENTRY' | 'EXIT';
    value: number;
    category: string;
    date?: string;
}
interface CashMovementsData {
    cashMovements: CashMovement[];
}

export const useCashMovements = (filters: any = {}) => {
    const { user, isLoading: isAuthLoading } = useAuth();
    const userId = user?.id;

    const input = userId ? {
        userId: userId,
        ...filters,
    } : null;

    // 3. Condição para pular a execução da query
    const shouldSkip = !userId || isAuthLoading;

    const queryOptions = {
        variables: { input: input },
        skip: shouldSkip,
    };

    const { data, loading, error, refetch } = useQuery<CashMovementsData>(GET_CASH_MOVEMENTS as any, queryOptions);

    // --- Lógica de Deleção ---
    const [deleteMovement, { loading: isDeleting }] = useMutation(DELETE_CASH_MOVEMENT, {
        onCompleted: (data) => {
            if (data.cashMovementDelete) {
                toast.success('Movimento deletado com sucesso!');
            }
        },
        onError: (error) => {
            // CORREÇÃO: Passamos o error e a função de callback notifyError (showToast)
            handleGraphQLError(error, (msg: any) => toast.error(msg));
        },
        // Força a atualização da lista de movimentos e das estatísticas do dashboard
        refetchQueries: [
            {
                query: GET_CASH_MOVEMENTS,
                ...queryOptions,
            },
            'dashboardStats',
        ],
    });

    const deleteCashMovement = async (movementId: string) => {
        try {
            await deleteMovement({ variables: { movementId } });
            return true;
        } catch (e) {
            // O erro já é tratado no onError do useMutation
            return false;
        }
    };
    // -------------------------

    return {
        movements: data?.cashMovements || [],
        loading: loading || isAuthLoading,
        error,
        refetch,
        deleteCashMovement,
        isDeleting,
    };
};