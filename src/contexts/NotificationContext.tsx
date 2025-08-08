import React, { createContext, useState, useCallback } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (type: NotificationType, message: string, duration?: number) => void;
    removeNotification: (id: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((type: NotificationType, message: string, duration = 3000) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeNotification(id), duration);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
            <NotificationList notifications={notifications} onRemove={removeNotification} />
        </NotificationContext.Provider>
    );
}

function NotificationList({
    notifications,
    onRemove
}: {
    notifications: Notification[];
    onRemove: (id: string) => void
}) {
    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
            {notifications.map(n => (
                <div
                    key={n.id}
                    className={`p-4 rounded-lg shadow-lg text-sm text-white flex items-center justify-between gap-2 animate-slide-in relative
            ${n.type === 'success'
                            ? 'bg-green-600'
                            : n.type === 'error'
                                ? 'bg-red-600'
                                : n.type === 'warning'
                                    ? 'bg-yellow-500'
                                    : 'bg-blue-600'
                        }`}
                    style={{ animation: 'slide-in 0.3s ease-out' }}
                >
                    <div className="flex items-center gap-2 flex-1">
                        {n.type === 'success' && <span>✅</span>}
                        {n.type === 'error' && <span>❌</span>}
                        {n.type === 'warning' && <span>⚠️</span>}
                        {n.type === 'info' && <span>ℹ️</span>}
                        <span className="font-medium">{n.message}</span>
                    </div>

                    {/* Botão X para fechar */}
                    <button
                        type="button"
                        onClick={() => onRemove(n.id)}
                        className="ml-2 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black hover:bg-opacity-20 transition-all"
                        aria-label="Fechar notificação"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

// Estilo global
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);