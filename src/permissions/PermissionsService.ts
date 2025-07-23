// Single Responsibility Principle
import type { Permission, ModuleAccess } from "../types/auth"
import type { IPermissionChecker } from "../interfaces/IModule"

export class PermissionService implements IPermissionChecker {
    private permissions: string[] = []
    private moduleAccess: ModuleAccess[] = []

    constructor(permissions: string[], moduleAccess: ModuleAccess[]) {
        this.permissions = permissions
        this.moduleAccess = moduleAccess
    }

    hasPermission(permission: string): boolean {
        return this.permissions.includes(permission)
    }

    hasAnyPermission(permissions: string[]): boolean {
        return permissions.some((permission) => this.hasPermission(permission))
    }

    hasAllPermissions(permissions: string[]): boolean {
        return permissions.every((permission) => this.hasPermission(permission))
    }

    canAccessModule(moduleId: string): boolean {
        const module = this.moduleAccess.find((m) => m.moduleId === moduleId)
        return module?.isActive || false
    }

    getModulePermissions(moduleId: string): Permission[] {
        const module = this.moduleAccess.find((m) => m.moduleId === moduleId)
        return module?.permissions || []
    }

    canPerformAction(moduleId: string, action: string, resource: string): boolean {
        if (!this.canAccessModule(moduleId)) return false

        const modulePermissions = this.getModulePermissions(moduleId)
        return modulePermissions.some((p) => p.action === action && p.resource === resource)
    }
}
