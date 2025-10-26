import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { api } from '@/lib/api';
import { currentUser } from '@/lib/auth';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TBody, THead } from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';
import { PrimaryButton, GhostButton, SubtleButton } from '@/components/ui/Button';
import NewUserModal, { UserRole } from '@/components/NewUserModal';
import EditUserModal from '@/components/EditUserModal';
import { useToast } from '@/components/ui/Toast';
import {
    ROLE_LABEL, ROLE_ORDER,
    canHardDelete, canResendInvite, canSoftDelete, canToggleFor, canUpdateUser
} from '@/lib/constants/roles';

// Icons
import {
    Search, Plus, Mail, RefreshCcw, Copy, Pencil,
    Power, PowerOff, Trash2, Filter as FilterIcon,
    ChevronLeft, ChevronRight
} from 'lucide-react';

type UserRow = {
    id: number;
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    invitedAt?: string | null;
    lastLoginAt?: string | null;
    inviteToken?: string | null;
    inviteExpiresAt?: string | null;
};

type ListRes = { items: UserRow[]; total: number; page: number; limit: number; totalPages: number };

// Heuristic: show “resend” if no login yet or invited
function canResend(u: UserRow) {
    return !u.lastLoginAt || !!u.invitedAt;
}

function buildInviteLink(token: string) {
    const base =
        (import.meta as any).env?.VITE_FRONTEND_URL ||
        (typeof window !== 'undefined' ? window.location.origin : 'https://crm.edubot.it.com');
    return `${base}/accept-invite?token=${token}`;
}

export default function AdminPage() {
    const me = currentUser();
    const nav = useNavigate();
    const toast = useToast();

    const canAdmin = me?.role === 'manager' || me?.role === 'admin' || me?.role === 'superadmin';
    useEffect(() => { if (!canAdmin) nav('/'); }, [canAdmin, nav]);

    // Filters
    const [typedQ, setTypedQ] = useState('');
    const [q, setQ] = useState('');
    const [role, setRole] = useState<UserRole | ''>('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    useEffect(() => {
        const id = setTimeout(() => setQ(typedQ), 300);
        return () => clearTimeout(id);
    }, [typedQ]);

    const params = useMemo(() => {
        const p = new URLSearchParams();
        if (q.trim()) p.set('search', q.trim());
        if (role) p.set('role', role);
        if (page > 1) p.set('page', String(page));
        if (limit !== 20) p.set('limit', String(limit));
        return p;
    }, [q, role, page, limit]);

    // Load
    const [data, setData] = useState<ListRes | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setErr('');
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        try {
            const { data } = await api.get<ListRes>(`/users?${params.toString()}`, { signal: ac.signal as any });
            setData(data);
        } catch (e: any) {
            const name = e?.name || e?.code;
            if (name !== 'CanceledError' && name !== 'AbortError') setErr('Жүктөөдө ката кетти.');
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => { void load(); return () => abortRef.current?.abort(); }, [load]);

    const totalPages = data?.totalPages ?? 1;
    const canPrev = (data?.page ?? 1) > 1;
    const canNext = (data?.page ?? 1) < totalPages;

    // Modals: create/edit
    const [newOpen, setNewOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<UserRow | null>(null);
    function openEdit(u: UserRow) { setEditTarget(u); setEditOpen(true); }

    // Confirm toggle active
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<UserRow | null>(null);
    const [confirmMakeActive, setConfirmMakeActive] = useState<boolean>(false);

    function openConfirm(u: UserRow, makeActive: boolean) {
        if (!canToggleFor(me?.role, u.role)) {
            toast.push({ title: 'Кирүүнү тыюу салынды', message: 'Менеджер сатуучуну гана активдештире/өчүрө алат.' });
            return;
        }
        setConfirmTarget(u);
        setConfirmMakeActive(makeActive);
        setConfirmOpen(true);
    }

    async function toggleActive(id: number, makeActive: boolean) {
        try {
            await api.patch(`/users/${id}`, { isActive: makeActive });
            toast.push({ title: 'OK', message: makeActive ? 'Активдештирилди.' : 'Деактивдештирилди.' });
            await load();
        } catch (e: any) {
            toast.push({ title: 'Ката', message: e?.response?.data?.message || 'Иш-аракет ишке ашкан жок.' });
        }
    }

    async function confirmProceed() {
        if (!confirmTarget) return;
        setConfirmLoading(true);
        await toggleActive(confirmTarget.id, confirmMakeActive);
        setConfirmLoading(false);
        setConfirmOpen(false);
        setConfirmTarget(null);
    }

    // Soft/Hard delete
    const [softTarget, setSoftTarget] = useState<UserRow | null>(null);
    const [hardTarget, setHardTarget] = useState<UserRow | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    function openSoftDelete(u: UserRow) { setSoftTarget(u); }
    function openHardDelete(u: UserRow) { setHardTarget(u); }

    async function performSoftDelete(id: number) {
        try {
            setDeleteLoading(true);
            await api.post('/users/soft-delete', { ids: [id], anonymize: true });
            toast.push({ title: 'OK', message: 'Колдонуучу өчүрүлдү.' });
            setSoftTarget(null);
            await load();
        } catch (e: any) {
            toast.push({ title: 'Ката', message: e?.response?.data?.message || 'Иш-аракет ишке ашкан жок.' });
        } finally {
            setDeleteLoading(false);
        }
    }

    async function performHardDelete(id: number) {
        try {
            setDeleteLoading(true);
            await api.post('/users/hard-delete', { ids: [id] });
            toast.push({ title: 'OK', message: 'Колдонуучу толугу менен өчүрүлдү.' });
            setHardTarget(null);
            await load();
        } catch (e: any) {
            toast.push({ title: 'Ката', message: e?.response?.data?.message || 'Иш-аракет ишке ашкан жок.' });
        } finally {
            setDeleteLoading(false);
        }
    }

    // Invites
    async function resendInviteByEmail(email: string) {
        try {
            const { data } = await api.post<{ ok: boolean; link?: string; inviteToken?: string; message?: string }>(
                `/auth/resend-invite`,
                { email }
            );
            toast.push({ title: 'OK', message: data?.message || 'Чакыруу кайра жөнөтүлдү.' });
            if (data?.link) {
                await navigator.clipboard?.writeText(data.link);
                toast.push({ title: 'OK', message: 'Шилтеме буферге көчүрүлдү.' });
            }
            await load();
        } catch (e: any) {
            const msg = e?.response?.data?.message || 'Чакыруу кайра жиберилген жок.';
            toast.push({ title: 'Ката', message: String(msg) });
        }
    }

    async function copyInviteLink(u: UserRow) {
        if (!u.inviteToken) {
            toast.push({ title: 'Ката', message: 'Шилтемени көчүрүү үчүн чакыруу шакеги жок.' });
            return;
        }
        const link = buildInviteLink(u.inviteToken);
        await navigator.clipboard.writeText(link);
        toast.push({ title: 'OK', message: 'Шилтеме буферге көчүрүлдү.' });
    }

    // --- UI ---
    return (
        <div className="space-y-4">
            {/* Mobile sticky header (like ContactsPage) */}
            <div
                className="
          md:hidden sticky top-14 z-30 -mx-4 px-4 py-2
          bg-white/85 dark:bg-gray-900/85 backdrop-blur border-b
          border-gray-200 dark:border-gray-800
          flex items-center justify-between
        "
            >
                <h1 className="text-base font-semibold truncate">
                    Админ панель
                    <span className="text-base block font-semibold truncate">Колдонуучулар</span>
                </h1>
                {me?.role !== 'sales' && me?.role !== 'assistant' && (<button
                    onClick={() => setNewOpen(true)}
                    className="btn btn-primary px-3 py-1 text-sm"
                    aria-label="Жаңы колдонуучу"
                    title="Жаңы колдонуучу"
                    disabled={!canAdmin}
                >
                    <Plus size={16} className="mr-1" />
                </button>)}
            </div>

            {/* Desktop header */}
            <div className="hidden md:flex items-center justify-between">
                <h1 className="text-xl font-semibold">Админ панель — колдонуучулар</h1>
                {me?.role !== 'sales' && me?.role !== 'assistant' && (<PrimaryButton onClick={() => setNewOpen(true)} disabled={!canAdmin}>
                    <Plus size={16} className="mr-1" />
                </PrimaryButton>)}
            </div>

            {/* Filters (compact mobile, full md+) */}
            <Card>
                <CardBody>
                    {/* Mobile compact */}
                    <div className="md:hidden space-y-2">
                        <div className="relative">
                            <Input
                                value={typedQ}
                                onChange={(e) => {
                                    setPage(1);
                                    setTypedQ(e.target.value);
                                }}
                                placeholder="Аты, email"
                                aria-label="Издөө"
                            />
                            {typedQ && (
                                <button
                                    type="button"
                                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
                                    aria-label="Тазалоо"
                                    onClick={() => {
                                        setTypedQ('');
                                        setPage(1);
                                    }}
                                >
                                    ×
                                </button>
                            )}
                            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
                        </div>

                        <div className="flex items-center justify-end">
                            <div className="text-xs text-gray-600">
                                Бет: {data?.page ?? 1} / {data?.totalPages ?? 1} • {data?.total ?? 0}
                            </div>
                        </div>

                        <div id="mobile-filters" className='grid grid-cols-2 gap-2'>
                            <Select
                                value={role}
                                onChange={(e) => { setPage(1); setRole(e.target.value as UserRole | ''); }}
                                aria-label="Роль"
                            >
                                <option value="">Баары</option>
                                {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_LABEL[r]} ({r})</option>)}
                            </Select>
                            <Select
                                value={String(limit)}
                                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                                aria-label="Барактагы саны"
                            >
                                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </Select>
                        </div>
                    </div>

                    {/* Desktop / Tablet 4-col grid */}
                    <div className="hidden md:grid md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-sm mb-1">Издөө</label>

                            <div className="relative">
                                <Input
                                    value={typedQ}
                                    onChange={(e) => { setPage(1); setTypedQ(e.target.value); }}
                                    placeholder="Аты, email"
                                    className="pr-12" // room for icons
                                />

                                {typedQ && (
                                    <div className="absolute inset-y-0 right-9 flex items-center">
                                        <button
                                            type="button"
                                            aria-label="Тазалоо"
                                            onClick={() => { setTypedQ(''); setPage(1); }}
                                            className="flex items-center justify-center
                                                text-gray-500 hover:text-gray-800 hover:bg-gray-100
                                                leading-none"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}

                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <Search size={16} className="opacity-60" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Роль</label>
                            <Select
                                value={role}
                                onChange={(e) => { setPage(1); setRole(e.target.value as UserRole | ''); }}
                            >
                                <option value="">Баары</option>
                                {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_LABEL[r]} ({r})</option>)}
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm mb-1">Барактагы саны</label>
                            <Select
                                value={String(limit)}
                                onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
                            >
                                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <div className="text-sm text-gray-600">
                                Натыйжа: {data?.total ?? 0} • Бет: {data?.page ?? 1} / {data?.totalPages ?? 1}
                                {err && <span className="ml-3 text-red-600">{err}</span>}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Desktop table (lg+) */}
            <Card className="hidden lg:block">
                <CardHeader>Колдонуучулар</CardHeader>
                <CardBody>
                    <div className="overflow-auto max-h-[70vh]">
                        <Table>
                            <THead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Аты-жөнү</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">Роль</th>
                                    <th scope="col">Активдүүлүк</th>
                                    <th scope="col">Акыркы кирүү</th>
                                    <th scope="col">Аракеттер</th>
                                </tr>
                            </THead>
                            <TBody>
                                {loading && Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-t">
                                        <td colSpan={7}><Skeleton className="h-8 w-full" /></td>
                                    </tr>
                                ))}

                                {!loading && (data?.items?.length ?? 0) === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-500">Колдонуучулар табылган жок</td>
                                    </tr>
                                )}

                                {data?.items?.map((u) => {
                                    const allowed = canToggleFor(me?.role, u.role);
                                    return (
                                        <tr key={u.id} className="border-t">
                                            <td className="font-mono">{u.id}</td>
                                            <td className="font-medium">{u.fullName}</td>
                                            <td>{u.email}</td>
                                            <td>{ROLE_LABEL[u.role]} <span className="text-gray-500">({u.role})</span></td>
                                            <td>
                                                {u.isActive ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full border bg-emerald-50 border-emerald-200 text-emerald-700">
                                                        Активдүү
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full border bg-gray-50 border-gray-200 text-gray-700">
                                                        Өчүрүлгөн
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-sm text-gray-600">
                                                {u.lastLoginAt
                                                    ? new Date(u.lastLoginAt).toLocaleString()
                                                    : (u.invitedAt ? `Чакыруу: ${new Date(u.invitedAt).toLocaleString()}` : '—')}
                                            </td>
                                            <td className="whitespace-nowrap">
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    {canResendInvite(me?.role) && canResend(u) && (
                                                        <GhostButton onClick={() => resendInviteByEmail(u.email)} aria-label="Чакыруу (кайра)" title="Чакыруу (кайра)">
                                                            <RefreshCcw size={14} className="hidden md:inline ml-1 opacity-70" />
                                                        </GhostButton>
                                                    )}

                                                    {u.inviteToken && (
                                                        <SubtleButton onClick={() => copyInviteLink(u)} aria-label="Шилтемени көчүрүү" title="Шилтемени көчүрүү">
                                                            <Copy size={16} />
                                                        </SubtleButton>
                                                    )}

                                                    {canUpdateUser(me?.role) && (
                                                        <GhostButton onClick={() => openEdit(u)} aria-label="Өзгөртүү" title="Өзгөртүү">
                                                            <Pencil size={16} />
                                                        </GhostButton>
                                                    )}

                                                    {u.id !== me?.id && u.isActive && (
                                                        <GhostButton onClick={() => openConfirm(u, false)} disabled={!allowed} aria-label="Өчүрүү" title={allowed ? 'Өчүрүү' : 'Уруксатыңыз жетишсиз'}>
                                                            <PowerOff size={16} />
                                                        </GhostButton>
                                                    )}
                                                    {u.id !== me?.id && !u.isActive && (
                                                        <GhostButton onClick={() => openConfirm(u, true)} disabled={!allowed} aria-label="Активдештирүү" title={allowed ? 'Активдештирүү' : 'Уруксатыңыз жетишсиз'}>
                                                            <Power size={16} />
                                                        </GhostButton>
                                                    )}

                                                    {canSoftDelete(me?.role, u.role) && u.id !== me?.id && (
                                                        <GhostButton
                                                            onClick={() => openSoftDelete(u)}
                                                            aria-label="өчүрүү"
                                                            title="өчүрүү"
                                                        >
                                                            <Trash2 size={16} />
                                                        </GhostButton>
                                                    )}


                                                    {canHardDelete(me?.role) && u.id !== me?.id && (
                                                        <GhostButton onClick={() => openHardDelete(u)} aria-label="Катуу өчүрүү" title="Катуу өчүрүү (кайтарылбайт)">
                                                            <Trash2 size={16} />
                                                        </GhostButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </TBody>
                        </Table>
                    </div>

                    {/* Desktop pagination */}
                    <div className="hidden md:flex items-center justify-between mt-3">
                        <div>Бет: {data?.page ?? 1} / {totalPages}</div>
                        <div className="flex gap-2">
                            <button disabled={!canPrev} onClick={() => setPage(p => p - 1)} className="btn" aria-label="Мурунку бет" title="Мурунку бет">
                                <ChevronLeft size={16} />
                            </button>
                            <button disabled={!canNext} onClick={() => setPage(p => p + 1)} className="btn" aria-label="Кийинки бет" title="Кийинки бет">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Tablet & Mobile card grid (like ContactsPage) */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-2">
                {loading && Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}><CardBody><Skeleton className="h-16 w-full" /></CardBody></Card>
                ))}

                {!loading && (data?.items?.length ?? 0) === 0 && (
                    <Card><CardBody><div className="p-6 text-center text-gray-500">Колдонуучулар табылган жок</div></CardBody></Card>
                )}

                {data?.items?.map((u) => {
                    const allowed = canToggleFor(me?.role, u.role);
                    const clickable = canUpdateUser(me?.role);
                    return (
                        <Card
                            key={u.id}
                            className={`overflow-hidden ${clickable ? 'cursor-pointer' : ''}`}
                            onClick={() => { if (clickable) openEdit(u); }}
                        >
                            {/* Compact header */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                                <div className="min-w-0">
                                    <div className="font-semibold truncate">{u.fullName}</div>
                                    <div className="text-xs text-gray-500 truncate">#{u.id} • {ROLE_LABEL[u.role]} ({u.role})</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[11px] rounded-full border ${u.isActive
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}>
                                        {u.isActive ? 'Активдүү' : 'Өчүрүлгөн'}
                                    </span>
                                </div>
                            </div>

                            <CardBody className="p-3">
                                {/* Email & last activity */}
                                <div className="text-[12px] text-gray-600 dark:text-gray-300 truncate">{u.email}</div>
                                <div className="mt-1 text-[12px] text-gray-500">
                                    {u.lastLoginAt
                                        ? `Акыркы кирүү: ${new Date(u.lastLoginAt).toLocaleDateString()}`
                                        : (u.invitedAt ? `Чакыруу: ${new Date(u.invitedAt).toLocaleDateString()}` : '—')}
                                </div>

                                {/* Actions row (icon-only on mobile) */}
                                <div className="mt-2 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    {canResendInvite(me?.role) && canResend(u) && (
                                        <GhostButton
                                            onClick={() => resendInviteByEmail(u.email)}
                                            aria-label="Чакыруу (кайра)"
                                            title="Чакыруу (кайра)"
                                            className="px-2 py-1"
                                        >
                                            <Mail size={16} />
                                            <span className="hidden md:inline ml-1">Чакыруу</span>
                                            <RefreshCcw size={14} className="hidden md:inline ml-1 opacity-70" />
                                        </GhostButton>
                                    )}

                                    {u.inviteToken && (
                                        <SubtleButton
                                            onClick={() => copyInviteLink(u)}
                                            aria-label="Шилтемени көчүрүү"
                                            title="Шилтемени көчүрүү"
                                            className="px-2 py-1"
                                        >
                                            <Copy size={16} />
                                            <span className="hidden md:inline ml-1">Көчүрүү</span>
                                        </SubtleButton>
                                    )}

                                    {canUpdateUser(me?.role) && (
                                        <GhostButton
                                            onClick={() => openEdit(u)}
                                            aria-label="Өзгөртүү"
                                            title="Өзгөртүү"
                                            className="px-2 py-1"
                                        >
                                            <Pencil size={16} />
                                            <span className="hidden md:inline ml-1">Өзгөртүү</span>
                                        </GhostButton>
                                    )}

                                    {u.id !== me?.id && u.isActive && (
                                        <GhostButton
                                            onClick={() => openConfirm(u, false)}
                                            disabled={!allowed}
                                            aria-label="Өчүрүү"
                                            title={allowed ? 'Өчүрүү' : 'Уруксатыңыз жетишсиз'}
                                            className="px-2 py-1"
                                        >
                                            <PowerOff size={16} />
                                            <span className="hidden md:inline ml-1">Өчүрүү</span>
                                        </GhostButton>
                                    )}
                                    {u.id !== me?.id && !u.isActive && (
                                        <GhostButton
                                            onClick={() => openConfirm(u, true)}
                                            disabled={!allowed}
                                            aria-label="Активдештирүү"
                                            title={allowed ? 'Активдештирүү' : 'Уруксатыңыз жетишсиз'}
                                            className="px-2 py-1"
                                        >
                                            <Power size={16} />
                                            <span className="hidden md:inline ml-1">Активдештирүү</span>
                                        </GhostButton>
                                    )}

                                    {canSoftDelete(me?.role) && u.id !== me?.id && (
                                        <GhostButton
                                            onClick={() => openSoftDelete(u)}
                                            aria-label="өчүрүү"
                                            title="өчүрүү"
                                            className="px-2 py-1"
                                        >
                                            <Trash2 size={16} />
                                        </GhostButton>
                                    )}

                                    {canHardDelete(me?.role) && u.id !== me?.id && (
                                        <GhostButton
                                            onClick={() => openHardDelete(u)}
                                            aria-label="Катуу өчүрүү"
                                            title="Катуу өчүрүү (кайтарылбайт)"
                                            className="px-2 py-1"
                                        >
                                            <Trash2 size={16} />
                                            <span className="hidden md:inline ml-1">Катуу</span>
                                        </GhostButton>
                                    )}
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}

                {/* Tablet/Mobile pagination */}
                <div className="flex items-center justify-between py-2">
                    <button disabled={!canPrev} onClick={() => setPage((p) => p - 1)} className="btn" aria-label="Мурунку бет">
                        <ChevronLeft size={16} />
                    </button>
                    <div className="text-sm">Бет: {data?.page ?? 1} / {totalPages}</div>
                    <button disabled={!canNext} onClick={() => setPage((p) => p + 1)} className="btn" aria-label="Кийинки бет">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* New User Modal */}
            <NewUserModal
                open={newOpen}
                onClose={() => setNewOpen(false)}
                currentUserRole={me?.role || 'sales'}
                onCreated={async () => { await load(); }}
            />

            {/* Edit User Modal (superadmin/allowed) */}
            {canUpdateUser(me?.role) && (
                <EditUserModal
                    open={editOpen}
                    user={editTarget}
                    onClose={() => setEditOpen(false)}
                    onSaved={async () => { setEditOpen(false); await load(); }}
                />
            )}

            {/* Toggle confirm */}
            <ConfirmModal
                open={confirmOpen}
                loading={confirmLoading}
                onClose={() => { if (!confirmLoading) setConfirmOpen(false); }}
                onConfirm={confirmProceed}
                title={confirmMakeActive ? 'Колдонуучуну активдештирүү' : 'Колдонуучуну өчүрүү'}
                message={
                    confirmTarget
                        ? (confirmMakeActive
                            ? `Колдонуучу “${confirmTarget.fullName}” (${ROLE_LABEL[confirmTarget.role]}) активдештирилет. Улантууга ишенесизби?`
                            : `Колдонуучу “${confirmTarget.fullName}” (${ROLE_LABEL[confirmTarget.role]}) өчүрүлөт. Улантууга ишенесизби?`)
                        : ''
                }
                confirmLabel={confirmMakeActive ? 'Ооба, активдештир' : 'Ооба, өчүр'}
                cancelLabel="Жокко чыгаруу"
            />

            {/* Soft delete confirm */}
            <ConfirmModal
                open={!!softTarget}
                loading={deleteLoading}
                onClose={() => !deleteLoading && setSoftTarget(null)}
                onConfirm={() => softTarget && performSoftDelete(softTarget.id)}
                title="Колдонуучуну өчүрүү"
                message={
                    softTarget ? `“${softTarget.fullName}” (${ROLE_LABEL[softTarget.role]}) — өчүрүлөт (кайра калыбына келтирсе болот). Улантасызбы?` : ''
                }
                confirmLabel="Ооба, өчүр"
                cancelLabel="Жокко чыгаруу"
            />

            {/* Hard delete confirm */}
            <ConfirmModal
                open={!!hardTarget}
                loading={deleteLoading}
                onClose={() => !deleteLoading && setHardTarget(null)}
                onConfirm={() => hardTarget && performHardDelete(hardTarget.id)}
                title="Колдонуучуну катуу өчүрүү"
                message={
                    hardTarget ? `“${hardTarget.fullName}” (${ROLE_LABEL[hardTarget.role]}) — толук жана кайтарылгыс өчүрүлөт. Улантасызбы?` : ''
                }
                confirmLabel="Ооба, катуу өчүр"
                cancelLabel="Жокко чыгаруу"
            />
        </div>
    );
}

/** Minimal confirmation modal (no external deps), Kyrgyz copy */
function ConfirmModal({
    open,
    loading,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onClose,
}: {
    open: boolean;
    loading?: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onClose: () => void;
}) {
    if (!open) return null;
    return createPortal(
        <div aria-modal className="fixed inset-0 z-[120]">
            <button
                aria-label="Жабуу"
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                disabled={loading}
            />
            <div className="absolute inset-x-0 top-20 mx-auto max-w-md">
                <div className="rounded-2xl border bg-white shadow-xl">
                    <div className="px-4 py-3 border-b font-semibold">{title}</div>
                    <div className="p-4 text-sm text-gray-800 whitespace-pre-line">{message}</div>
                    <div className="px-4 pb-4 flex items-center justify-end gap-2">
                        <GhostButton onClick={onClose} disabled={loading}>Жокко чыгаруу</GhostButton>
                        <PrimaryButton onClick={onConfirm} disabled={loading}>
                            {loading ? 'Иштеп жатат...' : confirmLabel}
                        </PrimaryButton>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
