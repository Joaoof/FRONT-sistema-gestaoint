import { useCompany } from "../contexts/CompanyContext"

export const usePermissions = () => {
    const { permissionService, permissions } = useCompany()

    const hasPermission = (permission: string): boolean => {
        return permissionService?.hasPermission(permission) || false
    }

    const hasAnyPermission = (requiredPermissions: string[]): boolean => {
        return permissionService?.hasAnyPermission(requiredPermissions) || false
    }

    const hasAllPermissions = (requiredPermissions: string[]): boolean => {
        return permissionService?.hasAllPermissions(requiredPermissions) || false
    }

    const canAccessModule = (moduleId: string): boolean => {
        return permissionService?.canAccessModule(moduleId) || false
    }

    const canPerformAction = (moduleId: string, action: string, resource: string): boolean => {
        return permissionService?.canPerformAction(moduleId, action, resource) || false
    }

    return {
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccessModule,
        canPerformAction,
    }
}
