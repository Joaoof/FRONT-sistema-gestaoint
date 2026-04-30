export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-white/10 ${className}`}>
            {children}
        </div>
    );
}

export function CardHeader({
    className = '',
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <div className={['px-6 py-4', className].join(' ')}>{children}</div>;
}

export function CardTitle({
    className = '',
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <h3 className={['text-lg font-semibold text-gray-900 dark:text-white', className].join(' ')}>
            {children}
        </h3>
    );
}

export function CardContent({
    className = '',
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <div className={['px-6 py-4', className].join(' ')}>{children}</div>;
}

export function CardFooter({
    className = '',
    children
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <div className={['px-6 py-4 border-t border-gray-200 dark:border-white/10', className].join(' ')}>{children}</div>;
}