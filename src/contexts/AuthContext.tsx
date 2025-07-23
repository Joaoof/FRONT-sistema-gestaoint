"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Company, User, AuthState } from "../types/auth"
import { MockAuthService } from "../auth/MockAuthService"

interface AuthContextState extends AuthState {
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    error: string | null
}

type AuthAction =
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_AUTH_DATA"; payload: { user: User; company: Company } }
    | { type: "SET_ERROR"; payload: string }
    | { type: "CLEAR_ERROR" }
    | { type: "LOGOUT" }

const initialState: AuthContextState = {
    user: null,
    company: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    login: async () => { },
    logout: async () => { },
}

const AuthContext = createContext<AuthContextState>(initialState)

function authReducer(state: AuthContextState, action: AuthAction): AuthContextState {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, isLoading: action.payload }

        case "SET_AUTH_DATA":
            const { user, company } = action.payload
            return {
                ...state,
                user,
                company,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            }

        case "SET_ERROR":
            return {
                ...state,
                error: action.payload,
                isLoading: false,
            }

        case "CLEAR_ERROR":
            return {
                ...state,
                error: null,
            }

        case "LOGOUT":
            return {
                ...initialState,
                isLoading: false,
            }

        default:
            return state
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState)
    const authService = MockAuthService.getInstance()

    useEffect(() => {
        initializeAuth()
    }, [])

    const initializeAuth = async () => {
        try {
            if (authService.isAuthenticated()) {
                const user = await authService.getCurrentUser()
                if (user) {
                    const companyId = authService.getStoredCompanyId()
                    if (companyId) {
                        const company = await authService.getCompanyData(companyId)
                        if (company) {
                            dispatch({ type: "SET_AUTH_DATA", payload: { user, company } })
                            return
                        }
                    }
                }
            }
            dispatch({ type: "SET_LOADING", payload: false })
        } catch (error) {
            dispatch({ type: "LOGOUT" })
        }
    }

    const login = async (email: string, password: string) => {
        dispatch({ type: "SET_LOADING", payload: true })
        dispatch({ type: "CLEAR_ERROR" })

        try {
            const { user, company } = await authService.login(email, password)
            dispatch({ type: "SET_AUTH_DATA", payload: { user, company } })
        } catch (error) {
            dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : "Erro no login" })
        }
    }

    const logout = async () => {
        await authService.logout()
        dispatch({ type: "LOGOUT" })
    }

    const contextValue: AuthContextState = {
        ...state,
        login,
        logout,
    }

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
