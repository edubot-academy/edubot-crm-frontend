import React, { forwardRef } from 'react';
import clsx from 'clsx';

// Common, subtle transitions for hover/lift
const transition = 'transition-shadow duration-200';

// Props for the outer Card
type CardProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Removes rounded corners (useful for stacked layouts, tab panes, timelines)
     */
    flat?: boolean;
    /**
     * Enables a soft hover shadow/lift
     */
    hover?: boolean;
    /**
     * Adds a small default shadow even without hover
     */
    shadow?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
    { className, flat, hover, shadow, ...props },
    ref
) {
    return (
        <div
            ref={ref}
            className={clsx(
                'border bg-white',
                flat ? 'rounded-none' : 'rounded-2xl',
                'border-gray-200',
                transition,
                // base shadows
                shadow && 'shadow-sm',
                // hover lift
                hover && 'hover:shadow-md',
                // dark mode
                'dark:bg-gray-900 dark:border-gray-800 dark:shadow-none',
                className
            )}
            {...props}
        />
    );
});

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
    /**
     * Optional title helper — you can also pass custom children instead
     * (UI text should be in Kyrgyz in your app).
     */
    title?: React.ReactNode;
    /**
     * Right side area for buttons/filters (e.g., <PrimaryButton>Жаңы</PrimaryButton>)
     */
    actions?: React.ReactNode;
};

export function CardHeader({
    title,
    actions,
    className,
    children,
    ...props
}: CardHeaderProps) {
    return (
        <div
            className={clsx(
                // responsive paddings + layout for actions
                'flex items-center justify-between flex-wrap gap-2',
                'px-3 sm:px-4 pt-3 pb-2',
                // top radius only (matches Card rounded-2xl)
                'rounded-t-2xl',
                // subtle divider + tint
                'border-b bg-gray-50/60',
                'dark:bg-gray-800/60 dark:border-gray-800',
                className
            )}
            {...props}
        >
            {children ? (
                children
            ) : (
                <>
                    <div className="font-medium">{title}</div>
                    {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
                </>
            )}
        </div>
    );
}

// Body accepts responsive padding sizes via a small preset
type BodySize = 'sm' | 'md' | 'lg';
const sizeToPadding: Record<BodySize, string> = {
    sm: 'p-3 sm:p-4',
    md: 'p-3 sm:p-4 md:p-6',
    lg: 'p-4 sm:p-6 md:p-8',
};

type CardBodyProps = React.HTMLAttributes<HTMLDivElement> & {
    size?: BodySize;
    /**
     * Disable all padding (for full-bleed tables/charts, then pad inner content yourself)
     */
    noPadding?: boolean;
};

export function CardBody({
    className,
    size = 'md',
    noPadding,
    ...props
}: CardBodyProps) {
    return (
        <div
            className={clsx(noPadding ? '' : sizeToPadding[size], className)}
            {...props}
        />
    );
}

export function CardFooter({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={clsx(
                'px-3 sm:px-4 py-3 border-t',
                'bg-gray-50/40',
                'dark:bg-gray-800/40 dark:border-gray-800',
                className
            )}
            {...props}
        />
    );
}

// Section = Card + optional header (title/actions) + body
type SectionProps = React.HTMLAttributes<HTMLDivElement> & {
    title?: React.ReactNode;
    actions?: React.ReactNode;
    flat?: boolean;
    hover?: boolean;
    shadow?: boolean;
    bodySize?: BodySize;
    bodyClassName?: string;
    noBodyPadding?: boolean;
};

export function Section({
    title,
    actions,
    className,
    flat,
    hover,
    shadow,
    bodySize = 'md',
    bodyClassName,
    noBodyPadding,
    children,
    ...props
}: SectionProps) {
    return (
        <Card className={className} flat={flat} hover={hover} shadow={shadow} {...props}>
            {(title || actions) && <CardHeader title={title} actions={actions} />}
            <CardBody size={bodySize} noPadding={noBodyPadding} className={bodyClassName}>
                {children}
            </CardBody>
        </Card>
    );
}
