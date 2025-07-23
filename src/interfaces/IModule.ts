import type React from "react"
import { Company } from "../types/auth"

export interface IModule {
    id: string
    name: string
    description: string
    requiredPermissions: string[]
}

export interface IModuleComponent {
    canAccess(permissions: string[]): boolean
    render(): React.ReactNode
}

export interface IModuleService {
    isAuthorized(action: string, resource: string): boolean
    getCompanyData(companyId: string): Promise<any>
}

export interface IPermissionChecker {
    hasPermission(permission: string): boolean
    hasAnyPermission(permissions: string[]): boolean
    hasAllPermissions(permissions: string[]): boolean
}

export interface ICompanyContext {
    company: Company | null
    permissions: string[]
    modules: IModule[]
    switchCompany(companyId: string): Promise<void>
}
