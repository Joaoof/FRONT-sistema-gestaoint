import React, { createContext, useContext, useReducer, useEffect } from "react"
import type { Company, User } from "../types/auth"
import type { ICompanyContext, IModule } from "../interfaces/IModule"
import { PermissionService } from "../permissions/PermissionsService"
import { useAuth } from "./AuthContext"

interface CompanyContextState extends ICompanyContext {
    user: User | null
    company: Company | null
    permissions: string[]
    modules: IModule[]
    switchCompany: (companyId: string) => Promise<void>
    isLoading: boolean
    permissionService: PermissionService | null
}

type CompanyAction =
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_AUTH_DATA"; payload: { user: User; company: Company; modules: IModule[] } }
    | { type: "LOGOUT" }
    | { type: "SWITCH_COMPANY"; payload: { company: Company; modules: IModule[] } }

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
            console.log("[CompanyContext] SET_LOADING:", action.payload)
            return { ...state, isLoading: action.payload }

        case "SET_AUTH_DATA": {
            const { user, company, modules } = action.payload

            const permissions = modules.flatMap(m =>
                m.permission.map(p => `${m.module_key}:${p}`)
            )

            console.log("[CompanyContext] SET_AUTH_DATA → Módulos:", modules)
            console.log("[CompanyContext] SET_AUTH_DATA → Permissões:", permissions)

            const permissionService = new PermissionService(permissions, modules)

            return {
                ...state,
                user,
                company,
                modules,
                permissions,
                permissionService,
                isLoading: false,
            }
        }

        case "SWITCH_COMPANY": {
            const { company, modules } = action.payload
            const permissions = modules.flatMap(m =>
                m.permission.map(p => `${m.module_key}:${p}`)
            )

            console.log("[CompanyContext] SWITCH_COMPANY → Empresa:", company)
            console.log("[CompanyContext] SWITCH_COMPANY → Módulos:", modules)
            console.log("[CompanyContext] SWITCH_COMPANY → Permissões:", permissions)

            const permissionService = new PermissionService(permissions, modules)

            return {
                ...state,
                company,
                modules,
                permissions,
                permissionService,
                isLoading: false,
            }
        }

        case "LOGOUT":
            console.log("[CompanyContext] LOGOUT acionado")
            return { ...initialState, isLoading: false }

        default:
            return state
    }
}


export function CompanyProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(companyReducer, initialState)
    const { user } = useAuth()

    useEffect(() => {
        if (!user) {
            console.log("[CompanyContext] Nenhum usuário logado")
            dispatch({ type: "SET_LOADING", payload: false })
            dispatch({ type: "LOGOUT" })
            return
        }

        console.log("[CompanyContext] Usuário detectado:", user)

        async function loadCompany() {
            dispatch({ type: "SET_LOADING", payload: true })

            try {
                const company = await fetchCompanyData(user?.companyId ?? '')
                const modules = user?.plan?.modules ?? []

                console.log("[CompanyContext] Empresa carregada:", company)
                console.log("[CompanyContext] Módulos do plano do usuário:", modules)

                dispatch({
                    type: "SET_AUTH_DATA",
                    payload: {
                        user,
                        company,
                        modules,
                    },
                })
            } catch (error) {
                console.error("[CompanyContext] Erro ao carregar empresa:", error)
                dispatch({ type: "LOGOUT" })
            }
        }

        loadCompany()
    }, [user])


    async function switchCompany(companyId: string) {
        dispatch({ type: "SET_LOADING", payload: true })
        try {
            const company = await fetchCompanyData(companyId)
            const modules = user?.plan?.modules ?? [] // assume o mesmo plano ao trocar de empresa

            localStorage.setItem("company_id", companyId)

            dispatch({
                type: "SWITCH_COMPANY",
                payload: { company, modules },
            })
        } catch (error) {
            dispatch({ type: "SET_LOADING", payload: false })
            throw error
        }
    }

    return (
        <CompanyContext.Provider value={{ ...state, switchCompany }}>
            {children}
        </CompanyContext.Provider>
    )
}

export const useCompany = () => {
    const context = useContext(CompanyContext)
    if (!context) throw new Error("useCompany must be used within a CompanyProvider")
    return context
}

// 🚀 Busca empresa (sem módulos)
async function fetchCompanyData(companyId: string): Promise<Company> {
    const token = localStorage.getItem("accessToken")
    if (!token) throw new Error("Usuário não autenticado")

    const response = await fetch("http://localhost:3000/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            query: `
            query GetCompany($id: String!) {
                company(id: $id) {
                    id
                    name
                    email
                    phone
                    address
                    modules {
                        module_key
                        name
                        description
                        permissions  // <-- plural, se for seu schema
                        isActive
                    }
                }
            }
        `,
            variables: { id: companyId },
        }),
    });


    const json = await response.json()

    if (json.errors || !json.data?.company) {
        throw new Error("Erro ao buscar dados da empresa")
    }

    return json.data.company
}
