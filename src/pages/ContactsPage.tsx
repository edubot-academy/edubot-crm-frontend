import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TBody, THead } from '@/components/ui/Table';
import StatusBadge from '@/components/StatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import { Search } from 'lucide-react';
import NewLeadModal from '@/components/NewLeadModal';
import { useToast } from '@/components/ui/Toast';

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

const RAW_STATUSES = ['', 'NEW', 'CONTACTED', 'QUALIFIED', 'ENROLLED', 'LOST'] as const;
const STATUS_LABELS: Record<(typeof RAW_STATUSES)[number], string> = {
    '': 'Баары',
    NEW: 'ЖАҢЫ',
    CONTACTED: 'БАЙЛАНЫШКАН',
    QUALIFIED: 'КВАЛИФИКАЦИЯЛАНГАН',
    ENROLLED: 'КАТТАЛДЫ',
    LOST: 'ЖОГОЛДУ',
};

// Build querystring without empty/default params (cleaner URLs)
function buildQuery(q: string, status: string, page: number, limit: number) {
    const p = new URLSearchParams();
    if (q.trim()) p.set('search', q.trim());
    if (status) p.set('status', status);
    if (page > 1) p.set('page', String(page));
    if (limit !== 20) p.set('limit', String(limit));
    return p;
}

// Parse initial state from URL (so refresh/back keeps filters)
function useInitialFromUrl() {
    const { search } = useLocation();
    return useMemo(() => {
        const p = new URLSearchParams(search);
        const q = p.get('search') ?? '';
        const status = p.get('status') ?? '';
        const page = Math.max(1, parseInt(p.get('page') || '1', 10));
        const limit = (() => {
            const n = parseInt(p.get('limit') || '20', 10);
            return [10, 20, 50].includes(n) ? n : 20;
        })();
        return { q, status, page, limit };
    }, [search]);
}

export default function ContactsPage() {
    const init = useInitialFromUrl();
    const [q, setQ] = useState(init.q);
    const [typedQ, setTypedQ] = useState(init.q); // debounced input
    const [status, setStatus] = useState(init.status);
    const [page, setPage] = useState(init.page);
    const [limit, setLimit] = useState(init.limit);
    const [data, setData] = useState<ListRes | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string>('');
    const abortRef = useRef<AbortController | null>(null);
    const nav = useNavigate();
    const [newOpen, setNewOpen] = useState(false);
    const toast = useToast();

    // Debounce: update q from typedQ after 300ms
    useEffect(() => {
        const id = setTimeout(() => setQ(typedQ), 300);
        return () => clearTimeout(id);
    }, [typedQ]);

    // Build params & keep URL in sync (replace, not push)
    const params = useMemo(() => buildQuery(q, status, page, limit), [q, status, page, limit]);
    useEffect(() => {
        const qs = params.toString();
        const url = qs ? `/contacts?${qs}` : '/contacts';
        window.history.replaceState(null, '', url);
    }, [params]);

    // Load with abortable request
    const load = useCallback(async () => {
        setLoading(true);
        setErr('');
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        try {
            const { data } = await api.get<ListRes>(`/contacts?${params.toString()}`, { signal: ac.signal as any });
            setData(data);
        } catch (e: any) {
            const name = e?.name || e?.code;
            if (name !== 'CanceledError' && name !== 'AbortError') {
                setErr('Жүктөөдө ката кетти.');
                toast.push({ title: 'Ката', message: e.message, variant: 'error' });
            }
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load]);

    const totalPages = data?.totalPages ?? 1;
    const canPrev = page > 1;
    const canNext = page < totalPages;

    // Keyboard ←/→ for pagination
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'ArrowLeft' && canPrev) setPage(p => p - 1);
            if (e.key === 'ArrowRight' && canNext) setPage(p => p + 1);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canPrev, canNext]);

    const createLabel = (t as any)?.contacts?.create ?? 'Жаңы лид';

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{t.contacts.title}</h1>
                <button onClick={() => setNewOpen(true)} className="btn btn-primary">{createLabel}</button>
            </div>

            <Card>
                <CardBody>
                    <div className="grid md:grid-cols-4 gap-3">
                        {/* Search (debounced) */}
                        <div className="relative">
                            <label className="block text-sm mb-1">{t.contacts.search}</label>
                            <Input
                                value={typedQ}
                                onChange={(e) => { setPage(1); setTypedQ(e.target.value); }}
                                placeholder="Аты, email же телефон"
                            />
                            {typedQ && (
                                <button
                                    type="button"
                                    className="absolute right-8 bottom-3 text-gray-500 hover:text-gray-800"
                                    aria-label="Тазалоо"
                                    onClick={() => { setTypedQ(''); setPage(1); }}
                                >
                                    ×
                                </button>
                            )}
                            <Search size={16} className="absolute right-3 bottom-3 opacity-60" />
                        </div>

                        {/* Status filter (select) */}
                        <div>
                            <label className="block text-sm mb-1">{t.contacts.status}</label>
                            <Select
                                value={status}
                                onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                            >
                                {RAW_STATUSES.map((s) => (
                                    <option key={s || 'ALL'} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </Select>
                        </div>

                        {/* Per page */}
                        <div>
                            <label className="block text-sm mb-1">{t.contacts.perPage}</label>
                            <Select
                                value={String(limit)}
                                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                            >
                                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </Select>
                        </div>

                        {/* Result summary */}
                        <div className="flex items-end">
                            <div className="text-sm text-gray-600">
                                Натыйжа: {data?.total ?? 0} • {t.contacts.page}: {data?.page ?? 1} / {data?.totalPages ?? 1}
                                {err && <span className="ml-3 text-red-600">{err}</span>}
                            </div>
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
                                    <th scope="col">ID</th>
                                    <th scope="col">Аты-жөнү</th>
                                    <th scope="col">{t.contacts.status}</th>
                                    <th scope="col">{t.contacts.source}</th>
                                    <th scope="col">{t.contacts.createdAt}</th>
                                    <th scope="col">{t.contacts.actions}</th>
                                </tr>
                            </THead>
                            <TBody>
                                {loading && Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        <td colSpan={6}><Skeleton className="h-8 w-full" /></td>
                                    </tr>
                                ))}

                                {!loading && (data?.items?.length ?? 0) === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">{t.contacts.empty}</td>
                                    </tr>
                                )}

                                {data?.items?.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="border-t hover:bg-gray-50 cursor-pointer"
                                        onClick={(e) => {
                                            // Avoid row navigation when clicking inner buttons/links
                                            if (!(e.target as HTMLElement).closest('a,button')) nav(`/contacts/${c.id}`);
                                        }}
                                    >
                                        <td scope="row" className="font-mono">{c.id}</td>
                                        <td className="font-medium">{c.fullName}</td>
                                        <td><StatusBadge status={c.status} /></td>
                                        <td>{c.source || '—'}</td>
                                        <td>{new Date(c.createdAt).toLocaleString()}</td>
                                        <td>
                                            <Link to={`/contacts/${c.id}`} className="btn btn-ghost text-emerald-700">
                                                {t.contacts.view}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </TBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div>{t.contacts.page}: {data?.page ?? 1} / {totalPages}</div>
                        <div className="flex gap-2">
                            <button
                                disabled={!canPrev}
                                onClick={() => setPage(p => p - 1)}
                                className="btn"
                                aria-label="Мурунку бет"
                                title="←"
                            >←</button>
                            <button
                                disabled={!canNext}
                                onClick={() => setPage(p => p + 1)}
                                className="btn"
                                aria-label="Кийинки бет"
                                title="→"
                            >→</button>
                        </div>
                    </div>
                </CardBody>
            </Card>
            <NewLeadModal
                open={newOpen}
                onClose={() => setNewOpen(false)}
                onCreated={async () => {
                    // Reload the current page to include the newly created lead
                    await load();
                    // Optionally jump to page 1 to make it visible if backend sorts desc by createdAt
                    // setPage(1);
                }}
            />
        </div>
    );
}
