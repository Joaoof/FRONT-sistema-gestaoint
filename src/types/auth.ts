export interface User {

    id: string
    email: string
    name: string
    company_id: string
    role: UserRole
    plan?: PlanDto; // ✅ Corrigido: é um objeto, não uma string
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
    address: string
    cnpj: string
    modules: ModuleAccess[]
    settings: CompanySettings
    logoUrl: string
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

