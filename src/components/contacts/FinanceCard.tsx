import React from 'react';
import { listPaymentsForContact } from '@/lib/api/payments';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { currentUser } from '@/lib/auth';

export default function FinanceCard({
  contactId,
  onAddDeposit,
  onAddEnroll,
  adminLink,
}: {
  contactId: number;
  onAddDeposit: () => void;
  onAddEnroll: () => void;
  adminLink: string; // e.g. `/admin/payments?contactId=123`
}) {
  const [loading, setLoading] = React.useState(true);
  const [sum, setSum] = React.useState<number>(0);
  const [last, setLast] = React.useState<{ amount: string; currency: string; createdAt: string; kind: 'DEPOSIT'|'ENROLLMENT'|'OTHER' } | null>(null);
    const me = currentUser();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await listPaymentsForContact(contactId, 50);
        if (!mounted) return;
        const total = (res.items ?? []).reduce((acc, p) => acc + Number(p.amount || 0), 0);
        setSum(total);
        const latest = [...(res.items ?? [])].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
        setLast(latest ? { amount: latest.amount, currency: latest.currency, createdAt: latest.createdAt, kind: latest.kind } : null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [contactId]);

  return (
    <div className="border rounded-xl p-4 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Төлөмдөр (контактка тиешелүү)</h3>
        {(me?.role === 'admin' || me?.role === 'superadmin') && <a href={adminLink} className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline">Толук кароо админде →</a>}
      </div>

      {loading ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        <div className="text-sm space-y-1">
          <div>
            Жалпы төлөм:{' '}
            <span className="font-semibold">
              {sum.toLocaleString('ky-KG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {last?.currency ?? 'KGS'}
            </span>
          </div>
          <div>
            Акыркы төлөм:{' '}
            <span className="font-medium">
              {last
                ? `${Number(last.amount).toLocaleString('ky-KG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${last.currency} • ${last.kind === 'DEPOSIT' ? 'Депозит' : last.kind === 'ENROLLMENT' ? 'Каттоо' : 'Башка'} • ${new Date(last.createdAt).toLocaleString()}`
                : '—'}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button variant="ghost" size="sm" onClick={onAddDeposit}>Депозит кошуу</Button>
        <Button variant="primary" size="sm" onClick={onAddEnroll}>Каттоо (төлөм)</Button>
      </div>
    </div>
  );
}
