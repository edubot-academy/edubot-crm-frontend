import React from 'react';
import clsx from 'clsx';

type Props = React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & {
    as?: 'input' | 'textarea';
};

export default function Input({ as = 'input', className, ...rest }: Props) {
    const Comp: any = as === 'textarea' ? 'textarea' : 'input';
    return (
        <Comp
            className={clsx(
                // base
                'w-full rounded-xl px-3 py-2 text-sm outline-none',
                'border border-gray-200 bg-white text-gray-900 placeholder-gray-400',
                'focus:ring-2 focus:ring-emerald-500',
                // dark
                'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:ring-emerald-400',
                className
            )}
            {...rest}
        />
    );
}
