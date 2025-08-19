import { Toaster } from 'sonner';

export const SonnerToaster = () => {
    return (
        <Toaster
            position="top-right"
            richColors
            closeButton
            expand={true}
            duration={4000}
            theme="light"
            toastOptions={{
                style: {
                    fontSize: '14px',
                    padding: '12px 16px',
                },
            }}
        />
    );
};