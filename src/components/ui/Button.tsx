import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

type Variant = 'default' | 'primary' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    children: React.ReactNode;
}

const variantMap: Record<Variant, string> = {
    default: 'btn btn-default',
    primary: 'btn btn-primary',
    ghost: 'btn btn-ghost',
    subtle: 'btn btn-subtle',
    danger: 'btn btn-danger',
};

const sizeMap: Record<Size, string> = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-5 text-lg',
};

export default function Button({
    variant = 'default',
    size = 'md',
    loading = false,
    className,
    children,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            className={clsx(
                variantMap[variant],
                sizeMap[size],
                'inline-flex items-center justify-center gap-1.5',
                className,
            )}
            disabled={loading || disabled}
            {...props}
        >
            {loading ? (
                <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Иштеп жатат...</span>
                </span>
            ) : (
                children
            )}
        </button>
    );
}
