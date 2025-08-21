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

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error);
        console.error('Error info:', errorInfo);
        // Optional: send to logging service
        // logErrorToService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-6 text-red-600 bg-red-50 border border-red-200 rounded">
                    <h2>Something went wrong.</h2>
                    <details className="text-sm">
                        <summary>Click for details</summary>
                        <pre>{this.state.error?.toString()}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}