import Badge from '@/components/ui/Badge';

const map: Record<string, string> = {
    NEW: 'border-blue-300 bg-blue-50 text-blue-700',
    CONTACTED: 'border-amber-300 bg-amber-50 text-amber-700',
    QUALIFIED: 'border-purple-300 bg-purple-50 text-purple-700',
    ENROLLED: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    LOST: 'border-gray-300 bg-gray-50 text-gray-600',
};

export default function StatusBadge({ status }: { status: keyof typeof map }) {
    return <Badge className={map[status] || ''}>{status}</Badge>;
}