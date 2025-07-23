// Single Responsibility Principle
import type { User, Company } from "../types/auth"
import { apolloClient } from "../lib/apollo-client"
import { LOGIN_MUTATION, GET_COMPANY_QUERY } from "../graphql/mutations/auth"

export class AuthService {
    private static instance: AuthService

    private constructor() { }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService()
        }
        return AuthService.instance
    }

    async login(email: string, password: string): Promise<{ user: User; company: Company; token: string }> {
        try {
            const { data } = await apolloClient.mutate({
                mutation: LOGIN_MUTATION,
                variables: { email, password },
            })

            const { user, company, token } = data.login

            // Store token
            localStorage.setItem("auth_token", token)
            localStorage.setItem("company_id", company.id)

            return { user, company, token }
        } catch (error) {
            throw new Error("Login failed")
        }
    }

    async logout(): Promise<void> {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("company_id")
        await apolloClient.clearStore()
    }

    async getCurrentUser(): Promise<User | null> {
        const token = localStorage.getItem("auth_token")
        if (!token) return null

        try {
            const { data } = await apolloClient.query({
                query: GET_COMPANY_QUERY,
                variables: { token },
            })

            return data.currentUser
        } catch {
            return null
        }
    }

    getStoredCompanyId(): string | null {
        return localStorage.getItem("company_id")
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem("auth_token")
    }
}
