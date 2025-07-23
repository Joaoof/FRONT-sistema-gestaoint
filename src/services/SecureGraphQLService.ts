// Base service with company isolation
import type { ApolloClient } from "@apollo/client"
import { AuthService } from "../auth/AuthService"

export abstract class SecureGraphQLService {
    protected client: ApolloClient<any>
    protected authService: AuthService

    constructor(client: ApolloClient<any>) {
        this.client = client
        this.authService = AuthService.getInstance()
    }

    protected getCompanyId(): string {
        const companyId = this.authService.getStoredCompanyId()
        if (!companyId) {
            throw new Error("No company context available")
        }
        return companyId
    }

    protected addCompanyFilter(variables: any = {}): any {
        return {
            ...variables,
            companyId: this.getCompanyId(),
        }
    }

    protected async executeQuery(query: any, variables?: any) {
        const secureVariables = this.addCompanyFilter(variables)
        return this.client.query({
            query,
            variables: secureVariables,
        })
    }

    protected async executeMutation(mutation: any, variables?: any) {
        const secureVariables = this.addCompanyFilter(variables)
        return this.client.mutate({
            mutation,
            variables: secureVariables,
        })
    }
}
