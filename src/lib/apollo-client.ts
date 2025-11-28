import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// HTTP Link
const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
});

// Auth Link
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('accessToken');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

// Error Link Corrigido
const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path, extensions }: any) => {

            // 🚨 NOVO: Lógica para extrair e exibir erros detalhados de validação (Zod)
            if (extensions && Array.isArray(extensions.issues)) {
                console.error(
                    `[GraphQL Validation Error - ${extensions.code || 'VALIDATION_ERROR'}]:`
                );

                // Exibe cada erro detalhado em uma linha separada
                extensions.issues.forEach((issue: any) => {
                    // Verifica se issue tem 'message' e 'path' (conforme seu filtro de backend)
                    const pathStr = Array.isArray(issue.path) ? issue.path.join('.') : issue.path;
                    console.error(`  -> Campo: ${pathStr || 'N/A'}, Mensagem: ${issue.message}`);
                });
            } else {
                // Lógica original para outros GraphQL errors (erros de lógica, autorização, etc.)
                console.error(
                    `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
                );
            }
        });
    }

    if (networkError) {
        console.error(`[Network error]: ${networkError}`);

        // Handle authentication errors
        if ('statusCode' in networkError && networkError.statusCode === 401) {
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
        }
    }
});

// Apollo Client
export const apolloClient = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    products: {
                        merge(existing = [], incoming) {
                            return incoming;
                        },
                    },
                    categories: {
                        merge(existing = [], incoming) {
                            return incoming;
                        },
                    },
                },
            },
        },
    }),
    defaultOptions: {
        watchQuery: {
            errorPolicy: 'all',
        },
        query: {
            errorPolicy: 'all',
        },
    },
});