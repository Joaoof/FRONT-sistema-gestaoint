import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { Company, User, AuthState } from "../types/auth"
import { useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification"
import { GET_USER_QUERY, LOGIN_MUTATION } from "../graphql/queries/user";
import { toast } from "sonner";


interface AuthContextState extends AuthState {
    user: User | null;
    company: Company | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    modules: Module[];
    permissions: { module_key: string; permissions: string[] }[];
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
    modules: [],
    permissions: [],
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
                permissions: user.permissions || [],
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
    const navigate = useNavigate();
    const { notifyError, notifySuccess } = useNotification()

    useEffect(() => {
        initializeAuth()
    }, [])

    const initializeAuth = async () => {
        dispatch({ type: "SET_LOADING", payload: true });

        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                console.log("[Auth] Sem token no localStorage");
                return;
            }

            const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
            if (!endpoint) {
                toast.error("❌ VITE_GRAPHQL_ENDPOINT não definido!");
                dispatch({ type: "SET_ERROR", payload: "Erro de configuração" });
                return;
            }

            // [MANTIDO] Chamada GET_USER_QUERY para re-hidratação (necessário)
            const res = await fetch(endpoint ?? '', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: GET_USER_QUERY,
                }),
            });

            const json = await res.json();

            if (json.errors || !json.data?.me) {
                console.error("[Auth] Erro ou token expirado, fazendo logout.", json.errors);
                localStorage.removeItem("accessToken");
                dispatch({ type: "LOGOUT" });
                return;
            }

            const { me: user } = json.data;
            dispatch({
                type: "SET_AUTH_DATA",
                payload: { user, company: user.company },
            });
        } catch (error) {
            console.error("[Auth] Erro ao inicializar auth:", error);
            localStorage.removeItem("accessToken");
            dispatch({ type: "LOGOUT" });
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    const login = async (email: string, password_hash: string) => {
        dispatch({ type: "SET_LOADING", payload: true })
        dispatch({ type: "CLEAR_ERROR" })

        const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
        if (!endpoint) {
            notifyError("❌ VITE_GRAPHQL_ENDPOINT não definido!", 5000);
            dispatch({ type: "SET_ERROR", payload: "Erro de configuração" });
            return;
        }

        try {
            // PRIMEIRA E ÚNICA REQUISIÇÃO OBRIGATÓRIA (OTIMIZADA)
            const resLogin = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: LOGIN_MUTATION,
                    variables: {
                        loginUserInput: {
                            email, password_hash
                        }
                    }
                }),
            })

            const loginData = await resLogin.json();

            if (loginData.errors) {
                const error = loginData.errors[0];
                const code = error.extensions?.code;
                let message: string = "Credenciais inválidas. Tente novamente.";

                // 1. Tratamento de erro de validação (Zod)
                if (code === 'DOMAIN_VALIDATION_ERROR' && Array.isArray(error.extensions?.errors)) {
                    message = error.extensions.errors.map((e: { message: any; }) => e.message).join('\n');
                } else if (error.message) {
                    // 2. Outros erros (ex: credenciais inválidas)
                    message = error.message;
                }

                notifyError(message, 5000);
                dispatch({ type: "SET_ERROR", payload: message });
                return;
            }

            if (!loginData.data?.login) {
                notifyError("Resposta inválida do servidor", 3000);
                dispatch({ type: "SET_ERROR", payload: "Resposta inválida" });
                return;
            }


            // Extrai o payload completo da resposta
            const { accessToken, user, company } = loginData.data.login;

            if (!accessToken || !user || !company) {
                notifyError("Dados essenciais de login não recebidos.", 3000);
                dispatch({ type: "SET_ERROR", payload: "Dados ausentes" });
                return;
            }

            // Otimização: Remoção da segunda chamada de rede
            localStorage.setItem("accessToken", accessToken);
            dispatch({ type: "SET_AUTH_DATA", payload: { user, company } });
            notifySuccess('Login realizado com sucesso!', 5000);

        } catch (err: any) {
            const message = err.message || "Erro de conexão com o servidor";
            dispatch({ type: "SET_ERROR", payload: message });
            notifyError(message, 5000);
            // throw err; // Não é necessário re-lançar o erro se já tratou e notificou
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
        permissions: state.permissions, // garantido
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