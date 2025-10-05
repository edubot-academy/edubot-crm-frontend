import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TBody, THead } from '@/components/ui/Table';
import StatusBadge from '@/components/StatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import { Search } from 'lucide-react';

export type Contact = {
    id: number;
    fullName: string;
    email?: string;
    phone?: string;
    source?: string;
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'ENROLLED' | 'LOST';
    createdAt: string;
};

type ListRes = { items: Contact[]; total: number; page: number; limit: number; totalPages: number };

const STATUSES = ['', 'NEW', 'CONTACTED', 'QUALIFIED', 'ENROLLED', 'LOST'] as const;

export default function ContactsPage() {
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [data, setData] = useState<ListRes | null>(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigate();

    const params = useMemo(() => new URLSearchParams({ search: q, status, page: String(page), limit: String(limit) }), [q, status, page, limit]);

    async function load() {
        setLoading(true);
        try {
            const { data } = await api.get<ListRes>(`/contacts?${params.toString()}`);
            setData(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [q, status, page, limit]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{t.contacts.title}</h1>
            </div>

            <Card>
                <CardBody>
                    <div className="grid md:grid-cols-4 gap-3">
                        <div className="relative">
                            <label className="block text-sm mb-1">{t.contacts.search}</label>
                            <Input value={q} onChange={(e) => { setPage(1); setQ(e.target.value); }} placeholder="Aты, email же телефон" />
                            <Search size={16} className="absolute right-3 bottom-3 opacity-60" />
                        </div>
                        <div>
                            <label className="block text-sm mb-1">{t.contacts.status}</label>
                            <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
                                {STATUSES.map((s) => <option key={s} value={s}>{s || 'Баары'}</option>)}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm mb-1">{t.contacts.perPage}</label>
                            <Select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
                                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </Select>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader>{t.contacts.title}</CardHeader>
                <CardBody>
                    <div className="overflow-auto max-h-[70vh]">
                        <Table>
                            <THead>
                                <tr>
                                    <th>ID</th>
                                    <th>Aты-жөнү</th>
                                    <th>{t.contacts.status}</th>
                                    <th>{t.contacts.source}</th>
                                    <th>{t.contacts.createdAt}</th>
                                    <th>{t.contacts.actions}</th>
                                </tr>
                            </THead>
                            <TBody>
                                {loading && Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        <td colSpan={6}><Skeleton className="h-8 w-full" /></td>
                                    </tr>
                                ))}
                                {!loading && data?.items?.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">{t.contacts.empty}</td>
                                    </tr>
                                )}
                                {data?.items?.map((c) => (
                                    <tr key={c.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => nav(`/contacts/${c.id}`)}>
                                        <td>{c.id}</td>
                                        <td className="font-medium">{c.fullName}</td>
                                        <td><StatusBadge status={c.status} /></td>
                                        <td>{c.source}</td>
                                        <td>{new Date(c.createdAt).toLocaleString()}</td>
                                        <td>
                                            <Link to={`/contacts/${c.id}`} className="btn btn-ghost text-emerald-700">{t.contacts.view}</Link>
                                        </td>
                                    </tr>
                                ))}
                            </TBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div>{t.contacts.page}: {data?.page ?? 1} / {data?.totalPages ?? 1}</div>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn">←</button>
                            <button disabled={(data?.totalPages ?? 1) <= page} onClick={() => setPage(p => p + 1)} className="btn">→</button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
