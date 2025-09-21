import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { Company, User } from "../types/auth";
import type { IModule } from "../interfaces/IModule";
import { PermissionService } from "../permissions/PermissionsService";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

// Ajuste: IModule deve ter `id`, então garantimos isso
interface CompanyContextState {
    user: User | null;
    company: Company | null;
    permissions: string[];
    modules: IModule[];
    switchCompany: (companyId: string) => Promise<void>;
    isLoading: boolean;
    permissionService: PermissionService | null;
}

type CompanyAction =
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_AUTH_DATA"; payload: { user: User; company: Company; modules: IModule[] } }
    | { type: "LOGOUT" }
    | { type: "SWITCH_COMPANY"; payload: { company: Company; modules: IModule[] } };

const initialState: CompanyContextState = {
    user: null,
    company: null,
    permissions: [],
    modules: [],
    isLoading: true,
    permissionService: null,
    switchCompany: async () => { },
};

const CompanyContext = createContext<CompanyContextState>(initialState);

function companyReducer(state: CompanyContextState, action: CompanyAction): CompanyContextState {
    switch (action.type) {
        case "SET_LOADING":
            console.log("[CompanyContext] SET_LOADING:", action.payload);
            return { ...state, isLoading: action.payload };

        case "SET_AUTH_DATA": {
            const { user, company, modules: rawModules } = action.payload;

            // ✅ Garante que cada módulo tenha `id` (usando module_key se não tiver)
            const modules: IModule[] = rawModules.map((mod) => ({
                ...mod,
                id: mod.id || mod.module_key || Math.random().toString(36),
            }));

            const permissions = modules.flatMap((m) =>
                m.permission.map((p) => `${m.module_key}:${p}`)
            );

            console.log("[CompanyContext] SET_AUTH_DATA → Módulos:", modules);
            console.log("[CompanyContext] SET_AUTH_DATA → Permissões:", permissions);

            const permissionService = new PermissionService(permissions, modules);

            return {
                ...state,
                user,
                company,
                modules,
                permissions,
                permissionService,
                isLoading: false,
            };
        }

        case "SWITCH_COMPANY": {
            const { company, modules: rawModules } = action.payload;

            const modules: IModule[] = rawModules.map((mod) => ({
                ...mod,
                id: mod.id || mod.module_key || Math.random().toString(36),
            }));

            const permissions = modules.flatMap((m) =>
                m.permission.map((p) => `${m.module_key}:${p}`)
            );

            console.log("[CompanyContext] SWITCH_COMPANY → Empresa:", company);
            console.log("[CompanyContext] SWITCH_COMPANY → Módulos:", modules);
            console.log("[CompanyContext] SWITCH_COMPANY → Permissões:", permissions);

            const permissionService = new PermissionService(permissions, modules);

            return {
                ...state,
                company,
                modules,
                permissions,
                permissionService,
                isLoading: false,
            };
        }

        case "LOGOUT":
            console.log("[CompanyContext] LOGOUT acionado");
            return { ...initialState, isLoading: false };

        default:
            return state;
    }
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(companyReducer, initialState);
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            console.log("[CompanyContext] Nenhum usuário logado");
            dispatch({ type: "SET_LOADING", payload: false });
            dispatch({ type: "LOGOUT" });
            return;
        }

        console.log("[CompanyContext] Usuário detectado:", user);
        if (!user.company_id) {
            console.error("[CompanyContext] Usuário sem company_id");
            dispatch({ type: "LOGOUT" });
            return;
        }

        console.log("[CompanyProvider] Carregando empresa para:", user.company_id);

        const abortController = new AbortController();

        async function loadCompany() {
            if (state.isLoading) return;

            dispatch({ type: "SET_LOADING", payload: true });

            try {
                const company = await fetchCompanyData(user?.company_id ?? '');
                const rawModules = user?.plan?.modules ?? [];

                const modules: IModule[] = rawModules.map((mod: any) => ({
                    ...mod,
                    id: mod.id || mod.module_key || Math.random().toString(36),
                }));

                if (abortController.signal.aborted) return;

                dispatch({
                    type: "SET_AUTH_DATA",
                    payload: { user, company, modules },
                });
            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.error("[CompanyContext] Erro ao carregar empresa:", error);
                    toast.error("Erro ao carregar empresa. Verifique sua conexão.");
                    dispatch({ type: "LOGOUT" });
                }
            } finally {
                if (!abortController.signal.aborted) {
                    dispatch({ type: "SET_LOADING", payload: false });
                }
            }
        }

        loadCompany();

        return () => {
            abortController.abort();
        };
    }, [user?.company_id, user]);

    const switchCompany = async (companyId: string) => {
        dispatch({ type: "SET_LOADING", payload: true });
        try {
            const company = await fetchCompanyData(companyId);
            const rawModules = user?.plan?.modules ?? [];
            const modules: IModule[] = rawModules.map((mod: any) => ({
                ...mod,
                id: mod.id || mod.module_key || Math.random().toString(36),
                name: mod.name || "Sem nome",
                description: mod.description || "",
                permission: mod.permission || [],
                isActive: mod.isActive ?? false,
            }));


            localStorage.setItem("company_id", companyId);

            dispatch({
                type: "SWITCH_COMPANY",
                payload: { company, modules },
            });
        } catch (error) {
            dispatch({ type: "SET_LOADING", payload: false });
            toast.error("Falha ao trocar de empresa");
            throw error;
        }
    };

    return (
        <CompanyContext.Provider value={{ ...state, switchCompany }}>
            {children}
        </CompanyContext.Provider>
    );
}

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error("useCompany must be used within a CompanyProvider");
    }
    return context;
};

// 🚀 Busca empresa
async function fetchCompanyData(company_id: string): Promise<Company> {
    console.log("[fetchCompanyData] Iniciando busca para:", company_id);

    const token = localStorage.getItem("accessToken");
    if (!token) {
        console.error("[fetchCompanyData] Token ausente");
        throw new Error("Token ausente");
    }

    const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
    if (!endpoint) {
        console.error("[fetchCompanyData] VITE_GRAPHQL_ENDPOINT não definido");
        throw new Error("Endpoint não configurado");
    }

    console.log("[fetchCompanyData] Enviando para:", endpoint);

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "x-apollo-operation-name": "GetCompany", // ✅ Evita bloqueio CSRF
        },
        body: JSON.stringify({
            query: `
                query GetCompany($id: String!) {
                    company(id: $id) {
                        id
                        name
                        logoUrl
                    }
                }
            `,
            variables: { id: company_id },
        }),
    });

    console.log("[fetchCompanyData] Status da resposta:", response.status);

    if (!response.ok) {
        const text = await response.text();
        console.error("[fetchCompanyData] Erro HTTP:", response.status, text);
        throw new Error(`Falha na requisição: ${response.status}`);
    }

    const json = await response.json();
    console.log("[fetchCompanyData] Resposta completa:", json);

    if (json.errors) {
        console.error("[fetchCompanyData] Erros do GraphQL:", json.errors);
        throw new Error("Erro no GraphQL");
    }

    if (!json.data?.company) {
        throw new Error("Empresa não encontrada");
    }

    return json.data.company;
}