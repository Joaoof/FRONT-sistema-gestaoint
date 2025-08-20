import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCompany } from "../contexts/CompanyContext";
import { ModuleKey, usePermissions } from "../hooks/usePermissions";
import type { ReactNode } from "react";
import { DashboardSkeleton } from "./DashboardSkeleton";

interface PrivateRouteProps {
    moduleId?: string;
    permissions?: string[];
    fallback?: ReactNode;
    children: ReactNode;
}


export const PrivateRoute = ({
    moduleId,
    permissions = [],
    fallback = <div>Acesso negado</div>,
    children,
}: PrivateRouteProps) => {
    const { user, isLoading } = useAuth();
    const { isLoading: isCompanyLoading } = useCompany();
    const { canAccessModule, hasAnyPermission } = usePermissions();
    const location = useLocation();

    console.log("Auth loading:", isLoading, "Company loading:", isCompanyLoading, "User:", user)

    if (isLoading || isCompanyLoading) {
        return <DashboardSkeleton />;
    }

    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // ✅ Bloqueia se não tiver acesso ao módulo
    if (moduleId && !canAccessModule(moduleId as ModuleKey)) {
        console.warn(`Bloqueado: módulo "${moduleId}" não acessível.`);
        return <>{fallback}</>;
    }

    // ✅ Bloqueia se não tiver alguma das permissões
    if (permissions.length > 0 && !hasAnyPermission(permissions)) {
        console.warn(`Bloqueado: permissões necessárias não atendidas: [${permissions.join(", ")}]`);
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

