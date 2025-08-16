import { ReactNode } from 'react';

interface FormInputProps {
    label: string;
    id: string;
    error?: string;
    icon?: ReactNode;
    children: ReactNode;
}

export function FormInput({ label, id, error, icon, children }: FormInputProps) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <span className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${error ? 'text-red-500' : 'text-gray-400'}`}>
                        {icon}
                    </span>
                )}
                {children}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}