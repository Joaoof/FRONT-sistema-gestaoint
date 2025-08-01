"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Company, User, AuthState } from "../types/auth"
import { MockAuthService } from "../auth/MockAuthService"

interface AuthContextState extends AuthState {
    user: User | null;
    company: Company | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    modules: Module[]; // ✅ Adicione isso
}

type Module = {
    module_key: string;
    name: string;
    description?: string;
    permission: string[];
    isActive: boolean;
};

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
    modules: [], // ✅
    login: async () => { },
    logout: async () => { },
};

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
                modules: user.plan?.modules || [],
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
            const token = localStorage.getItem("accessToken")
            console.log(token);

            if (token) throw new Error("Sem token")

            const res = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
            query User {
              accessToken
              ex
              user {
                id
                name
                email
                role
                 company {
                    id
                    name
                    email
                 }
                 plan {
  name
  description
  modules {
    module_key
    name
    description
    permission
    isActive
  }
              }
            }
          `,
                }),
            })

            console.log(res);


            const data = await res.json();
            if (data.data?.login?.accessToken) {
                localStorage.setItem('accessToken', data.data.login.accessToken);
                // Pode atualizar contexto ou estado do user aqui também
            } else {
                // tratar erro
                console.log('Login falhou:', data.errors || 'Sem token retornado');
            }
            dispatch({ type: "SET_AUTH_DATA", payload: { user: data, company: data.company } })
        } catch (error) {
            dispatch({ type: "LOGOUT" })
        }
    }

    const login = async (email: string, password_hash: string) => {
        dispatch({ type: "SET_LOADING", payload: true })
        dispatch({ type: "CLEAR_ERROR" })

        try {
            const res = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: `
                                mutation Login($loginUserInput: LoginUserInput!) {
            login(loginUserInput: $loginUserInput) {
                accessToken
                expiresIn
                user {
                id
                name
                email
                role
                company {
                    id
                    name
                    email
                    phone
                    address
                }
                plan {
                    name
                    description
                    modules {
                    module_key
                    name
                    description
                    permission
                    isActive
                    }
                }
                }
            }
            }`,
                    variables: {
                        loginUserInput: {
                            email, password_hash
                        }
                    }
                }),
            })

            const json = await res.json()
            if (json.errors) throw new Error(json.errors[0].message)


            const { accessToken, user } = json.data.login;

            localStorage.setItem("accessToken", accessToken);
            dispatch({ type: "SET_AUTH_DATA", payload: { user, company: user.company } })
        } catch (err: any) {
            dispatch({ type: "SET_ERROR", payload: err.message || "Erro no login" })
            console.error("Erro no login:", err);
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
