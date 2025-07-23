import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

// HTTP Link
const httpLink = createHttpLink({
<<<<<<< HEAD
  uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql',
=======
    uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:3000/graphql',
>>>>>>> 1e228c1 (fix: fix dashboard login)
});

// Auth Link
const authLink = setContext((_, { headers }) => {
<<<<<<< HEAD
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error Link
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
    
    // Handle authentication errors
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
  }
=======
    const token = localStorage.getItem('auth_token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

// Error Link
const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
            console.error(
                `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            );
        });
    }

    if (networkError) {
        console.error(`[Network error]: ${networkError}`);

        // Handle authentication errors
        if ('statusCode' in networkError && networkError.statusCode === 401) {
            localStorage.removeItem('auth_token');
            window.location.href = '/login';
        }
    }
>>>>>>> 1e228c1 (fix: fix dashboard login)
});

// Apollo Client
export const apolloClient = new ApolloClient({
<<<<<<< HEAD
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
=======
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    products: {
                        merge([], incoming) {
                            return incoming;
                        },
                    },
                    categories: {
                        merge([], incoming) {
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
>>>>>>> 1e228c1 (fix: fix dashboard login)
});