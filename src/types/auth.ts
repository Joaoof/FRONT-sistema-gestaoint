export interface User {

    id: string
    email: string
    name: string
    phone?: string | null
    avatarUrl?: string | null
    company_id: string
    role: UserRole
    is_active?: boolean
    isSuperAdmin?: boolean
    plan: PlanDto; // ✅ Corrigido: é um objeto, não uma string
    permissions: PermissionDto[]
}

export type PermissionDto = {
    module_key: string;
    permissions: string[];
}

export type PlanDto = {
    id: string;
    name: string;
    description?: string;
    modules: ModuleDto[];
};

export type ModuleDto = {
    module_key: string;
    name: string;
    description?: string;
    permission: string[];
    isActive: boolean;
};

export interface Company {
    id: string
    name: string
    nomeFantasia?: string | null
    razaoSocial?: string | null
    inscricaoEstadual?: string | null
    address?: string | null
    bairro?: string | null
    cidade?: string | null
    estado?: string | null
    cep?: string | null
    latitude?: number | null
    longitude?: number | null
    cnpj?: string | null
    email?: string | null
    phone?: string | null
    modules?: ModuleAccess[]
    settings?: CompanySettings
    logoUrl?: string | null
}

export interface ModuleAccess {
    moduleId: string
    permissions: Permission[]
    isActive: boolean
}

export interface Permission {
    action: string // 'read', 'write', 'delete', 'admin'
    resource: string // 'products', 'inventory', 'customers', etc.
}

export enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    USER = "user",
}

export interface CompanySettings {
    theme?: string
    features?: string[]
    limits?: {
        maxProducts?: number
        maxUsers?: number
    }
}

export interface AuthState {
    user: User | null
    company: Company | null
    isAuthenticated: boolean
    isLoading: boolean
}

