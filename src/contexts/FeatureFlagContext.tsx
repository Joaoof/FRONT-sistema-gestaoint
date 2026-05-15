import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { MY_FEATURES_QUERY } from '../graphql/queries/feature-flags';

export type Feature = {
    module_key: string;
    name: string;
    enabled: boolean;
    source: string; // 'plan' | 'override' | 'plan+override'
    permission: string[];
    hasConfig: boolean;
};

type FeatureFlagContextValue = {
    features: Feature[];
    loading: boolean;
    isEnabled: (module_key: string) => boolean;
    /**
     * Lista no formato esperado pela Sidebar / hooks legados:
     *   `{ module_key, permissions: string[] }[]`
     * Inclui SOMENTE módulos habilitados.
     */
    permissionsCompat: { module_key: string; permissions: string[] }[];
    refetch: () => Promise<void>;
};

const FeatureFlagContext = createContext<FeatureFlagContextValue>({
    features: [],
    loading: false,
    isEnabled: () => false,
    permissionsCompat: [],
    refetch: async () => {},
});

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchFeatures = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setFeatures([]);
            return;
        }
        const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;
        const token = localStorage.getItem('accessToken');
        if (!endpoint || !token) return;

        setLoading(true);
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ query: MY_FEATURES_QUERY }),
            });
            const json = await res.json();
            if (json.errors) {
                console.warn('[FeatureFlags] erro GraphQL:', json.errors);
                setFeatures([]);
            } else {
                setFeatures(json.data?.myFeatures ?? []);
            }
        } catch (err) {
            console.warn('[FeatureFlags] falha de rede:', err);
            setFeatures([]);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        void fetchFeatures();
    }, [fetchFeatures]);

    const isEnabled = useCallback(
        (module_key: string) => features.some((f) => f.module_key === module_key && f.enabled),
        [features],
    );

    const permissionsCompat = features
        .filter((f) => f.enabled)
        .map((f) => ({ module_key: f.module_key, permissions: f.permission }));

    return (
        <FeatureFlagContext.Provider
            value={{ features, loading, isEnabled, permissionsCompat, refetch: fetchFeatures }}
        >
            {children}
        </FeatureFlagContext.Provider>
    );
}

export function useFeatures() {
    return useContext(FeatureFlagContext);
}

export function useFeature(module_key: string): boolean {
    return useContext(FeatureFlagContext).isEnabled(module_key);
}
