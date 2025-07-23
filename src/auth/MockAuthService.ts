import type { User, Company } from "../types/auth"

// Mock data for testing
const mockUsers = [
    {
        id: "1",
        email: "the9@gmail.com",
        password: "123456",
        name: "Usuário Plano Básico",
        companyId: "company_basic",
        role: "user" as const,
    },
    {
        id: "2",
        email: "jcconcretos@gmail.com",
        password: "123456",
        name: "JC Concretos Admin",
        companyId: "company_premium",
        role: "admin" as const,
    },
    // Manter os usuários de teste existentes
    {
        id: "3",
        email: "admin@empresa1.com",
        password: "123456",
        name: "Admin Empresa 1",
        companyId: "company1",
        role: "admin" as const,
    },
    {
        id: "4",
        email: "user@empresa1.com",
        password: "123456",
        name: "Usuário Empresa 1",
        companyId: "company1",
        role: "user" as const,
    },
]

const mockCompanies: Company[] = [
    {
        id: "company_basic",
        name: "Plano Básico",
        modules: [
            {
                moduleId: "dashboard",
                isActive: true,
                permissions: [{ action: "read", resource: "analytics" }],
            },
            {
                moduleId: "estoque",
                isActive: true,
                permissions: [
                    { action: "read", resource: "inventory" },
                    { action: "write", resource: "inventory" },
                ],
            },
            {
                moduleId: "vendas",
                isActive: true,
                permissions: [
                    { action: "read", resource: "sales" },
                    { action: "write", resource: "sales" },
                ],
            },
            // Outros módulos não disponíveis no plano básico
        ],
        settings: {
            theme: "gray",
            features: ["basic-reports"],
            limits: {
                maxProducts: 500,
                maxUsers: 2,
            },
        },
    },
    {
        id: "company_premium",
        name: "JC Concretos",
        modules: [
            {
                moduleId: "dashboard",
                isActive: true,
                permissions: [
                    { action: "read", resource: "analytics" },
                    { action: "write", resource: "analytics" },
                    { action: "read", resource: "reports" },
                ],
            },
            {
                moduleId: "estoque",
                isActive: true,
                permissions: [
                    { action: "read", resource: "inventory" },
                    { action: "write", resource: "inventory" },
                    { action: "delete", resource: "inventory" },
                    { action: "admin", resource: "inventory" },
                ],
            },
            {
                moduleId: "vendas",
                isActive: true,
                permissions: [
                    { action: "read", resource: "sales" },
                    { action: "write", resource: "sales" },
                    { action: "delete", resource: "sales" },
                    { action: "admin", resource: "sales" },
                ],
            },
            {
                moduleId: "cadastros",
                isActive: true,
                permissions: [
                    { action: "read", resource: "products" },
                    { action: "write", resource: "products" },
                    { action: "delete", resource: "products" },
                    { action: "read", resource: "customers" },
                    { action: "write", resource: "customers" },
                    { action: "delete", resource: "customers" },
                    { action: "read", resource: "suppliers" },
                    { action: "write", resource: "suppliers" },
                    { action: "delete", resource: "suppliers" },
                ],
            },
            {
                moduleId: "fiscal",
                isActive: true,
                permissions: [
                    { action: "read", resource: "fiscal" },
                    { action: "write", resource: "fiscal" },
                    { action: "admin", resource: "fiscal" },
                ],
            },
            {
                moduleId: "financeiro",
                isActive: true,
                permissions: [
                    { action: "read", resource: "financial" },
                    { action: "write", resource: "financial" },
                    { action: "admin", resource: "financial" },
                ],
            },
            {
                moduleId: "ecommerce",
                isActive: true,
                permissions: [
                    { action: "read", resource: "ecommerce" },
                    { action: "write", resource: "ecommerce" },
                    { action: "admin", resource: "ecommerce" },
                ],
            },
            {
                moduleId: "consultas",
                isActive: true,
                permissions: [
                    { action: "read", resource: "reports" },
                    { action: "write", resource: "reports" },
                    { action: "admin", resource: "reports" },
                ],
            },
        ],
        settings: {
            theme: "blue",
            features: ["advanced-reports", "multi-location", "api-access", "custom-integrations"],
            limits: {
                maxProducts: 50000,
                maxUsers: 100,
            },
        },
    },
    // Manter as empresas de teste existentes
    {
        id: "company1",
        name: "Empresa Premium Ltda",
        modules: [
            {
                moduleId: "dashboard",
                isActive: true,
                permissions: [
                    { action: "read", resource: "analytics" },
                    { action: "read", resource: "reports" },
                ],
            },
            {
                moduleId: "estoque",
                isActive: true,
                permissions: [
                    { action: "read", resource: "inventory" },
                    { action: "write", resource: "inventory" },
                    { action: "delete", resource: "inventory" },
                ],
            },
            {
                moduleId: "vendas",
                isActive: true,
                permissions: [
                    { action: "read", resource: "sales" },
                    { action: "write", resource: "sales" },
                ],
            },
            {
                moduleId: "cadastros",
                isActive: true,
                permissions: [
                    { action: "read", resource: "products" },
                    { action: "write", resource: "products" },
                    { action: "read", resource: "customers" },
                    { action: "write", resource: "customers" },
                ],
            },
        ],
        settings: {
            theme: "blue",
            features: ["advanced-reports", "multi-location"],
            limits: {
                maxProducts: 10000,
                maxUsers: 50,
            },
        },
    },
]

export class MockAuthService {
    private static instance: MockAuthService

    private constructor() { }

    public static getInstance(): MockAuthService {
        if (!MockAuthService.instance) {
            MockAuthService.instance = new MockAuthService()
        }
        return MockAuthService.instance
    }

    async login(email: string, password: string): Promise<{ user: User; company: Company; token: string }> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const mockUser = mockUsers.find((u) => u.email === email && u.password === password)

        if (!mockUser) {
            throw new Error("Credenciais inválidas")
        }

        const company = mockCompanies.find((c) => c.id === mockUser.companyId)

        if (!company) {
            throw new Error("Empresa não encontrada")
        }

        const user: User = {
            id: mockUser.id,
            email: mockUser.email,
            name: mockUser.name,
            companyId: mockUser.companyId,
            role: mockUser.role as any,
        }

        const token = `mock_token_${mockUser.id}_${Date.now()}`

        // Store in localStorage
        localStorage.setItem("auth_token", token)
        localStorage.setItem("company_id", company.id)
        localStorage.setItem("user_data", JSON.stringify(user))

        return { user, company, token }
    }

    async logout(): Promise<void> {
        localStorage.removeItem("auth_token")
        localStorage.removeItem("company_id")
        localStorage.removeItem("user_data")
    }

    async getCurrentUser(): Promise<User | null> {
        const token = localStorage.getItem("auth_token")
        const userData = localStorage.getItem("user_data")

        if (!token || !userData) return null

        try {
            return JSON.parse(userData)
        } catch {
            return null
        }
    }

    async getCompanyData(companyId: string): Promise<Company | null> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        return mockCompanies.find((c) => c.id === companyId) || null
    }

    getStoredCompanyId(): string | null {
        return localStorage.getItem("company_id")
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem("auth_token")
    }
}
