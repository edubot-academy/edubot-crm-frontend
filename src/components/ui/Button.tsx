import React from 'react';
import clsx from 'clsx';

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className, ...props }: BtnProps) {
    return <button className={clsx('btn btn-default', className)} {...props} />;
}

export function PrimaryButton({ className, ...props }: BtnProps) {
    return <button className={clsx('btn btn-primary', className)} {...props} />;
}

export function GhostButton({ className, ...props }: BtnProps) {
    return <button className={clsx('btn btn-ghost', className)} {...props} />;
}

export function SubtleButton({ className, ...props }: BtnProps) {
    return <button className={clsx('btn btn-subtle', className)} {...props} />;
}

export function DangerButton({ className, ...props }: BtnProps) {
    return <button className={clsx('btn btn-danger', className)} {...props} />;
}
