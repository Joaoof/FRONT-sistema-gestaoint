export interface User {
    id: string
    email: string
    name: string
    companyId: string
    role: UserRole
}

export interface Company {
    id: string
    name: string
    modules: ModuleAccess[]
    settings: CompanySettings
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
