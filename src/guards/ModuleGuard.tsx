import type React from "react"
import { useCompany } from "../contexts/CompanyContext"

interface ModuleGuardProps {
    moduleId: string
    fallback?: React.ReactNode
    children: React.ReactNode
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({
    moduleId,
    fallback = <div>Module not available</div>,
    children,
}) => {
    const { permissionService } = useCompany()

    if (!permissionService?.canAccessModule(moduleId)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}
