import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { ModuleDto } from '../types/auth'; // Reutiliza o tipo Module

interface ModuleContextState {
    modules: ModuleDto[];
    permissions: { module_key: string; permissions: string[] }[];
    hasModuleAccess: (moduleKey: string) => boolean;
}

const initialState: ModuleContextState = {
    modules: [],
    permissions: [],
    hasModuleAccess: () => false,
};

const ModuleContext = createContext<ModuleContextState>(initialState);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoading: isAuthLoading } = useAuth();

    const modules = user?.plan?.modules || [];
    const permissions = user?.permissions || [];

    // Função de checagem centralizada
    const hasModuleAccess = (moduleKey: string): boolean => {
        const hasPermission = permissions.some(p => p.module_key === moduleKey);

        const isActive = modules.some(m => m.module_key === moduleKey && m.isActive);

        return hasPermission && isActive;
    };

    console.log('MINHAS PERMISSSÔES KAAKAKAKKA', hasModuleAccess);


    const contextValue: ModuleContextState = useMemo(() => ({
        modules,
        permissions,
        hasModuleAccess,
    }), [modules, permissions]);

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <ModuleContext.Provider value={contextValue}>
            {children}
        </ModuleContext.Provider>
    );
}

export const useModules = () => {
    const context = useContext(ModuleContext);
    if (!context) {
        throw new Error('useModules must be used within a ModuleProvider');
    }
    return context;
};
