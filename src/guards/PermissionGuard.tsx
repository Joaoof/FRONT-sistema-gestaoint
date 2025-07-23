import type React from "react"
import { useCompany } from "../contexts/CompanyContext"

interface PermissionGuardProps {
    permissions?: string[]
    moduleId?: string
    action?: string
    resource?: string
    fallback?: React.ReactNode
    children: React.ReactNode
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    permissions = [],
    moduleId,
    action,
    resource,
    fallback = null,
    children,
}) => {
    const { permissionService } = useCompany()

    if (!permissionService) {
        return <>{fallback}</>
    }

    // Check module access
    if (moduleId && !permissionService.canAccessModule(moduleId)) {
        return <>{fallback}</>
    }

    // Check specific action on resource
    if (moduleId && action && resource) {
        if (!permissionService.canPerformAction(moduleId, action, resource)) {
            return <>{fallback}</>
        }
    }

    // Check general permissions
    if (permissions.length > 0 && !permissionService.hasAnyPermission(permissions)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
