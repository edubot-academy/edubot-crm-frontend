// Select.tsx (native, small hardening)
import React from 'react';
import clsx from 'clsx';

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
    error?: boolean;
};

export default function Select({ className, error, ...rest }: Props) {
    return (
        <select
            className={clsx(
                'w-full rounded-xl outline-none transition-colors duration-150',
                'h-10 sm:h-11 md:h-12 px-3 text-sm sm:px-3.5 sm:text-sm md:px-4 md:text-base',
                'border border-gray-200 bg-white text-gray-900',
                'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
                'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-emerald-400',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                error && 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-400',
                // Prevent parent clipping in some cases (not a full fix)
                'relative z-10',
                className
            )}
            {...rest}
        />
    );
}
