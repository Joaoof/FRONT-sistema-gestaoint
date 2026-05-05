import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    type ReactNode,
} from 'react';
import { useMutation, useQuery } from '@apollo/client';
import {
    DISMISS_NOTIFICATION,
    GET_NOTIFICATIONS,
    MARK_ALL_NOTIFICATIONS_READ,
    MARK_NOTIFICATION_READ,
} from '../graphql/queries/notifications';

type BackendType =
    | 'STOCK_LOW'
    | 'ORDER_PENDING'
    | 'INVOICE_DUE'
    | 'INVOICE_OVERDUE'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_FAILED'
    | 'DELIVERY_SCHEDULED'
    | 'DELIVERY_COMPLETED'
    | 'CUSTOM'
    | 'INFO';

type FrontendCategory = 'order' | 'delivery' | 'stock' | 'driver' | 'info';

export interface AppNotification {
    id: string;
    type: FrontendCategory;
    title: string;
    message?: string;
    href?: string;
    iconUrl?: string;
    createdAt: string;
    read: boolean;
}

interface BackendNotification {
    id: string;
    type: BackendType;
    title: string;
    message: string;
    href: string | null;
    readAt: string | null;
    createdAt: string;
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

function categorize(t: BackendType): FrontendCategory {
    switch (t) {
        case 'STOCK_LOW':
            return 'stock';
        case 'ORDER_PENDING':
            return 'order';
        case 'DELIVERY_SCHEDULED':
        case 'DELIVERY_COMPLETED':
            return 'delivery';
        default:
            return 'info';
    }
}

function adapt(n: BackendNotification): AppNotification {
    return {
        id: n.id,
        type: categorize(n.type),
        title: n.title,
        message: n.message,
        href: n.href ?? undefined,
        createdAt: n.createdAt,
        read: !!n.readAt,
    };
}

export function NotificationsCenterProvider({ children }: { children: ReactNode }) {
    const { data, refetch } = useQuery<{
        notifications: {
            items: BackendNotification[];
            unreadCount: number;
        };
    }>(GET_NOTIFICATIONS, {
        variables: { filter: { page: 1, pageSize: 50 } },
        fetchPolicy: 'cache-and-network',
        pollInterval: 30000,
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: false,
    });

    const [markRead] = useMutation(MARK_NOTIFICATION_READ);
    const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ);
    const [dismiss] = useMutation(DISMISS_NOTIFICATION);

    const items = useMemo(
        () => (data?.notifications.items ?? []).map(adapt),
        [data],
    );
    const unreadCount = data?.notifications.unreadCount ?? 0;

    // No-op no front (criação de notificação é responsabilidade do backend).
    const push = useCallback(() => {
        /* legacy hook — sem efeito no fluxo persistido */
    }, []);

    const handleMarkAllRead = useCallback(async () => {
        try {
            await markAllRead();
            await refetch();
        } catch {
            /* silencioso */
        }
    }, [markAllRead, refetch]);

    const handleMarkRead = useCallback(
        async (id: string) => {
            try {
                await markRead({ variables: { id } });
                await refetch();
            } catch {
                /* silencioso */
            }
        },
        [markRead, refetch],
    );

    const remove = useCallback(
        async (id: string) => {
            try {
                await dismiss({ variables: { id } });
                await refetch();
            } catch {
                /* silencioso */
            }
        },
        [dismiss, refetch],
    );

    const clear = useCallback(async () => {
        await Promise.all(items.map((n) => dismiss({ variables: { id: n.id } })));
        await refetch();
    }, [dismiss, items, refetch]);

    const value: NotificationsCenterState = {
        items,
        unreadCount,
        push,
        markAllRead: handleMarkAllRead,
        markRead: handleMarkRead,
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
