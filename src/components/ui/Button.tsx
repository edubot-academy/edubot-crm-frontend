import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

export default function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={clsx('btn', className)} />;
}
export function PrimaryButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={clsx('btn btn-primary shadow-sm', className)} />;
}
export function GhostButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={clsx('btn btn-ghost', className)} />;
}
export function SubtleButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={clsx('btn border-gray-200 hover:bg-gray-50', className)} />;
}