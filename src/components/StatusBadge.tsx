import Badge from '@/components/ui/Badge';
import { clsx } from 'clsx';

const map: Record<string, string> = {
    NEW: '!border-blue-300 !bg-blue-100 !text-blue-800 dark:border-blue-600 dark:bg-blue-950/60 dark:text-blue-300',
    CONTACTED: '!border-amber-300 !bg-amber-100 !text-amber-800 dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
    QUALIFIED: '!border-purple-300 !bg-purple-100 !text-purple-800 dark:border-purple-600 dark:bg-purple-950/60 dark:text-purple-300',
    ENROLLED: '!border-emerald-300 !bg-emerald-100 !text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
    LOST: '!border-gray-300 !bg-gray-100 !text-gray-700 dark:border-gray-600 dark:bg-gray-900/50 dark:text-gray-300',
};

export default function StatusBadge({ status }: { status: keyof typeof map }) {
    return (
        <Badge
            className={clsx(
                // keep consistent sizing; don't set base colors here
                'border px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide',
                map[status]
            )}
        >
            {status}
        </Badge>
    );
}
