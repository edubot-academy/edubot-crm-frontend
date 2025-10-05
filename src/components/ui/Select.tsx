import { clsx } from 'clsx';
import type { SelectHTMLAttributes } from 'react';
export default function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
    return <select {...props} className={clsx('select', className)} />;
}