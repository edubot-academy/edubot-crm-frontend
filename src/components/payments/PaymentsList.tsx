import React from 'react';
import { listPaymentsForContact, type Payment } from '@/lib/api/payments';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { Table, TBody, THead } from '@/components/ui/Table';

export default function PaymentsList({
  contactId,
  onAddDeposit,
  onAddEnrollment,
}: {
  contactId: number;
  onAddDeposit?: () => void;
  onAddEnrollment?: () => void;
}) {
  const [data, setData] = React.useState<{ items: Payment[]; total: number; page: number; limit: number; totalPages: number } | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPaymentsForContact(contactId, 50);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  React.useEffect(() => { void load(); }, [load]);

  const total = React.useMemo(() => {
    const sum = (data?.items ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
    return new Intl.NumberFormat('ky-KG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(sum);
  }, [data]);

  return (
    <div className="space-y-3">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Жалпы сумма: <span className="font-semibold">{total} {data?.items?.[0]?.currency ?? 'KGS'}</span> • Бардыгы: {data?.total ?? 0}
        </div>
        <div className="flex gap-2">
          {onAddDeposit && <Button variant="ghost" size="sm" onClick={onAddDeposit}>Депозит кошуу</Button>}
          {onAddEnrollment && <Button variant="primary" size="sm" onClick={onAddEnrollment}>Каттоо (төлөм)</Button>}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <Table>
          <THead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {['Күнү', 'Түрү', 'Сумма', 'Ыкмасы', 'Квитанция', 'Эскертме'].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">{h}</th>
              ))}
            </tr>
          </THead>
          <TBody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-t"><td colSpan={6}><Skeleton className="h-8 w-full" /></td></tr>
            ))}
            {!loading && (data?.items?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  Төлөмдөр табылган жок.
                </td>
              </tr>
            )}
            {(data?.items ?? []).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2 text-sm">{new Date(p.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-sm">
                  {p.kind === 'DEPOSIT' ? 'Депозит' : p.kind === 'ENROLLMENT' ? 'Каттоо' : 'Башка'}
                </td>
                <td className="px-3 py-2 text-sm font-medium">
                  {Number(p.amount).toLocaleString('ky-KG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {p.currency}
                </td>
                <td className="px-3 py-2 text-sm">
                  {p.method === 'CASH' ? 'Накталай' : p.method === 'CARD' ? 'Карта' :
                   p.method === 'TRANSFER' ? 'Котуруу' : 'Э-капчык'}
                </td>
                <td className="px-3 py-2 text-sm">{p.reference || '—'}</td>
                <td className="px-3 py-2 text-sm">{p.note || '—'}</td>
              </tr>
            ))}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
