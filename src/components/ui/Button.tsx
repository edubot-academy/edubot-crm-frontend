import React from 'react';
import clsx from 'clsx';

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

// Base button style shared by all variants
const base =
    'inline-flex items-center justify-center gap-2 rounded-xl ' +
    'h-9 px-2.5 text-xs ' + // mobile default
    'sm:h-10 sm:px-3 sm:text-sm ' + // tablet
    'md:h-11 md:px-4 md:text-base ' + // desktop
    'transition-colors duration-150 ' +
    'focus:outline-none focus:ring-2 disabled:opacity-60';

export default function Button({ className, ...props }: BtnProps) {
    return (
        <button
            className={clsx(
                base,
                'bg-gray-200 text-gray-800 hover:bg-gray-300',
                'focus:ring-emerald-500',
                'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:ring-emerald-400',
                className
            )}
            {...props}
        />
    );
}

export function PrimaryButton({ className, ...props }: BtnProps) {
    return (
        <button
            className={clsx(
                base,
                'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
                'focus:ring-emerald-500',
                'dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:focus:ring-emerald-400',
                'disabled:opacity-70',
                className
            )}
            {...props}
        />
    );
}

export function GhostButton({ className, ...props }: BtnProps) {
    return (
        <button
            className={clsx(
                base,
                'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50',
                'focus:ring-emerald-500',
                'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-emerald-400',
                className
            )}
            {...props}
        />
    );
}

export function SubtleButton({ className, ...props }: BtnProps) {
    return (
        <button
            className={clsx(
                base,
                'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100',
                'focus:ring-emerald-500',
                'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-emerald-400',
                className
            )}
            {...props}
        />
    );
}

export function DangerButton({ className, ...props }: BtnProps) {
    return (
        <button
            className={clsx(
                base,
                'bg-red-600 text-white shadow-sm hover:bg-red-700',
                'focus:ring-red-500',
                'dark:bg-red-600 dark:hover:bg-red-500 dark:text-white dark:focus:ring-red-400',
                'disabled:opacity-70',
                className
            )}
            {...props}
        />
    );
}
