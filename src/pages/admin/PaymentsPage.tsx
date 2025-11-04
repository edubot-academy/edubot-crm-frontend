import React, { useEffect } from 'react';
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

  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [kind, setKind] = React.useState<PaymentKind | ''>('');

  // --- Global search with debounce ---
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // --- Date helpers (for full-day UTC range) ---
  function startOfDayUTC(s: string) {
    const d = new Date(s);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)).toISOString();
  }
  function endOfDayUTC(s: string) {
    const d = new Date(s);
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)).toISOString();
  }

  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('ky-KG', { timeZone: 'Asia/Bishkek' }) : '—';

  const queryParams = React.useMemo(
    () => ({
      page,
      limit,
      dateFrom: dateFrom ? startOfDayUTC(dateFrom) : undefined,
      dateTo: dateTo ? endOfDayUTC(dateTo) : undefined,
      kind: (kind || undefined) as PaymentKind | undefined,
      search: debouncedSearch || undefined,
    }),
    [page, limit, dateFrom, dateTo, kind, debouncedSearch],
  );

  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const res = await listPayments(queryParams /*, { signal: ac.signal }*/);
        if (!ac.signal.aborted) {
          setItems(res.items);
          setTotal(res.total);
        }
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [queryParams]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const grand = items.reduce((a, p) => a + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Төлөмдөр (Админ)</h1>
      </div>

      {/* --- Filters --- */}
      <Card>
        <CardBody>
          {/* Search row */}
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Издөө</label>
              <Input
                placeholder="аты, телефон, email, эскертме, сумма..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setKind('');
                  setSearch('');
                  setPage(1);
                }}
              >
                Тазалоо
              </Button>
            </div>
          </div>

          {/* Date and kind filters */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Башталышы</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setPage(1);
                  setDateFrom(e.target.value);
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Аягы</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setPage(1);
                  setDateTo(e.target.value);
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Түрү</label>
              <Select
                value={kind}
                onChange={(e) => {
                  setPage(1);
                  setKind(e.target.value as any);
                }}
              >
                <option value="">Бардыгы</option>
                <option value="DEPOSIT">ДЕПОЗИТ</option>
                <option value="ENROLLMENT">КАТТОО</option>
                <option value="OTHER">БАШКА</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* --- Results --- */}
      <Card>
        <CardHeader>
          Натыйжалар • Жалпы сумма:{' '}
          {grand.toLocaleString('ky-KG', { minimumFractionDigits: 2 })} KGS
        </CardHeader>
        <CardBody>
          <div className="overflow-auto">
            <Table>
              <THead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  {[
                    'Күнү',
                    'Контакт',
                    'Түрү',
                    'Сумма',
                    'Ыкмасы',
                    'Квитанция',
                    'Эскертме',
                    'Ким кошту',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </THead>
              <TBody>
                {loading &&
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={i} className="border-t">
                      <td colSpan={8}>
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))}
                {!loading && items.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      Төлөмдөр табылган жок.
                    </td>
                  </tr>
                )}
                {items.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 text-sm">
                        {fmt(p.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      <a
                        className="text-emerald-700 dark:text-emerald-400 hover:underline"
                        href={`/contacts/${p.contactId}`}
                      >
                        {p.contactName ? p.contactName : `#${p.contactId}`}
                      </a>
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {p.kind === 'DEPOSIT'
                        ? 'Депозит'
                        : p.kind === 'ENROLLMENT'
                        ? 'Каттоо'
                        : 'Башка'}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium">
                      {Number(p.amount).toLocaleString('ky-KG', {
                        minimumFractionDigits: 2,
                      })}{' '}
                      {p.currency}
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {p.method === 'CASH'
                        ? 'Накталай'
                        : p.method === 'CARD'
                        ? 'Карта'
                        : p.method === 'TRANSFER'
                        ? 'Котoруу'
                        : 'Э-капчык'}
                    </td>
                    <td className="px-3 py-2 text-sm">{p.reference || '—'}</td>
                    <td className="px-3 py-2 text-sm">{p.note || '—'}</td>
                    <td className="px-3 py-2 text-sm">
                      {p.createdByName
                        ? p.createdByName
                        : p.createdByUserId
                        ? `#${p.createdByUserId}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </TBody>
            </Table>
          </div>

          {/* Pager */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <div>
              Барак: {page} / {Math.max(1, Math.ceil(total / limit))} • Бардыгы:{' '}
              {total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ←
              </Button>
              <select
                className="input !h-8"
                value={limit}
                onChange={(e) => {
                  setPage(1);
                  setLimit(Number(e.target.value));
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <Button
                variant="ghost"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                →
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
