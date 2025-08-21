// components/ui/label.tsx
import * as React from 'react';

export function Label({ className = '', children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
    return (
        <label
            className={[
                'text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                className,
            ].join(' ')}
            {...props}
        >
            {children}
        </label>
    );
}