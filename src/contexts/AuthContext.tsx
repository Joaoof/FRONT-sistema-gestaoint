import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Company, User, AuthState } from "../types/auth"
import { useNavigate } from "react-router-dom"; // ✅
import { useNotification } from "../hooks/useNotification"


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
    const navigate = useNavigate(); // ✅ agora sim
    const { notifyError, notifySuccess } = useNotification()

    useEffect(() => {
        initializeAuth()
    }, [])

    const initializeAuth = async () => {
        try {
            const token = localStorage.getItem("accessToken")
            if (!token) {
                dispatch({ type: "SET_LOADING", payload: false })
                return
            }

            const res = await fetch("http://localhost:3000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
          query GetUser {
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
          }
        `,
                }),
            })

            const json = await res.json()

            if (json.errors || !json.data?.user) {
                localStorage.removeItem("accessToken")
                dispatch({ type: "LOGOUT" })
                return
            }

            const { user } = json.data
            dispatch({ type: "SET_AUTH_DATA", payload: { user, company: user.company } })
        } catch (error) {
            console.error("Erro ao inicializar auth:", error)
            dispatch({ type: "LOGOUT" })
        } finally {
            dispatch({ type: "SET_LOADING", payload: false }) // ✅ Garantido
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

            console.log("Resposta completa do GraphQL:", json) // ✅ Agora sim, você verá os erros
            if (json.errors) {
                const error = json.errors[0];
                const code = error.extensions?.code;

                // ✅ 1. Erro com detalhes por campo (validação)
                if (code === 'DOMAIN_VALIDATION_ERROR' && Array.isArray(error.extensions?.errors)) {
                    const validationErrors = error.extensions.errors;

                    // Extraia as mensagens
                    const errorMessage = validationErrors.map((e: { message: any; }) => e.message).join('\n');

                    notifyError(errorMessage, 2000);
                    dispatch({ type: "SET_ERROR", payload: errorMessage });
                    return;
                }

                // ✅ 2. Outros erros (ex: credenciais inválidas)
                const message = error.message;
                notifyError(message, 5000);
                dispatch({ type: "SET_ERROR", payload: message });
            }

            if (!json.data?.login) {
                notifyError("Resposta inválida do servidor", 3000);
                dispatch({ type: "SET_ERROR", payload: "Resposta inválida" });
                return;
            }


            const { accessToken, user } = json.data.login;

            notifySuccess('Login realizado com sucesso!', 5000)

            if (!user) {
                notifyError('Usuário inválido')
                dispatch({ type: "LOGOUT" })
                return
            }


            localStorage.setItem("accessToken", accessToken);
            dispatch({ type: "SET_AUTH_DATA", payload: { user, company: user.company } })
        } catch (err: any) {
            const message = err.message || "Erro de conexão com o servidor";
            dispatch({ type: "SET_ERROR", payload: message });
            notifyError(message, 5000);
            throw err;
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    }
    const logout = async () => {
        // Limpa o token
        localStorage.removeItem("accessToken");

        notifySuccess('Você saiu com sucesso!', 5000);

        dispatch({ type: "LOGOUT" });

        navigate("/");
    };

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
