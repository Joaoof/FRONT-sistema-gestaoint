"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Company, User } from "../types/auth"
import type { ICompanyContext, IModule } from "../interfaces/IModule"
import { AuthService } from "../auth/AuthService"
import { PermissionService } from "../permissions/PermissionsService"

interface CompanyContextState extends ICompanyContext {
    user: User | null
    company: Company | null;
    permissions: string[]
    modules: IModule[]
    switchCompany: (companyId: string) => Promise<void>
    isLoading: boolean
    permissionService: PermissionService | null
}

type CompanyAction =
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_AUTH_DATA"; payload: { user: User; company: Company } }
    | { type: "LOGOUT" }
    | { type: "SWITCH_COMPANY"; payload: Company }

const initialState: CompanyContextState = {
    user: null,
    company: null,
    permissions: [],
    modules: [],
    isLoading: true,
    permissionService: null,
    switchCompany: async () => { },
}

const CompanyContext = createContext<CompanyContextState>(initialState)

function companyReducer(state: CompanyContextState, action: CompanyAction): CompanyContextState {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, isLoading: action.payload }

        case "SET_AUTH_DATA":
            const { user, company } = action.payload
            const permissions = company.modules.flatMap((m) => m.permissions.map((p) => `${p.resource}:${p.action}`))
            const permissionService = new PermissionService(permissions, company.modules)

            return {
                ...state,
                user,
                company,
                permissions,
                permissionService,
                isLoading: false,
            }

        case "LOGOUT":
            return {
                ...initialState,
                isLoading: false,
            }

        case "SWITCH_COMPANY":
            const newPermissions = action.payload.modules.flatMap((m) =>
                m.permissions.map((p) => `${p.resource}:${p.action}`),
            )
            const newPermissionService = new PermissionService(newPermissions, action.payload.modules)

            return {
                ...state,
                company: action.payload,
                permissions: newPermissions,
                permissionService: newPermissionService,
            }

        default:
            return state
    }
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(companyReducer, initialState)
    const authService = AuthService.getInstance()

    useEffect(() => {
        initializeAuth()
    }, [])

    const initializeAuth = async () => {
        try {
            if (authService.isAuthenticated()) {
                const user = await authService.getCurrentUser()
                if (user) {
                    // Fetch company data
                    const companyId = authService.getStoredCompanyId()
                    if (companyId) {
                        // This would be a GraphQL query to get company data
                        const company = await fetchCompanyData(companyId)
                        dispatch({ type: "SET_AUTH_DATA", payload: { user, company } })
                    }
                } else {
                    dispatch({ type: "LOGOUT" })
                }
            } else {
                dispatch({ type: "SET_LOADING", payload: false })
            }
        } catch (error) {
            dispatch({ type: "LOGOUT" })
        }
    }

    const switchCompany = async (companyId: string) => {
        dispatch({ type: "SET_LOADING", payload: true })
        try {
            const company = await fetchCompanyData(companyId)
            localStorage.setItem("company_id", companyId)
            dispatch({ type: "SWITCH_COMPANY", payload: company })
        } catch (error) {
            dispatch({ type: "SET_LOADING", payload: false })
            throw error
        }
    }

    const contextValue: CompanyContextState = {
        ...state,
        switchCompany,
    }

    return <CompanyContext.Provider value={contextValue}>{children}</CompanyContext.Provider>
}

export const useCompany = () => {
    const context = useContext(CompanyContext)
    if (!context) {
        throw new Error("useCompany must be used within a CompanyProvider")
    }
    return context
}

// Helper function - would be implemented with actual GraphQL query
async function fetchCompanyData(companyId: string): Promise<Company> {
    // Implementation would use Apollo Client
    throw new Error("Not implemented")
}
