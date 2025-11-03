import React from 'react';
import { listPayments, type Payment, type PaymentKind } from '@/lib/api/payments';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Table, TBody, THead } from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';

export default function PaymentsPage() {
  const [items, setItems] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [kind, setKind] = React.useState<PaymentKind | ''>('');
  const [contactId, setContactId] = React.useState<string>('');

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPayments({
        page, limit,
        dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
        kind: (kind || undefined) as any,
        contactId: contactId ? Number(contactId) : undefined,
      });
      setItems(res.items); setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [page, limit, dateFrom, dateTo, kind, contactId]);

  React.useEffect(() => { void load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const grand = items.reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Төлөмдөр (Админ)</h1>
      </div>

      <Card>
        <CardBody>
          <div className="grid md:grid-cols-5 gap-3">
            <div>
              <label className="block text-sm mb-1">Башталышы</label>
              <Input type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
            </div>
            <div>
              <label className="block text-sm mb-1">Аягы</label>
              <Input type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
            </div>
            <div>
              <label className="block text-sm mb-1">Түрү</label>
              <Select value={kind} onChange={(e) => { setPage(1); setKind(e.target.value as any); }}>
                <option value="">Бардыгы</option>
                <option value="DEPOSIT">ДЕПОЗИТ</option>
                <option value="ENROLLMENT">КАТТОО</option>
                <option value="OTHER">БАШКА</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Контакт ID</label>
              <Input placeholder="123" value={contactId} onChange={(e) => { setPage(1); setContactId(e.target.value); }} />
            </div>
            <div className="flex items-end">
              <Button variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); setKind(''); setContactId(''); setPage(1); }}>
                Тазалоо
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>Натыйжалар • Жалпы сумма: {grand.toLocaleString('ky-KG', { minimumFractionDigits: 2 })} KGS</CardHeader>
        <CardBody>
          <div className="overflow-auto">
            <Table>
              <THead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  {['Күнү', 'Контакт', 'Түрү', 'Сумма', 'Ыкмасы', 'Квитанция', 'Эскертме', 'Ким кошту'].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">{h}</th>
                  ))}
                </tr>
              </THead>
              <TBody>
                {loading && Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="border-t"><td colSpan={8}><Skeleton className="h-8 w-full" /></td></tr>
                ))}
                {!loading && items.length === 0 && (
                  <tr><td colSpan={8} className="p-6 text-center text-gray-500 dark:text-gray-400">Төлөмдөр табылган жок.</td></tr>
                )}
                {items.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 text-sm">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2 text-sm">
                      <a className="text-emerald-700 dark:text-emerald-400 hover:underline" href={`/contacts/${p.contactId}`}>#{p.contactId}</a>
                    </td>
                    <td className="px-3 py-2 text-sm">{p.kind === 'DEPOSIT' ? 'Депозит' : p.kind === 'ENROLLMENT' ? 'Каттоо' : 'Башка'}</td>
                    <td className="px-3 py-2 text-sm font-medium">
                      {Number(p.amount).toLocaleString('ky-KG', { minimumFractionDigits: 2 })} {p.currency}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {p.method === 'CASH' ? 'Накталай' : p.method === 'CARD' ? 'Карта' : p.method === 'TRANSFER' ? 'Котуруу' : 'Э-капчык'}
                    </td>
                    <td className="px-3 py-2 text-sm">{p.reference || '—'}</td>
                    <td className="px-3 py-2 text-sm">{p.note || '—'}</td>
                    <td className="px-3 py-2 text-sm">#{p.createdByUserId}</td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>

          {/* Simple pager */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <div>Барак: {page} / {Math.max(1, Math.ceil(total / limit))} • Бардыгы: {total}</div>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>←</Button>
              <select
                className="input !h-8"
                value={limit}
                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
              >
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>→</Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
