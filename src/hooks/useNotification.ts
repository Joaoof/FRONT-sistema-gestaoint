import { useContext } from 'react'
import { NotificationContext } from '../contexts/NotificationContext'

export function useNotification() {
    const context = useContext(NotificationContext)

    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }

    const { addNotification } = context
    const DEFAULT_DURATION = 5000 // 👈 5 segundos (ou 6000, 8000, etc)


    const notifySuccess = (message: string, duration = DEFAULT_DURATION) => {
        addNotification('success', message, duration)
    }

    const notifyError = (message: string, duration = DEFAULT_DURATION) => {
        addNotification('error', message, duration)
    }

    const notifyInfo = (message: string, duration = DEFAULT_DURATION) => {
        addNotification('info', message, duration)
    }

    const notifyWarning = (message: string, duration = DEFAULT_DURATION) => {
        addNotification('warning', message, duration)
    }

    return {
        ...context,
        notifySuccess,
        notifyError,
        notifyInfo,
        notifyWarning,
    }
}
