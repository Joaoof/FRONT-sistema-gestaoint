import { ApolloClient, DocumentNode, QueryOptions, MutationOptions, ApolloError } from '@apollo/client';
import { apolloClient } from '../../lib/apollo-client';

export interface GraphQLResponse<T> {
<<<<<<< HEAD
  success: boolean;
  data: T | null;
  error?: string;
  errors?: string[];
}

export abstract class BaseGraphQLService {
  protected client: ApolloClient<any>;

  constructor(client: ApolloClient<any> = apolloClient) {
    this.client = client;
  }

  protected async query<T>(
    query: DocumentNode,
    variables?: any,
    options?: Partial<QueryOptions>
  ): Promise<GraphQLResponse<T>> {
    try {
      const result = await this.client.query<T>({
        query,
        variables,
        errorPolicy: 'all',
        ...options,
      });

      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          data: result.data,
          errors: result.errors.map(error => error.message),
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  protected async mutate<T>(
    mutation: DocumentNode,
    variables?: any,
    options?: Partial<MutationOptions>
  ): Promise<GraphQLResponse<T>> {
    try {
      const result = await this.client.mutate<T>({
        mutation,
        variables,
        errorPolicy: 'all',
        ...options,
      });

      if (result.errors && result.errors.length > 0) {
        return {
          success: false,
          data: result.data,
          errors: result.errors.map(error => error.message),
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  protected handleError(error: unknown): GraphQLResponse<any> {
    console.error('GraphQL Error:', error);

    if (error instanceof ApolloError) {
      const errorMessages = error.graphQLErrors.map(err => err.message);
      
      if (error.networkError) {
        errorMessages.push(`Network Error: ${error.networkError.message}`);
      }

      return {
        success: false,
        data: null,
        errors: errorMessages.length > 0 ? errorMessages : ['An unknown GraphQL error occurred'],
      };
    }

    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }

  protected async refetchQueries(queries: string[]) {
    try {
      await this.client.refetchQueries({
        include: queries,
      });
    } catch (error) {
      console.error('Error refetching queries:', error);
    }
  }

  protected updateCache<T>(query: DocumentNode, variables: any, updater: (data: T) => T) {
    try {
      const existingData = this.client.readQuery<T>({ query, variables });
      if (existingData) {
        this.client.writeQuery({
          query,
          variables,
          data: updater(existingData),
        });
      }
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }
}

export { BaseGraphQLService }
=======
    success: boolean;
    data: T | null;
    error?: string;
    errors?: string[];
}

export abstract class BaseGraphQLService {
    protected client: ApolloClient<any>;

    constructor(client: ApolloClient<any> = apolloClient) {
        this.client = client;
    }

    protected async query<T>(
        query: DocumentNode,
        variables?: any,
        options?: Partial<QueryOptions>
    ): Promise<GraphQLResponse<T>> {
        try {
            const result = await this.client.query<T>({
                query,
                variables,
                errorPolicy: 'all',
                ...options,
            });

            if (result.errors && result.errors.length > 0) {
                return {
                    success: false,
                    data: result.data,
                    errors: result.errors.map(error => error.message),
                };
            }

            return {
                success: true,
                data: result.data,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    protected async mutate<T>(
        mutation: DocumentNode,
        variables?: any,
        options?: Partial<MutationOptions>
    ): Promise<GraphQLResponse<T>> {
        try {
            const result = await this.client.mutate<T>({
                mutation,
                variables,
                errorPolicy: 'all',
                ...options,
            });

            if (result.errors && result.errors.length > 0) {
                return {
                    success: false,
                    data: result.data as any,
                    errors: result.errors.map(error => error.message),
                };
            }

            return {
                success: true,
                data: result.data ? '' : result.data as T as any,
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    protected handleError(error: unknown): GraphQLResponse<any> {
        console.error('GraphQL Error:', error);

        if (error instanceof ApolloError) {
            const errorMessages = error.graphQLErrors.map(err => err.message);

            if (error.networkError) {
                errorMessages.push(`Network Error: ${error.networkError.message}`);
            }

            return {
                success: false,
                data: null,
                errors: errorMessages.length > 0 ? errorMessages : ['An unknown GraphQL error occurred'],
            };
        }

        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'An unknown error occurred',
        };
    }

    protected async refetchQueries(queries: string[]) {
        try {
            await this.client.refetchQueries({
                include: queries,
            });
        } catch (error) {
            console.error('Error refetching queries:', error);
        }
    }

    protected updateCache<T>(query: DocumentNode, variables: any, updater: (data: NonNullable<T>) => T) {
        try {
            const existingData = this.client.readQuery<T>({ query, variables });
            if (existingData != null) {
                this.client.writeQuery({
                    query,
                    variables,
                    data: updater(existingData as NonNullable<T>) as any,
                });
            }
        } catch (error) {
            console.error('Error updating cache:', error);
        }
    }
}

>>>>>>> 1e228c1 (fix: fix dashboard login)
