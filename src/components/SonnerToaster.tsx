import { Toaster } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';

export const SonnerToaster = () => {
    const { theme } = useTheme();
    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            expand={true}
            duration={4000}
            theme={theme}
            toastOptions={{
                style: {
                    fontSize: '14px',
                    padding: '12px 16px',
                },
            }}
        />
    );
};