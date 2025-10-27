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
import Button from '@/components/ui/Button';
import { Search, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import NewLeadModal from '@/components/NewLeadModal';
import { useToast } from '@/components/ui/Toast';
import { currentUser } from '@/lib/auth';
import { is } from 'zod/v4/locales';

export type Contact = {
    id: number;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    source?: 'WEBSITE' | 'MANUAL' | 'SOCIAL' | 'ADS' | 'REFERRAL' | 'CALL' | 'IMPORT' | 'OTHER';
    sourceProvider?: string | null;
    status:
    | 'NEW'
    | 'CONTACTED'
    | 'RESPONDED'
    | 'QUALIFIED'
    | 'UNQUALIFIED'
    | 'FOLLOW_UP'
    | 'NO_RESPONSE'
    | 'PENDING_PAYMENT'
    | 'ENROLLED'
    | 'DEFERRED'
    | 'LOST'
    | 'DUPLICATE'
    | 'TEST'
    | 'ARCHIVED';
    createdAt: string;
    assignedToUserId?: number | null;
    assignedToName?: string | null;
    assignedToRole?: 'sales' | 'assistant' | 'manager' | 'superadmin' | null;
    createdByUserId?: number | null;
    createdByName?: string | null;
    contactAttempts?: number | null;
    lastAttemptAt?: string | null;
};

type ListRes = { items: Contact[]; total: number; page: number; limit: number; totalPages: number };
export type UserLite = { id: number; fullName: string; role: 'sales' | 'assistant' | 'manager' | 'admin' | 'superadmin' };

const RAW_STATUSES = [
    '',
    'NEW',
    'CONTACTED',
    'RESPONDED',
    'QUALIFIED',
    'UNQUALIFIED',
    'FOLLOW_UP',
    'NO_RESPONSE',
    'PENDING_PAYMENT',
    'ENROLLED',
    'DEFERRED',
    'LOST',
    'DUPLICATE',
    'TEST',
    'ARCHIVED',
] as const;

const STATUS_LABELS: Record<(typeof RAW_STATUSES)[number], string> = {
    '': 'Баары',
    NEW: 'ЖАҢЫ',
    CONTACTED: 'БАЙЛАНЫШТЫК',
    RESPONDED: 'ЖООП БЕРДИ',
    QUALIFIED: 'ТАТЫКТУУ',
    UNQUALIFIED: 'ТАТЫКСЫЗ',
    FOLLOW_UP: 'КАЙРА БАЙЛАНЫШ',
    NO_RESPONSE: 'ЖООП ЖОК',
    PENDING_PAYMENT: 'ТӨЛӨМ КҮТҮЛҮҮДӨ',
    ENROLLED: 'КАТТАЛДЫ',
    DEFERRED: 'КИЙИНГЕ ЖЫЛДЫРЫЛДЫ',
    LOST: 'ЖОГОЛДУ',
    DUPLICATE: 'ДУБЛИКАТ',
    TEST: 'ТЕСТ',
    ARCHIVED: 'АРХИВДЕЛДИ',
};

function buildQuery(q: string, status: string, page: number, limit: number, role?: UserLite['role']) {
    const p = new URLSearchParams();
    if (q.trim()) p.set('search', q.trim());
    if (status) p.set('status', status);
    if (page > 1) p.set('page', String(page));
    if (limit !== 20) p.set('limit', String(limit));
    if (role === 'sales') p.set('assignedToSelf', '1');
    return p;
}

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

/** Lightweight confirm dialog (pure JSX, no portals) */
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
            <div className="absolute inset-0 bg-black/40" onClick={loading ? undefined : onCancel} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl shadow-xl z-[9999] border bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    </div>
                    <div className="p-5 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line">{message}</div>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            disabled={loading}
                            size="sm"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={onConfirm}
                            disabled={loading}
                            size="sm"
                        >
                            {loading ? 'Аткарылууда…' : confirmText}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ContactsPage() {
    const init = useInitialFromUrl();
    const me = currentUser();
    const role = me?.role as UserLite['role'] | undefined;
    const myId = me?.id as number | undefined;

    const [typedQ, setTypedQ] = useState(init.q);
    const [q, setQ] = useState(init.q);
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

    // Assignables
    const [assignables, setAssignables] = useState<UserLite[]>([]);
    const [assignBusy, setAssignBusy] = useState<Record<number, boolean>>({});

    // Bulk selection (superadmin only)
    const [selected, setSelected] = useState<number[]>([]);
    const hasSelection = selected.length > 0;

    // Delete modals
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [target, setTarget] = useState<Contact | null>(null);
    const [bulkMode, setBulkMode] = useState<'delete' | 'purge' | null>(null);

    const isSuperadmin = role === 'superadmin';
    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    const isAssistant = role === 'assistant';
    const isSales = role === 'sales';

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => setQ(typedQ), 300);
        return () => clearTimeout(id);
    }, [typedQ]);

    // Sync URL
    const params = useMemo(() => buildQuery(q, status, page, limit, role), [q, status, page, limit, role]);
    useEffect(() => {
        const qs = params.toString();
        const url = qs ? `/contacts?${qs}` : '/contacts';
        window.history.replaceState(null, '', url);
    }, [params]);

    // Load contacts
    const load = useCallback(async () => {
        setLoading(true);
        setErr('');
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        try {
            const { data } = await api.get<ListRes>(`/contacts?${params.toString()}`, { signal: ac.signal as any });
            let items = data.items;
            if (isSales && myId) items = items.filter((it) => it.assignedToUserId === myId);
            setData({ ...data, items });
            setSelected((sel) => sel.filter((id) => items.some((it) => it.id === id)));
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
    }, [params, toast, isSales, myId]);

    useEffect(() => {
        void load();
        return () => abortRef.current?.abort();
    }, [load]);

    // Load assignables
    useEffect(() => {
        async function fetchAssignables() {
            if (!(isAssistant || isManager || isAdmin || isSuperadmin)) return;
            try {
                const try1 = await api.get<UserLite[]>('/users/assignables');
                setAssignables(try1.data);
            } catch {
                try {
                    const try2 = await api.get<UserLite[]>('/users', { params: { roles: 'sales,assistant,manager' } });
                    setAssignables(try2.data);
                } catch {
                    setAssignables([]);
                }
            }
        }
        void fetchAssignables();
    }, [isAssistant, isManager, isAdmin, isSuperadmin]);

    const totalPages = data?.totalPages ?? 1;
    const canPrev = page > 1;
    const canNext = page < totalPages;

    // Keyboard ←/→
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'ArrowLeft' && canPrev) setPage((p) => p - 1);
            if (e.key === 'ArrowRight' && canNext) setPage((p) => p + 1);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canPrev, canNext]);

    // Delete helpers
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

    const renderSource = (c: Contact) => {
        const src = c.source || '—';
        const prov = c.sourceProvider?.trim();
        return (
            <div className="text-sm">
                <div className="font-medium text-gray-900 dark:text-gray-100">{src}</div>
                {prov ? <div className="text-gray-600 dark:text-gray-400 text-xs">{prov}</div> : null}
            </div>
        );
    };

    const canShowBulkControls = isSuperadmin;
    const roleKg: Record<UserLite['role'], string> = {
        sales: 'Сатуу',
        assistant: 'Ассистент',
        manager: 'Менеджер',
        admin: 'Админ',
        superadmin: 'Супер админ',
    };

    const hasBulkCol = isSuperadmin;
    const colCount = 6 + (hasBulkCol ? 1 : 0);

    // --- UI ---
    return (
        <div className="space-y-4">
            {/* Mobile sticky header */}
            <div
                className="
          md:hidden sticky top-14 z-30
          -mx-4 px-4 py-2
          bg-white/85 dark:bg-gray-900/85 backdrop-blur
          supports-[backdrop-filter]:bg-white/60
          border-b border-gray-200 dark:border-gray-800
          flex items-center justify-between
        "
            >
                <h1 className="text-base font-semibold truncate">{t.contacts.title}</h1>
                <Button
                    variant="primary"
                    onClick={() => setNewOpen(true)}
                    aria-label="Жаңы лид"
                    title="Жаңы лид"
                    size="sm"
                >
                    {createLabel}
                </Button>
            </div>

            {/* Desktop header + actions */}
            <div className="hidden md:flex items-center justify-between">
                <h1 className="text-xl font-semibold">{t.contacts.title}</h1>
                <div className="flex items-center gap-2">
                    {selected.length > 0 && isSuperadmin && (
                        <>
                            <Button
                                variant="danger"
                                onClick={openBulkDelete}
                            >
                                Тандалгандарды өчүрүү ({selected.length})
                            </Button>
                            <Button
                                variant="danger"
                                onClick={openBulkPurge}
                            >
                                Тандалгандарды түбөлүк өчүрүү
                            </Button>
                        </>
                    )}
                    <Button
                        variant="primary"
                        onClick={() => setNewOpen(true)}
                    >
                        {createLabel}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardBody>
                    {/* Mobile – compact */}
                    <div className="md:hidden space-y-2">
                        <div className="relative">
                            <Input
                                value={typedQ}
                                onChange={(e) => { setPage(1); setTypedQ(e.target.value); }}
                                placeholder="Аты, email же телефон"
                                aria-label="Издөө"
                            />
                            {typedQ && (
                                <button
                                    type="button"
                                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
                                    aria-label="Тазалоо"
                                    onClick={() => { setTypedQ(''); setPage(1); }}
                                >
                                    ×
                                </button>
                            )}
                            <Search size={16} className="absolute right-3 bottom-3 opacity-60 text-gray-500 dark:text-gray-400" />
                        </div>

                        <div className="flex items-center justify-end">
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                                {t.contacts.page}: {data?.page ?? 1} / {data?.totalPages ?? 1} • {data?.total ?? 0}
                            </div>
                        </div>

                        <div id="mobile-filters" className='grid grid-cols-2 gap-2'>
                            <Select
                                value={status}
                                onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                                aria-label="Статус боюнча чыпкалоо"
                            >
                                {RAW_STATUSES.map((s) => (
                                    <option key={s || 'ALL'} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </Select>

                            <Select
                                value={String(limit)}
                                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                                aria-label="Беттеги сан"
                            >
                                {[10, 20, 50].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Desktop / Tablet – 4-col grid */}
                    <div className="hidden md:grid md:grid-cols-4 gap-3">
                        <div className="relative">
                            <label className="block text-sm mb-1">{t.contacts.search}</label>
                            <Input
                                value={typedQ}
                                onChange={(e) => { setPage(1); setTypedQ(e.target.value); }}
                                placeholder="Аты, email же телефон"
                                aria-label="Издөө"
                            />
                            {typedQ && (
                                <button
                                    type="button"
                                    className="absolute right-8 mt-0.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                    aria-label="Тазалоо"
                                    onClick={() => { setTypedQ(''); setPage(1); }}
                                >
                                    ×
                                </button>
                            )}
                            <Search size={16} className="absolute right-3 bottom-4 opacity-60 text-gray-500 dark:text-gray-400" />
                        </div>

                        <div>
                            <label className="block text-sm mb-1">{t.contacts.status}</label>
                            <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} aria-label="Статус боюнча чыпкалоо">
                                {RAW_STATUSES.map((s) => (
                                    <option key={s || 'ALL'} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">{t.contacts.perPage}</label>
                            <Select value={String(limit)} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }} aria-label="Беттеги сан">
                                {[10, 20, 50].map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                Натыйжа: {data?.total ?? 0} • {t.contacts.page}: {data?.page ?? 1} / {data?.totalPages ?? 1}
                                {err && <span className="ml-3 text-red-600 dark:text-red-400">{err}</span>}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Desktop table (lg+) */}
            <Card className="hidden lg:block">
                <CardHeader>{t.contacts.title}</CardHeader>
                <CardBody>
                    <div className="overflow-auto max-h-[70vh]">
                        <Table>
                            <THead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                    {isSuperadmin && (
                                        <th className="px-3 py-2 text-left text-sm font-semibold bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={allOnPageSelected}
                                                onChange={(e) => toggleSelectAll(e.target.checked)}
                                                aria-label="Баарын тандоо"
                                            />
                                        </th>
                                    )}
                                    {['ID', 'Аты-жөнү', t.contacts.status, t.contacts.source, t.contacts.createdAt, t.contacts.actions].map((h) => (
                                        <th key={String(h)} className="px-3 py-2 text-left text-sm font-semibold bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200">{h}</th>
                                    ))}
                                </tr>
                            </THead>
                            <TBody>
                                {loading && Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-t"><td colSpan={colCount}><Skeleton className="h-8 w-full" /></td></tr>
                                ))}
                                {!loading && (data?.items?.length ?? 0) === 0 && (
                                    <tr><td colSpan={colCount} className="p-8 text-center text-gray-500 dark:text-gray-400">{t.contacts.empty}</td></tr>
                                )}
                                {data?.items?.map((c) => {
                                    const busy = !!assignBusy[c.id];
                                    const isUnassigned = !c.assignedToUserId;
                                    return (
                                        <tr
                                            key={c.id}
                                            className="border-t hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors"
                                            onClick={(e) => { if (!(e.target as HTMLElement).closest('a,button,input,select')) nav(`/contacts/${c.id}`); }}
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
                                                        aria-label={`Тандоо #${c.id}`}
                                                    />
                                                </td>
                                            )}

                                            <td className="font-mono">{c.id}</td>
                                            <td className="font-medium">{c.fullName}</td>

                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <StatusBadge status={c.status} />
                                                    {typeof c.contactAttempts === 'number' && c.contactAttempts > 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full border bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                                            {c.contactAttempts}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>{renderSource(c)}</td>
                                            <td>{new Date(c.createdAt).toLocaleString()}</td>

                                            <td className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                {(isAssistant || isManager || isAdmin || isSuperadmin) && (
                                                    <div className="flex items-center gap-2">
                                                        <Select
                                                            value={c.assignedToUserId ? String(c.assignedToUserId) : ''}
                                                            onChange={(e) => onAssignChange(c.id, e.target.value)}
                                                            disabled={busy || assignables.length === 0}
                                                            title="Жооптуу адам"
                                                            aria-label="Жооптуу адам"
                                                        >
                                                            <option value="">{busy ? 'Жүктөлүүдө...' : '— (Дайындалган жок)'}</option>
                                                            {assignables.map((u) => (
                                                                <option key={u.id} value={u.id}>{u.fullName}</option>
                                                            ))}
                                                        </Select>
                                                        {busy && <span className="text-xs opacity-70">…</span>}
                                                    </div>
                                                )}

                                                {isSales && isUnassigned && (
                                                    <Button
                                                        variant="primary"
                                                        disabled={busy}
                                                        onClick={() => onSelfAssign(c.id)}
                                                        size="sm"
                                                    >
                                                        {busy ? 'Жүктөлүүдө…' : 'Өзүмө алуу'}
                                                    </Button>
                                                )}

                                                {(isAdmin || isSuperadmin) && (
                                                    <Button
                                                        variant="danger"
                                                        onClick={() => askDelete(c)}
                                                        aria-label="Өчүрүү"
                                                        title="Өчүрүү"
                                                        size="sm"
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </TBody>
                        </Table>
                    </div>

                    {/* Desktop pagination */}
                    <div className="hidden md:flex items-center justify-between mt-3">
                        <div>{t.contacts.page}: {data?.page ?? 1} / {totalPages}</div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                disabled={!canPrev}
                                onClick={() => setPage((p) => p - 1)}
                                aria-label="Мурунку бет"
                                title="←"
                                size="sm"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                disabled={!canNext}
                                onClick={() => setPage((p) => p + 1)}
                                aria-label="Кийинки бет"
                                title="→"
                                size="sm"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Tablet & Mobile card grid (lg:hidden) */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-2">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}><CardBody><Skeleton className="h-16 w-full" /></CardBody></Card>
                ))}

                {!loading && (data?.items?.length ?? 0) === 0 && (
                    <Card>
                        <CardBody>
                            <div className="p-6 text-center text-gray-500 dark:text-gray-400">{t.contacts.empty}</div>
                        </CardBody>
                    </Card>
                )}

                {data?.items?.map((c) => {
                    const busy = !!assignBusy[c.id];
                    const isUnassigned = !c.assignedToUserId;
                    const checked = selected.includes(c.id);
                    const prov = c.sourceProvider?.trim();

                    return (
                        <Card
                            key={c.id}
                            className="overflow-hidden cursor-pointer"
                            onClick={() => nav(`/contacts/${c.id}`)}
                        >
                            {/* Compact header */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                                <div className="min-w-0">
                                    <div className="font-semibold truncate">{c.fullName}</div>
                                    <div className="text-xs text-gray-500 truncate">#{c.id} • {new Date(c.createdAt).toLocaleDateString()}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {typeof c.contactAttempts === 'number' && c.contactAttempts > 0 && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] rounded-full border bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                                            {c.contactAttempts}
                                        </span>
                                    )}

                                    {isSuperadmin && (
                                        <>
                                            <label
                                                className="hidden md:flex items-center gap-1 text-[11px]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelected((s) => [...s, c.id]);
                                                        else setSelected((s) => s.filter((id) => id !== c.id));
                                                    }}
                                                    aria-label={`Тандоо #${c.id}`}
                                                />
                                                Тандоо
                                            </label>

                                            <Button
                                                variant="danger"
                                                aria-label="Өчүрүү"
                                                title="Өчүрүү"
                                                onClick={(e) => { e.stopPropagation(); askDelete(c); }}
                                                size="sm"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <CardBody className="p-3">
                                {/* Status + condensed source */}
                                <div className="flex items-center justify-between gap-2">
                                    <StatusBadge status={c.status} />
                                    <div className="text-[12px] text-gray-500 dark:text-gray-400 truncate">
                                        {(c.source || '—')}{prov ? ` • ${prov}` : ''}
                                    </div>
                                </div>

                                {/* Compact actions */}
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                    {(isAssistant || isManager || isAdmin || isSuperadmin) && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Select
                                                value={c.assignedToUserId ? String(c.assignedToUserId) : ''}
                                                onChange={(e) => onAssignChange(c.id, e.target.value)}
                                                disabled={busy}
                                                aria-label="Жооптуу адам"
                                            >
                                                <option value="">{busy ? 'Жүктөлүүдө...' : '— Дайындалган жок'}</option>
                                                {assignables.map((u) => (
                                                    <option key={u.id} value={u.id}>{u.fullName}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    )}

                                    {isSales && isUnassigned && (
                                        <Button
                                            variant="primary"
                                            disabled={busy}
                                            onClick={(e) => { e.stopPropagation(); onSelfAssign(c.id); }}
                                            size="sm"
                                        >
                                            {busy ? 'Жүктөлүүдө…' : 'Өзүмө алуу'}
                                        </Button>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </div>

            {/* Tablet/Mobile pagination */}
            <div className="lg:hidden flex items-center justify-between py-2">
                <Button
                    variant="ghost"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => p - 1)}
                    aria-label="Мурунку бет"
                    size="sm"
                >
                    <ChevronLeft size={16} />
                </Button>
                <div className="text-sm">{t.contacts.page}: {data?.page ?? 1} / {totalPages}</div>
                <Button
                    variant="ghost"
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label="Кийинки бет"
                    size="sm"
                >
                    <ChevronRight size={16} />
                </Button>
            </div>

            {/* Sticky bulk bar (mobile superadmin) */}
            {isSuperadmin && hasSelection && (
                <div
                    className="md:hidden fixed left-0 right-0 bottom-0 z-40 border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur px-3 py-3 flex items-center justify-between"
                    style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
                >
                    <div className="text-sm">{selected.length} тандалды</div>
                    <div className="flex gap-2">
                        <Button
                            variant="danger"
                            onClick={openBulkDelete}
                            size="sm"
                        >
                            Өчүрүү
                        </Button>
                        <Button
                            variant="danger"
                            onClick={openBulkPurge}
                            size="sm"
                        >
                            Түбөлүк өчүрүү
                        </Button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <NewLeadModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={async () => { await load(); }} />

            {/* Single delete */}
            <ConfirmDialog
                open={confirmOpen}
                title="Өчүрүүнү тастыктаңыз"
                message={target ? `Чын эле бул контактты өчүрөсүзбү?\n\nID: ${target.id}\nАты-жөнү: ${target.fullName}` : 'Чын эле өчүргүңүз келеби?'}
                confirmText="Ооба, өчүр"
                cancelText="Жокко чыгаруу"
                loading={confirmLoading}
                onConfirm={confirmDelete}
                onCancel={() => (!confirmLoading ? (setConfirmOpen(false), setTarget(null)) : undefined)}
            />

            {/* Bulk delete/purge */}
            <ConfirmDialog
                open={!!bulkMode}
                title={bulkMode === 'purge' ? 'Тастыктаңыз: түбөлүк өчүрүү' : 'Өчүрүүнү тастыктаңыз'}
                message={bulkMode === 'purge' ? `Бул контакттар түбөлүк өчүрүлөт (${selected.length} даана).\nБул аракет артка кайтарылбайт.` : `Чын эле ${selected.length} контактты өчүрөсүзбү?`}
                confirmText={bulkMode === 'purge' ? 'Ооба, түбөлүк өчүр' : 'Ооба, өчүр'}
                cancelText="Жокко чыгаруу"
                loading={confirmLoading}
                onConfirm={confirmBulk}
                onCancel={() => { if (!confirmLoading) setBulkMode(null); }}
            />
        </div>
    );

    // --- helpers ---
    async function onAssignChange(contactId: number, assigneeStr: string) {
        const assigneeUserId = assigneeStr === '' ? null : Number(assigneeStr);
        setAssignBusy((m) => ({ ...m, [contactId]: true }));
        try {
            await api.post('/contacts/assign', { contactId, assigneeUserId });
            toast.push({ title: 'OK', message: assigneeUserId ? 'Жооптуу адам дайындалды.' : 'Жооптуу адам алынды.', variant: 'success' });
            await load();
        } catch (e: any) {
            const raw = e?.response?.data?.message ?? e?.message ?? 'Дайындоодо ката кетти.';
            toast.push({ title: 'Ката', message: Array.isArray(raw) ? raw.join('\n') : String(raw), variant: 'error' });
        } finally {
            setAssignBusy((m) => ({ ...m, [contactId]: false }));
        }
    }

    async function onSelfAssign(contactId: number) {
        setAssignBusy((m) => ({ ...m, [contactId]: true }));
        try {
            await api.patch(`/contacts/${contactId}/self-assign`);
            toast.push({ title: 'OK', message: 'Лид өзүңүзгө дайындалды.', variant: 'success' });
            await load();
        } catch (e: any) {
            const raw = e?.response?.data?.message ?? e?.message ?? 'Ката кетти.';
            toast.push({ title: 'Ката', message: Array.isArray(raw) ? raw.join('\n') : String(raw), variant: 'error' });
        } finally {
            setAssignBusy((m) => ({ ...m, [contactId]: false }));
        }
    }
}
