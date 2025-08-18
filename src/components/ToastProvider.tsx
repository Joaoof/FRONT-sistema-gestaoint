import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
                className: 'text-sm',
                duration: 4000,
                style: {
                    background: '#333',
                    color: '#fff',
                    padding: '12px 16px',
                    borderRadius: '8px',
                },
                success: {
                    icon: '✅',
                    duration: 3000,
                },
                error: {
                    icon: '❌',
                },
            }}
        />
    );
}