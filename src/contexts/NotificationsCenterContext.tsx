import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';

export interface AppNotification {
    id: string;
    type: 'order' | 'delivery' | 'stock' | 'driver' | 'info';
    title: string;
    message?: string;
    href?: string;
    iconUrl?: string;
    createdAt: string;
    read: boolean;
}

interface NotificationsCenterState {
    items: AppNotification[];
    unreadCount: number;
    push: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
    markAllRead: () => void;
    markRead: (id: string) => void;
    remove: (id: string) => void;
    clear: () => void;
}

const Ctx = createContext<NotificationsCenterState | null>(null);

const STORAGE_KEY = 'app:notifications';
const MAX_ITEMS = 50;

function load(): AppNotification[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as AppNotification[];
        return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
    } catch {
        return [];
    }
}

function save(items: AppNotification[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
    } catch {
        // localStorage cheio ou negado — silencioso
    }
}

export function NotificationsCenterProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<AppNotification[]>(() => load());

    useEffect(() => {
        save(items);
    }, [items]);

    const push = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
        setItems((prev) => [
            {
                ...n,
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: new Date().toISOString(),
                read: false,
            },
            ...prev,
        ].slice(0, MAX_ITEMS));
    }, []);

    const markAllRead = useCallback(() => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const markRead = useCallback((id: string) => {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }, []);

    const remove = useCallback((id: string) => {
        setItems((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clear = useCallback(() => {
        setItems([]);
    }, []);

    const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

    const value: NotificationsCenterState = {
        items,
        unreadCount,
        push,
        markAllRead,
        markRead,
        remove,
        clear,
    };

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotificationsCenter() {
    const ctx = useContext(Ctx);
    if (!ctx) {
        throw new Error('useNotificationsCenter must be used within NotificationsCenterProvider');
    }
    return ctx;
}
