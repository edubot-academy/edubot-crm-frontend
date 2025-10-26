import React from 'react';
import clsx from 'clsx';

type Props = React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & {
    as?: 'input' | 'textarea';
    error?: boolean;
};

export default function Input({ as = 'input', className, error, ...rest }: Props) {
    const Comp: any = as === 'textarea' ? 'textarea' : 'input';
    const isTextarea = as === 'textarea';

    return (
        <Comp
            className={clsx(
                // base
                'w-full rounded-xl outline-none transition-colors duration-150',
                // responsive spacing + text size
                isTextarea
                    ? 'px-3 py-2 text-sm sm:px-3.5 sm:py-2.5 sm:text-sm md:px-4 md:py-3 md:text-base'
                    : 'h-10 sm:h-11 px-3 text-sm sm:px-3.5 sm:text-sm md:px-4 md:h-12 md:text-base',
                // colors
                'border border-gray-200 bg-white text-gray-900 placeholder-gray-400',
                'focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500',
                // dark mode
                'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-emerald-400',
                // error
                error &&
                'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-400',
                // disabled
                'disabled:opacity-60 disabled:cursor-not-allowed',
                className
            )}
            {...rest}
        />
    );
}
