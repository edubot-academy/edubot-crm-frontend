import React from 'react';
import { clsx } from 'clsx';

export default function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={clsx(
                `
        animate-pulse rounded-md
        bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
        dark:from-gray-800 dark:via-gray-700 dark:to-gray-800
      `,
                className
            )}
        />
    );
}
