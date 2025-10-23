import { clsx } from 'clsx';
import React from 'react';

type BadgeProps = {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
};

export default function Badge({
    children,
    className,
    variant = 'default',
}: BadgeProps) {
    const base = `
    inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
    border transition-colors
  `;

    const variants: Record<typeof variant, string> = {
        default: `
      bg-gray-100 border-gray-200 text-gray-800
      dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100
    `,
        success: `
      bg-emerald-50 border-emerald-200 text-emerald-700
      dark:bg-emerald-900/70 dark:border-emerald-800 dark:text-emerald-100
    `,
        error: `
      bg-red-50 border-red-200 text-red-700
      dark:bg-red-900/70 dark:border-red-800 dark:text-red-100
    `,
        warning: `
      bg-amber-50 border-amber-200 text-amber-700
      dark:bg-amber-900/70 dark:border-amber-800 dark:text-amber-100
    `,
        info: `
      bg-blue-50 border-blue-200 text-blue-700
      dark:bg-blue-900/70 dark:border-blue-800 dark:text-blue-100
    `,
    };

    return (
        <span className={clsx(base, variants[variant], className)}>
            {children}
        </span>
    );
}
