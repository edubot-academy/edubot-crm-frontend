import React from 'react';
import { reportByUser, reportByRole, reportTimeseries } from '@/lib/api/payments';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TBody, THead } from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';

export default function PaymentsReportsPage() {
  const [tab, setTab] = React.useState<'user'|'role'|'time'>('user');
  const [dateFrom, setDateFrom] = React.useState<string>('');
  const [dateTo, setDateTo] = React.useState<string>('');
  const [kind, setKind] = React.useState<string>('');

  const isoFrom = dateFrom ? new Date(dateFrom).toISOString() : undefined;
  const isoTo = dateTo ? new Date(dateTo).toISOString() : undefined;

  // Shared state for table
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      if (tab === 'user') {
        const res = await reportByUser({ dateFrom: isoFrom, dateTo: isoTo, kind: (kind || undefined) as any });
        setRows(res.items);
      } else if (tab === 'role') {
        const res = await reportByRole({ dateFrom: isoFrom, dateTo: isoTo, kind: (kind || undefined) as any });
        setRows(res.items);
      } else {
        const res = await reportTimeseries({ dateFrom: isoFrom, dateTo: isoTo, kind: (kind || undefined) as any });
        setRows(res.items);
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { void load(); /* eslint-disable-next-line */ }, [tab]);
  // Fetch when filters change
  React.useEffect(() => { const id = setTimeout(() => void load(), 200); return () => clearTimeout(id); }, [dateFrom, dateTo, kind]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Отчеттор (Төлөмдөр)</h1>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm mb-1">Башталышы</label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Аягы</label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Түрү</label>
              <Select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="">Бардыгы</option>
                <option value="DEPOSIT">ДЕПОЗИТ</option>
                <option value="ENROLLMENT">КАТТОО</option>
                <option value="OTHER">БАШКА</option>
              </Select>
            </div>
            <div className="flex-1" />
            <div className="inline-flex border rounded-xl overflow-hidden">
              <button className={`px-3 py-1.5 text-sm ${tab === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`} onClick={() => setTab('user')}>Колдонуучу</button>
              <button className={`px-3 py-1.5 text-sm ${tab === 'role' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`} onClick={() => setTab('role')}>Роль</button>
              <button className={`px-3 py-1.5 text-sm ${tab === 'time' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`} onClick={() => setTab('time')}>Күндөр</button>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>{tab === 'user' ? 'Колдонуучулар боюнча' : tab === 'role' ? 'Роль боюнча' : 'Күндөр боюнча'}</CardHeader>
        <CardBody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full mb-2" />)
          ) : tab === 'user' ? (
            <div className="overflow-auto">
              <Table>
                <THead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {['Колдонуучу', 'Роль', 'Төлөмдөрдүн саны', 'Каттоо саны', 'Жалпы сумма (KGS)'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">{h}</th>
                    ))}
                  </tr>
                </THead>
                <TBody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">Маалымат жок.</td></tr>
                  ) : rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 text-sm">{r.userName} (#{r.userId})</td>
                      <td className="px-3 py-2 text-sm">{r.role}</td>
                      <td className="px-3 py-2 text-sm">{r.paymentsCount}</td>
                      <td className="px-3 py-2 text-sm">{r.enrollCount}</td>
                      <td className="px-3 py-2 text-sm font-medium">{Number(r.totalAmount || 0).toLocaleString('ky-KG', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : tab === 'role' ? (
            <div className="overflow-auto">
              <Table>
                <THead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {['Роль', 'Төлөмдөрдүн саны', 'Каттоо саны', 'Жалпы сумма (KGS)'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">{h}</th>
                    ))}
                  </tr>
                </THead>
                <TBody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-500 dark:text-gray-400">Маалымат жок.</td></tr>
                  ) : rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 text-sm">{r.role}</td>
                      <td className="px-3 py-2 text-sm">{r.paymentsCount}</td>
                      <td className="px-3 py-2 text-sm">{r.enrollCount}</td>
                      <td className="px-3 py-2 text-sm font-medium">{Number(r.totalAmount || 0).toLocaleString('ky-KG', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <THead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    {['Күн', 'Төлөмдөрдүн саны', 'Каттоо саны', 'Жалпы сумма (KGS)'].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">{h}</th>
                    ))}
                  </tr>
                </THead>
                <TBody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={4} className="p-6 text-center text-gray-500 dark:text-gray-400">Маалымат жок.</td></tr>
                  ) : rows.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2 text-sm">{new Date(r.bucket).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-sm">{r.paymentsCount}</td>
                      <td className="px-3 py-2 text-sm">{r.enrollCount}</td>
                      <td className="px-3 py-2 text-sm font-medium">{Number(r.totalAmount || 0).toLocaleString('ky-KG', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
