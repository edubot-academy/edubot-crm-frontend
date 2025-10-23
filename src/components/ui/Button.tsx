import React from 'react';
import clsx from 'clsx';

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className, ...props }: BtnProps) {
    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-xl h-10 px-3 text-sm',
                'bg-gray-200 text-gray-800 hover:bg-gray-300',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                // dark
                'dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:ring-emerald-400',
                'disabled:opacity-60',
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
                'inline-flex items-center justify-center gap-2 rounded-xl h-10 px-3 text-sm',
                'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                // dark: keep text WHITE on hover too
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
                'inline-flex items-center justify-center gap-2 rounded-xl h-10 px-3 text-sm',
                'bg-white border border-gray-200 text-gray-800 hover:bg-gray-50',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                // dark: darker bg on hover, force light text for contrast
                'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:focus:ring-emerald-400',
                'disabled:opacity-60',
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
                'inline-flex items-center justify-center gap-2 rounded-xl h-10 px-3 text-sm',
                'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-emerald-500',
                // dark: keep readable text on hover
                'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:focus:ring-emerald-400',
                'disabled:opacity-60',
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
                'inline-flex items-center justify-center gap-2 rounded-xl h-10 px-3 text-sm',
                'bg-red-600 text-white shadow-sm hover:bg-red-700',
                'focus:outline-none focus:ring-2 focus:ring-red-500',
                // dark: keep text WHITE on hover too
                'dark:bg-red-600 dark:hover:bg-red-500 dark:text-white dark:focus:ring-red-400',
                'disabled:opacity-70',
                className
            )}
            {...props}
        />
    );
}   