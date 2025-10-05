import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';
export default function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={clsx('input', className)} />;
}