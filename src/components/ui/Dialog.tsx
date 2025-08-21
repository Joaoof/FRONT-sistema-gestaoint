// components/ui/dialog.tsx
import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={() => onOpenChange(false)}
            ></div>
            <div
                className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-auto"
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export function DialogContent({ children }: { children: React.ReactNode }) {
    return <div>{children}</div>;
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="border-b border-gray-200 pb-4">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-lg font-semibold text-gray-900">
            {children}
        </h2>
    );
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
    return <div className="flex justify-end space-x-2 pt-6">{children}</div>;
}