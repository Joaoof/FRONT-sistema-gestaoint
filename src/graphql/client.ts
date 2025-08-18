// /graphql/client.ts

import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, concat } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// client.ts
const GRAPHQL_URI =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
        ? process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
        : "http://localhost:3000/graphql";

const httpLink = new HttpLink({
    uri: GRAPHQL_URI,
});



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

const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors)
        graphQLErrors.forEach(({ message, locations, path }) =>
            console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
        );
    if (networkError) console.error(`[Network error]: ${networkError}`);
});

export const apolloClient = new ApolloClient({
    link: concat(authMiddleware, concat(errorLink, httpLink)),
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