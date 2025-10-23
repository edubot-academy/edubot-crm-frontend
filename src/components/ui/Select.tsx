import React from 'react';
import clsx from 'clsx';

export default function Select({ className, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            className={clsx(
                'w-full rounded-xl px-3 py-2 text-sm outline-none',
                'border border-gray-200 bg-white text-gray-900',
                'focus:ring-2 focus:ring-emerald-500',
                'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-emerald-400',
                className
            )}
            {...rest}
        />
    );
}
