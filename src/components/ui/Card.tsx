import React from 'react';
import clsx from 'clsx';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={clsx(
                'rounded-2xl border bg-white border-gray-200',
                'dark:bg-gray-900 dark:border-gray-800',
                className
            )}
            {...props}
        />
    );
}
export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={clsx('px-4 pt-4 pb-2 border-b bg-gray-50/60 rounded-t-2xl',
            'dark:bg-gray-800/60 dark:border-gray-800', className)}>
            {children}
        </div>
    );
}


export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={clsx('p-4', className)} {...props} />;
}

export function Section({
    title,
    children,
    className,
}: React.PropsWithChildren<{ title?: string; className?: string }>) {
    return (
        <Card className={className}>
            {title && (
                <div className="px-4 pt-4 pb-2 border-b bg-gray-50/60 rounded-t-2xl
                        dark:bg-gray-800/60 dark:border-gray-800">
                    <div className="font-medium">{title}</div>
                </div>
            )}
            <CardBody>{children}</CardBody>
        </Card>
    );
}
