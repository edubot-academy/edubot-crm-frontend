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
import { currentUser } from '@/lib/auth';

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

/** Lightweight confirm dialog (inline, no external deps) */
function ConfirmDialog({
    open,
    title,
    message,
    confirmText = 'Ооба, тастыктайм',
    cancelText = 'Жокко чыгаруу',
    loading = false,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[9998]">
            {/* overlay */}
            <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
            {/* modal */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-xl z-[9999]">
                    <div className="p-5 border-b">
                        <h3 className="text-lg font-semibold">{title}</h3>
                    </div>
                    <div className="p-5 text-sm text-gray-700 whitespace-pre-line">{message}</div>
                    <div className="p-4 border-t flex justify-end gap-2">
                        <button className="btn" onClick={onCancel} disabled={loading}>
                            {cancelText}
                        </button>
                        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
                            {loading ? 'Аткарылууда…' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
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

    // Selection for bulk actions
    const [selected, setSelected] = useState<number[]>([]);
    const hasSelection = selected.length > 0;

    // Delete modal (single)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [target, setTarget] = useState<Contact | null>(null);

    // Bulk modals: 'delete' | 'purge' | null
    const [bulkMode, setBulkMode] = useState<'delete' | 'purge' | null>(null);

    // current user role (adjust to your auth util if you have parseJwt())
    const isSuperadmin = currentUser()?.role === 'superadmin';

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
            // Deselect items not on current page
            setSelected((sel) => sel.filter((id) => data.items.some((it) => it.id === id)));
        } catch (e: any) {
            const name = e?.name || e?.code;
            if (name !== 'CanceledError' && name !== 'AbortError') {
                setErr('Жүктөөдө ката кетти.');
                const raw = e?.response?.data?.message ?? e?.message ?? 'Белгисиз ката.';
                toast.push({ title: 'Ката', message: Array.isArray(raw) ? raw.join('\n') : String(raw), variant: 'error' });
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
            if (e.key === 'ArrowLeft' && canPrev) setPage((p) => p - 1);
            if (e.key === 'ArrowRight' && canNext) setPage((p) => p + 1);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canPrev, canNext]);

    // Single delete
    function askDelete(c: Contact) {
        setTarget(c);
        setConfirmOpen(true);
    }

    async function confirmDelete() {
        if (!target) return;
        setConfirmLoading(true);
        try {
            const wasLastOnPage = (data?.items?.length ?? 0) <= 1 && page > 1;
            await api.delete(`/contacts/${target.id}`);

            toast.push({ title: 'OK', message: 'Контакт өчүрүлдү.', variant: 'success' });

            setConfirmOpen(false);
            setTarget(null);
            setConfirmLoading(false);

            if (wasLastOnPage) setPage((p) => Math.max(1, p - 1));
            else await load();
        } catch (e: any) {
            const raw = e?.response?.data?.message ?? e?.message ?? 'Өчүрүүдө ката кетти.';
            toast.push({ title: 'Ката', message: Array.isArray(raw) ? raw.join('\n') : String(raw), variant: 'error' });
            setConfirmLoading(false);
        }
    }

    // Bulk actions
    const openBulkDelete = () => setBulkMode('delete');
    const openBulkPurge = () => setBulkMode('purge');

    async function confirmBulk() {
        if (!bulkMode || selected.length === 0) return;
        setConfirmLoading(true);
        try {
            if (bulkMode === 'purge') {
                await api.post('/contacts/purge', { ids: selected, confirm: true });
                toast.push({ title: 'OK', message: 'Контакттар түбөлүк өчүрүлдү.', variant: 'warning' });
            } else {
                await api.post('/contacts/bulk-delete', { ids: selected });
                toast.push({ title: 'OK', message: 'Контакттар өчүрүлдү.', variant: 'success' });
            }

            setConfirmLoading(false);
            setBulkMode(null);

            // If we removed all rows on the page and there were more pages, step back
            const removedAllOnPage = selected.length >= (data?.items?.length ?? 0) && page > 1;
            setSelected([]);
            if (removedAllOnPage) setPage((p) => Math.max(1, p - 1));
            else await load();
        } catch (e: any) {
            const raw = e?.response?.data?.message ?? e?.message ?? 'Ката кетти.';
            toast.push({ title: 'Ката', message: Array.isArray(raw) ? raw.join('\n') : String(raw), variant: 'error' });
            setConfirmLoading(false);
        }
    }

    const createLabel = (t as any)?.contacts?.create ?? 'Жаңы лид';

    const allOnPageSelected = useMemo(
        () => (data?.items?.length ?? 0) > 0 && selected.length === (data?.items?.length ?? 0),
        [data?.items, selected.length]
    );

    const toggleSelectAll = (checked: boolean) => {
        if (!data?.items?.length) return;
        if (checked) setSelected(data.items.map((x) => x.id));
        else setSelected([]);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{t.contacts.title}</h1>
                <div className="flex items-center gap-2">
                    {hasSelection && (
                        <>
                            <button className="btn btn-danger" onClick={openBulkDelete}>
                                Тандалгандарды өчүрүү ({selected.length})
                            </button>
                            {isSuperadmin && (
                                <button className="btn btn-warning" onClick={openBulkPurge}>
                                    Тандалгандарды түбөлүк өчүрүү
                                </button>
                            )}
                        </>
                    )}
                    <button onClick={() => setNewOpen(true)} className="btn btn-primary">
                        {createLabel}
                    </button>
                </div>
            </div>

            <Card>
                <CardBody>
                    <div className="grid md:grid-cols-4 gap-3">
                        {/* Search (debounced) */}
                        <div className="relative">
                            <label className="block text-sm mb-1">{t.contacts.search}</label>
                            <Input
                                value={typedQ}
                                onChange={(e) => {
                                    setPage(1);
                                    setTypedQ(e.target.value);
                                }}
                                placeholder="Аты, email же телефон"
                            />
                            {typedQ && (
                                <button
                                    type="button"
                                    className="absolute right-8 bottom-3 text-gray-500 hover:text-gray-800"
                                    aria-label="Тазалоо"
                                    onClick={() => {
                                        setTypedQ('');
                                        setPage(1);
                                    }}
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
                                onChange={(e) => {
                                    setPage(1);
                                    setStatus(e.target.value);
                                }}
                            >
                                {RAW_STATUSES.map((s) => (
                                    <option key={s || 'ALL'} value={s}>
                                        {STATUS_LABELS[s]}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        {/* Per page */}
                        <div>
                            <label className="block text-sm mb-1">{t.contacts.perPage}</label>
                            <Select
                                value={String(limit)}
                                onChange={(e) => {
                                    setPage(1);
                                    setLimit(Number(e.target.value));
                                }}
                            >
                                {[10, 20, 50].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
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
                                    {isSuperadmin && (
                                        <th scope="col">
                                            <input
                                                type="checkbox"
                                                checked={allOnPageSelected}
                                                onChange={(e) => toggleSelectAll(e.target.checked)}
                                            />
                                        </th>
                                    )}
                                    <th scope="col">ID</th>
                                    <th scope="col">Аты-жөнү</th>
                                    <th scope="col">{t.contacts.status}</th>
                                    <th scope="col">{t.contacts.source}</th>
                                    <th scope="col">{t.contacts.createdAt}</th>
                                    <th scope="col">{t.contacts.actions}</th>
                                </tr>
                            </THead>
                            <TBody>
                                {loading &&
                                    Array.from({ length: 6 }).map((_, i) => (
                                        <tr key={i} className="border-t">
                                            <td colSpan={7}>
                                                <Skeleton className="h-8 w-full" />
                                            </td>
                                        </tr>
                                    ))}

                                {!loading && (data?.items?.length ?? 0) === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">
                                            {t.contacts.empty}
                                        </td>
                                    </tr>
                                )}

                                {data?.items?.map((c) => (
                                    <tr
                                        key={c.id}
                                        className="border-t hover:bg-gray-50 cursor-pointer"
                                        onClick={(e) => {
                                            if (!(e.target as HTMLElement).closest('a,button,input')) nav(`/contacts/${c.id}`);
                                        }}
                                    >
                                        {isSuperadmin && (
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(c.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelected((s) => [...s, c.id]);
                                                        else setSelected((s) => s.filter((id) => id !== c.id));
                                                    }}
                                                />
                                            </td>
                                        )}
                                        <td scope="row" className="font-mono">
                                            {c.id}
                                        </td>
                                        <td className="font-medium">{c.fullName}</td>
                                        <td>
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td>{c.source || '—'}</td>
                                        <td>{new Date(c.createdAt).toLocaleString()}</td>
                                        {(isSuperadmin || currentUser()?.role === 'manager') && (
                                            <td className="flex items-center gap-2">
                                                <Link to={`/contacts/${c.id}`} className="btn btn-ghost text-emerald-700">
                                                    {t.contacts.view}
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        askDelete(c);
                                                    }}
                                                >
                                                    Өчүрүү
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </TBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div>
                            {t.contacts.page}: {data?.page ?? 1} / {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={!canPrev}
                                onClick={() => setPage((p) => p - 1)}
                                className="btn"
                                aria-label="Мурунку бет"
                                title="←"
                            >
                                ←
                            </button>
                            <button
                                disabled={!canNext}
                                onClick={() => setPage((p) => p + 1)}
                                className="btn"
                                aria-label="Кийинки бет"
                                title="→"
                            >
                                →
                            </button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <NewLeadModal
                open={newOpen}
                onClose={() => setNewOpen(false)}
                onCreated={async () => {
                    await load();
                    // setPage(1); // optionally jump to first page to see newest
                }}
            />

            {/* Single delete confirm */}
            <ConfirmDialog
                open={confirmOpen}
                title="Өчүрүүнү тастыктаңыз"
                message={
                    target
                        ? `Чын эле бул контактты өчүрөсүзбү?\n\nID: ${target.id}\nАты-жөнү: ${target.fullName}`
                        : 'Чын эле өчүргүңүз келеби?'
                }
                confirmText="Ооба, өчүр"
                cancelText="Жокко чыгаруу"
                loading={confirmLoading}
                onConfirm={confirmDelete}
                onCancel={() => (!confirmLoading ? (setConfirmOpen(false), setTarget(null)) : undefined)}
            />

            {/* Bulk delete / purge confirm */}
            <ConfirmDialog
                open={!!bulkMode}
                title={bulkMode === 'purge' ? 'Тастыктаңыз: түбөлүк өчүрүү' : 'Өчүрүүнү тастыктаңыз'}
                message={
                    bulkMode === 'purge'
                        ? `Бул контакттар түбөлүк өчүрүлөт (${selected.length} даана).\nБул аракет артка кайтарылбайт.`
                        : `Чын эле ${selected.length} контактты өчүрөсүзбү?`
                }
                confirmText={bulkMode === 'purge' ? 'Ооба, түбөлүк өчүр' : 'Ооба, өчүр'}
                cancelText="Жокко чыгаруу"
                loading={confirmLoading}
                onConfirm={confirmBulk}
                onCancel={() => {
                    if (!confirmLoading) setBulkMode(null);
                }}
            />
        </div>
    );
}
