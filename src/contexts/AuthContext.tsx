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

            console.log("[Auth] Token encontrado, consultando usuário...");

            const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
            if (!endpoint) {
                toast.error("❌ VITE_GRAPHQL_ENDPOINT não definido!");
                dispatch({ type: "SET_ERROR", payload: "Erro de configuração" });
                return;
            }

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
            console.log('MEU JSONNNNNNNNNNNNNN', json);


            if (json.errors) {
                console.error("[Auth] Erros no GraphQL:", json.errors);
                localStorage.removeItem("accessToken");
                dispatch({ type: "LOGOUT" });
                return;
            }

            if (!json.data?.me) {
                console.warn("[Auth] Resposta sem usuário");
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
            toast.error("❌ VITE_GRAPHQL_ENDPOINT não definido!");
            dispatch({ type: "SET_ERROR", payload: "Erro de configuração" });
            return;
        }

        try {
            const resLogin = await fetch(endpoint ?? '', {
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

            // ALTERAÇÃO CRÍTICA PARA DEPURAR A RESPOSTA
            console.log("-----------------------------------------");
            console.log("1. Resposta da LOGIN_MUTATION:", loginData);
            console.log("-----------------------------------------");

            if (loginData.errors) {
                const error = loginData.errors[0];
                const code = error.extensions?.code;

                let message = "Erro desconhecido ao logar.";

                // 1. Erro com detalhes por campo (validação)
                if (code === 'DOMAIN_VALIDATION_ERROR' && Array.isArray(error.extensions?.errors)) {
                    const validationErrors = error.extensions.errors;
                    const errorMessage = validationErrors.map((e: { message: any; }) => e.message).join('\n');
                    message = errorMessage;
                } else {
                    // 2. Outros erros (ex: credenciais inválidas, genéricos)
                    message = error.message;
                }

                notifyError(message, 5000);
                dispatch({ type: "SET_ERROR", payload: message });
                return;
            }

            if (!loginData.data?.login) {
                notifyError("Resposta inválida do servidor: Login falhou sem erro explícito.", 5000);
                dispatch({ type: "SET_ERROR", payload: "Resposta inválida/Login falhou" });
                return;
            }


            const { accessToken } = loginData.data.login;

            // Inicia a segunda requisição (busca de usuário)
            const resMe = await fetch(import.meta.env.VITE_GRAPHQL_ENDPOINT ?? '', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    query: GET_USER_QUERY,
                }),
            });

            const meData = await resMe.json();

            // NOVA VERIFICAÇÃO CRÍTICA
            console.log("-----------------------------------------");
            console.log("2. Resposta da GET_USER_QUERY:", meData);
            console.log("-----------------------------------------");

            if (meData.errors || !meData.data?.me) {
                console.error("[Auth] Falha na busca de usuário:", meData.errors || "Dados ausentes");
                notifyError("Falha ao buscar dados do usuário. Tente novamente.", 5000);
                localStorage.removeItem("accessToken");
                dispatch({ type: "LOGOUT" });
                return;
            }

            if (!accessToken) {
                // Tecnicamente inalcançável se o if anterior funcionou, mas mantido.
                notifyError("Token não recebido do servidor", 3000);
                dispatch({ type: "SET_ERROR", payload: "Token ausente" });
                return;
            }

            notifySuccess('Login realizado com sucesso!', 5000)

            // Simplificação da lógica de sucesso
            const user = meData.data.me;
            console.log("Usuário autenticado:", user);


            localStorage.setItem("accessToken", accessToken);
            dispatch({ type: "SET_AUTH_DATA", payload: { user, company: user.company } })
        } catch (err: any) {
            const message = err.message || "Erro de conexão com o servidor";
            console.error("[Auth] Erro catastrófico de conexão:", err);
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
        permissions: state.permissions,
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
