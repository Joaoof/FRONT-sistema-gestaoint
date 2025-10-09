// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo } from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// ErrorBoundary.tsx - MELHORADO
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🚨 Erro capturado pelo ErrorBoundary:', error);
        console.error('📋 Informações do erro:', errorInfo);

        // Enviar erro para serviço de monitoramento
        if (import.meta.env.PROD) {
            // logErrorToService(error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center p-8">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">
                            Ops! Algo deu errado
                        </h1>
                        <p className="text-gray-600 mb-4">
                            Ocorreu um erro inesperado na aplicação.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Recarregar Página
                        </button>
                        <details className="mt-4 text-left">
                            <summary className="cursor-pointer text-sm text-gray-500">
                                Detalhes técnicos
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                {this.state.error?.toString()}
                            </pre>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
