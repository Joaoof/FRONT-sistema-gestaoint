import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, concat } from '@apollo/client';
import { errorLink } from '../apollo/ErrorLink'; // seu link de erro já criado

const GRAPHQL_URI =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
        ? process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
        : 'http://localhost:3000/graphql';

const httpLink = new HttpLink({ uri: GRAPHQL_URI });

const authMiddleware = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem('accessToken'); // ou 'auth_token'

    console.log('[Apollo Auth] Token encontrado:', token ? 'Sim' : 'Não');

    operation.setContext({
        headers: {
            authorization: token ? `Bearer ${token}` : '',
        },
    });

    return forward(operation);
});

export const apolloClient = new ApolloClient({
    link: concat(authMiddleware, concat(errorLink, httpLink)), // <-- usa o ErrorLink importado
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    cashMovements: {
                        keyArgs: ['input'],
                        merge(existing = [], incoming) {
                            return [...existing, ...incoming];
                        },
                    },
                },
            },
        },
    }),
    defaultOptions: {
        mutate: {
            errorPolicy: 'all',
        },
    },
});
