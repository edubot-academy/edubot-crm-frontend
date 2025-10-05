import { clsx } from 'clsx';
export default function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return <span className={clsx('badge', className)}>{children}</span>;
}
