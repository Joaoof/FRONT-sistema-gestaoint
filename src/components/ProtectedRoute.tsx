import type React from "react"
import { useCompany } from "../contexts/CompanyContext"
import { usePermissions } from "../hooks/usePermissions"

interface ProtectedRouteProps {
    moduleId?: string
    permissions?: string[]
    fallback?: React.ReactNode
    children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    moduleId,
    permissions = [],
    fallback = <div>Access Denied</div>,
    children,
}) => {
    const { isLoading } = useCompany()
    const { canAccessModule, hasAnyPermission } = usePermissions()

    if (isLoading) {
        return <div>Loading...</div>
    }

    // Check module access
    if (moduleId && !canAccessModule(moduleId)) {
        return <>{fallback}</>
    }

    // Check permissions
    if (permissions.length > 0 && !hasAnyPermission(permissions)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
