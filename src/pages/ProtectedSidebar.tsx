import type React from "react"
import { useCompany } from "../contexts/CompanyContext"
import { ModuleGuard } from "../guards/ModuleGuard"
import { PermissionGuard } from "../guards/PermissionGuard"

interface SidebarItem {
    id: string
    label: string
    icon: React.ReactNode
    moduleId: string
    permissions?: string[]
    path: string
}

const sidebarItems: SidebarItem[] = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: "📊",
        moduleId: "analytics",
        path: "/dashboard",
    },
    {
        id: "products",
        label: "Products",
        icon: "📦",
        moduleId: "products",
        permissions: ["products:read"],
        path: "/products",
    },
    {
        id: "inventory",
        label: "Inventory",
        icon: "📋",
        moduleId: "inventory",
        permissions: ["inventory:read"],
        path: "/inventory",
    },
    {
        id: "customers",
        label: "Customers",
        icon: "👥",
        moduleId: "customers",
        permissions: ["customers:read"],
        path: "/customers",
    },
]

export const ProtectedSidebar: React.FC = () => {
    const { company } = useCompany()

    if (!company) {
        return <div>Loading...</div>
    }

    return (
        <div className="w-64 bg-gray-800 text-white h-full">
            <div className="p-4">
                <h2 className="text-xl font-bold">{company.name}</h2>
            </div>

            <nav className="mt-8">
                {sidebarItems.map((item) => (
                    <ModuleGuard key={item.id} moduleId={item.moduleId}>
                        <PermissionGuard permissions={item.permissions || []}>
                            <a
                                href={item.path}
                                className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                                <span className="mr-3">{item.icon}</span>
                                {item.label}
                            </a>
                        </PermissionGuard>
                    </ModuleGuard>
                ))}
            </nav>
        </div>
    )
}
