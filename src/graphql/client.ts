import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, concat } from '@apollo/client';
import { errorLink } from '../apollo/ErrorLink'; // seu link de erro já criado

const GRAPHQL_URI =
    typeof process !== 'undefined' && import.meta.env.VITE_GRAPHQL_ENDPOINT;

const httpLink = new HttpLink({ uri: GRAPHQL_URI });

const AUDIT_OPERATIONS = new Set([
    'GetAuditLogs',
    'GetAuditLog',
    'GetAuditLogsForEntity',
    'GetAuditLogsExportCsv',
]);

const authMiddleware = new ApolloLink((operation, forward) => {
    const token = localStorage.getItem('accessToken');

    const headers: Record<string, string> = {
        authorization: token ? `Bearer ${token}` : '',
    };

    if (AUDIT_OPERATIONS.has(operation.operationName)) {
        const auditToken = sessionStorage.getItem('auditAccessToken');
        if (auditToken) {
            headers['x-audit-token'] = auditToken;
        }
    }

    operation.setContext({ headers });

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
