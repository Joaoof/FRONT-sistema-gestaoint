import { createContext, useContext, useReducer, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";

// Tipos
type Module = {
    module_key: string;
    name: string;
    description?: string;
    permission: string[];
    isActive: boolean;
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    company_id: string;
    company: Company;
    plan: Plan;
    permissions: { module_key: string; permissions: string[] }[];
};

export type Company = {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
};

type Plan = {
    id: string;
    name: string;
    description?: string;
    modules: Module[];
};

interface AuthState {
    user: User | null;
    company: Company | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    permissions: { module_key: string; permissions: string[] }[];
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

// GraphQL
const GET_USER_QUERY = `query { me { id name email role company_id company { id name } plan { id name } permissions { module_key permissions } } }`;
const LOGIN_MUTATION = `mutation Login($loginUserInput: LoginUserInput!) { login(loginUserInput: $loginUserInput) { accessToken } }`;

// Estado inicial
const initialState: AuthState = {
    user: null,
    company: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    permissions: [],
    login: async () => { },
    logout: async () => { },
};

const AuthContext = createContext<AuthState>(initialState);

type AuthAction =
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_AUTH_DATA"; payload: { user: User; company: Company } }
    | { type: "SET_ERROR"; payload: string }
    | { type: "LOGOUT" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case "SET_LOADING":
            return { ...state, isLoading: action.payload };
        case "SET_AUTH_DATA":
            return {
                ...state,
                user: action.payload.user,
                company: action.payload.company,
                permissions: action.payload.user.permissions,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case "SET_ERROR":
            return { ...state, error: action.payload, isLoading: false };
        case "LOGOUT":
            return { ...initialState, isLoading: false };
        default:
            return state;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const navigate = useNavigate();
    const { notifyError, notifySuccess } = useNotification();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            dispatch({ type: "SET_LOADING", payload: false });
            return;
        }

        // ✅ Pré-carregamento: inicie a consulta ao usuário imediatamente
        fetchUser(token);
    }, []);

    const fetchUser = async (token: string) => {
        dispatch({ type: "SET_LOADING", payload: true });

        try {
            const res = await fetch(import.meta.env.VITE_GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ query: GET_USER_QUERY }),
            });

            const json = await res.json();

            if (json.errors || !json.data?.me) {
                localStorage.removeItem("accessToken");
                dispatch({ type: "LOGOUT" });
                return;
            }

            const user = json.data.me;
            dispatch({
                type: "SET_AUTH_DATA",
                payload: { user, company: user.company },
            });
        } catch (err) {
            localStorage.removeItem("accessToken");
            dispatch({ type: "LOGOUT" });
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    const login = async (email: string, password: string) => {
        dispatch({ type: "SET_LOADING", payload: true });
        dispatch({ type: "SET_ERROR", payload: "" });

        try {
            const res = await fetch(import.meta.env.VITE_GRAPHQL_ENDPOINT, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: LOGIN_MUTATION,
                    variables: { loginUserInput: { email, password_hash: password } },
                }),
            });

            const data = await res.json();

            if (data.errors) {
                const msg = data.errors[0].message || "Credenciais inválidas";
                notifyError(msg);
                dispatch({ type: "SET_ERROR", payload: msg });
                return;
            }

            const { accessToken } = data.data.login;
            localStorage.setItem("accessToken", accessToken);

            // ✅ Carregue o usuário imediatamente
            await fetchUser(accessToken);

            notifySuccess("Login realizado com sucesso!");
        } catch (err) {
            notifyError("Erro de conexão");
            dispatch({ type: "SET_ERROR", payload: "Erro de rede" });
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    const logout = async () => {
        localStorage.removeItem("accessToken");
        notifySuccess("Você saiu com sucesso!");
        dispatch({ type: "LOGOUT" });
        navigate("/");
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};