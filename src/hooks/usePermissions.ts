import { useAuth } from '../contexts/AuthContext';

export type ModuleKey =
    | 'dashboard'
    | 'estoque'
    | 'vendas'
    | 'fiscal'
    | 'financeiro'
    | 'ecommerce'
    | 'consultas'
    | 'movimentacoes'
    | 'configuracoes'
    | 'cadastros';

export function usePermissions() {
    const { user } = useAuth();

    // ✅ Garanta que permissions é um array
    const permissions = user?.permissions || [];

    const canAccessModule = (moduleKey: ModuleKey): boolean => {
        return permissions.some(p => p.module_key === moduleKey);
    };

    const hasAnyPermission = (requiredPermissions: string[]): boolean => {
        if (requiredPermissions.length === 0) return true;
        return permissions.some(p =>
            requiredPermissions.some(rp => p.permissions.includes(rp))
        );
    };

    return { canAccessModule, hasAnyPermission, permissions };
}