import * as React from 'react';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
};

const variants = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border border-gray-300 dark:border-white/15 bg-transparent hover:bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200',
    secondary: 'bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-slate-100 hover:bg-gray-300',
    ghost: 'hover:bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200',
    link: 'underline-offset-4 hover:underline text-blue-600 dark:text-blue-400',
};

const sizes = {
    default: 'h-10 px-4 py-2 rounded-md',
    sm: 'h-9 px-3 rounded-md text-sm',
    lg: 'h-11 px-8 rounded-md text-lg',
    icon: 'h-10 w-10 p-0 rounded-md',
};

export function Button({
    className = '',
    variant = 'default',
    size = 'default',
    ...props
}: ButtonProps) {
    return (
        <button
            className={[
                'inline-flex items-center justify-center font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                variants[variant],
                sizes[size],
                className,
            ].join(' ')}
            {...props}
        />
    );
}