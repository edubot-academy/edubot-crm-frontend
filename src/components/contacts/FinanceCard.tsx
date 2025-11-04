import React from 'react';
import { listPaymentsForContact, type Payment } from '@/lib/api/payments';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { currentUser } from '@/lib/auth';

export default function FinanceCard({
  contactId,
  contactStatus,
  onAddDeposit,
  onAddEnroll,
  adminLink,
}: {
  contactId: number;
  contactStatus?: string;
  onAddDeposit: () => void;
  onAddEnroll: () => void;
  adminLink: string; // e.g. `/admin/payments?contactId=123`
}) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<Payment[]>([]);
  const me = currentUser();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listPaymentsForContact(contactId, 50);
        if (!mounted) return;
        setItems(res.items ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setError('Төлөмдөрдү жүктөө мүмкүн болгон жок.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [contactId]);

  // Totals: if multiple currencies slip in, show "аралаш"
  const currencies = Array.from(new Set(items.map(i => i.currency).filter(Boolean)));
  const singleCurrency = currencies.length === 1 ? currencies[0]! : null;
  const sum = items.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const last = React.useMemo(() => {
    if (items.length === 0) return null as null | Payment;
    return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
  }, [items]);

  const canViewAdmin =
    me?.role === 'manager' || me?.role === 'superadmin' || me?.role === 'assistant';

  // Button enabling rules (adjust to your pipeline as needed)
  const canDeposit =
    contactStatus === 'RESPONDED' || contactStatus === 'PENDING_PAYMENT' || contactStatus === 'QUALIFIED';
  const canEnroll =
    contactStatus === 'PENDING_PAYMENT' || contactStatus === 'ENROLLED';

  return (
    <div className="border rounded-xl p-4 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Төлөмдөр (контактка тиешелүү)</h3>
        {canViewAdmin && (
          <a href={adminLink} className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
            Толук кароо админде →
          </a>
        )}
      </div>

      {loading ? (
        <Skeleton className="h-12 w-full" />
      ) : error ? (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : (
        <div className="text-sm space-y-1">
          <div>
            Жалпы төлөм:{' '}
            <span className="font-semibold">
              {sum.toLocaleString('ky-KG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              {singleCurrency ?? 'аралаш'}
            </span>
          </div>
          <div>
            Акыркы төлөм:{' '}
            <span className="font-medium">
              {last
                ? `${Number(last.amount).toLocaleString('ky-KG', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} ${last.currency} • ${
                    last.kind === 'DEPOSIT' ? 'Депозит' : last.kind === 'ENROLLMENT' ? 'Каттоо' : 'Башка'
                  } • ${new Date(last.createdAt).toLocaleString()}`
                : '—'}
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          variant="ghost"
          disabled={!canDeposit}
          size="sm"
          onClick={onAddDeposit}
          title={canDeposit ? 'Депозит кошуу' : 'Статуска жараша жеткиликсиз'}
        >
          Депозит кошуу
        </Button>
        <Button
          variant="primary"
          disabled={!canEnroll}
          size="sm"
          onClick={onAddEnroll}
          title={canEnroll ? 'Каттоо (төлөм)' : 'Статуска жараша жеткиликсиз'}
        >
          Каттоо (төлөм)
        </Button>
      </div>
    </div>
  );
}
