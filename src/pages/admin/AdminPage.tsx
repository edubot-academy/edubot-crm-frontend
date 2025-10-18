import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Table, TBody, THead } from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';
import { PrimaryButton, GhostButton, SubtleButton } from '@/components/ui/Button';
import NewUserModal, { UserRole } from '@/components/NewUserModal';
import { useToast } from '@/components/ui/Toast';
import { Search } from 'lucide-react';
import { currentUser } from '@/lib/auth';
import { createPortal } from 'react-dom';

type UserRow = {
    id: number;
    fullName: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    invitedAt?: string | null;
    lastLoginAt?: string | null;
};

type ListRes = { items: UserRow[]; total: number; page: number; limit: number; totalPages: number };

const ROLES: UserRole[] = ['sales', 'assistant', 'manager', 'superadmin'];
const ROLE_LABEL: Record<UserRole, string> = {
    sales: 'Сатуучу',
    assistant: 'Ассистент',
    manager: 'Менеджер',
    superadmin: 'Суперадмин',
};

// Permission helper: who can toggle whom
function canToggleFor(actor: UserRole | undefined, target: UserRole): boolean {
    if (!actor) return false;
    if (actor === 'superadmin') return true;
    if (actor === 'manager') return target === 'sales';
    return false;
}

export default function AdminPage() {
    const user = currentUser();
    const nav = useNavigate();
    const toast = useToast();

    // Gate: only manager/superadmin can access
    const canAdmin = user?.role === 'manager' || user?.role === 'superadmin';
    useEffect(() => {
        if (!canAdmin) nav('/'); // redirect if not allowed
    }, [canAdmin, nav]);

    // Filters
    const [typedQ, setTypedQ] = useState('');
    const [q, setQ] = useState('');
    const [role, setRole] = useState<UserRole | ''>('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    // Debounce search typing
    useEffect(() => {
        const id = setTimeout(() => setQ(typedQ), 300);
        return () => clearTimeout(id);
    }, [typedQ]);

    // Build clean query params
    const params = useMemo(() => {
        const p = new URLSearchParams();
        if (q.trim()) p.set('search', q.trim());
        if (role) p.set('role', role);
        if (page > 1) p.set('page', String(page));
        if (limit !== 20) p.set('limit', String(limit));
        return p;
    }, [q, role, page, limit]);

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
            if (name !== 'CanceledError' && name !== 'AbortError') {
                setErr('Жүктөөдө ката кетти.');
            }
        } finally {
            setLoading(false);
        }
    }, [params]);

    useEffect(() => { void load(); }, [load]);

    // Confirmation modal state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<UserRow | null>(null);
    const [confirmMakeActive, setConfirmMakeActive] = useState<boolean>(false);

    // Actions
    async function toggleActive(id: number, makeActive: boolean) {
        try {
            await api.patch(`/users/${id}`, { isActive: makeActive });
            toast.push({ title: 'OK', message: makeActive ? 'Активдештирилди.' : 'Деактивдештирилди.' });
            await load();
        } catch (e: any) {
            toast.push({ title: 'Ката', message: e?.response?.data?.message || 'Иш-аракет ишке ашкан жок.' });
        }
    }

    async function resendInvite(id: number) {
        try {
            const { data } = await api.post<{ inviteLink: string; inviteToken: string }>(`/users/${id}/resend-invite`, {});
            toast.push({ title: 'OK', message: 'Чакыруу кайра жөнөтүлдү.' });
            if (data?.inviteLink) {
                navigator.clipboard?.writeText(data.inviteLink);
                toast.push({ title: 'OK', message: 'Шилтеме буферге көчүрүлдү.' });
            }
        } catch (e: any) {
            toast.push({ title: 'Ката', message: e?.response?.data?.message || 'Чакыруу кайра жиберилген жок.' });
        }
    }

    function openConfirm(u: UserRow, makeActive: boolean) {
        // UI-level permission check (manager can only toggle sales)
        if (!canToggleFor(user?.role, u.role)) {
            toast.push({ title: 'Кирүүнү тыюу салынды', message: 'Менеджер сатуучуну гана активдештире/өчүрө алат.' });
            return;
        }
        setConfirmTarget(u);
        setConfirmMakeActive(makeActive);
        setConfirmOpen(true);
    }

    async function confirmProceed() {
        if (!confirmTarget) return;
        setConfirmLoading(true);
        await toggleActive(confirmTarget.id, confirmMakeActive);
        setConfirmLoading(false);
        setConfirmOpen(false);
        setConfirmTarget(null);
    }

    // New user modal
    const [newOpen, setNewOpen] = useState(false);

    const totalPages = data?.totalPages ?? 1;
    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Админ панель — колдонуучулар</h1>
                <PrimaryButton onClick={() => setNewOpen(true)} disabled={!canAdmin}>
                    Жаңы колдонуучу
                </PrimaryButton>
            </div>

            <Card>
                <CardBody>
                    <div className="grid md:grid-cols-4 gap-3">
                        <div className="relative">
                            <label className="block text-sm mb-1">Издөө</label>
                            <Input
                                value={typedQ}
                                onChange={(e) => { setPage(1); setTypedQ(e.target.value); }}
                                placeholder="Аты, email"
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

                        <div>
                            <label className="block text-sm mb-1">Роль</label>
                            <Select
                                value={role}
                                onChange={(e) => { setPage(1); setRole(e.target.value as UserRole | ''); }}
                            >
                                <option value="">Баары</option>
                                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]} ({r})</option>)}
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

            <Card>
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
                                    const allowed = canToggleFor(user?.role, u.role);
                                    const btnTitle =
                                        user?.role === 'manager' && u.role !== 'sales'
                                            ? 'Менеджер сатуучуну гана активдештире/өчүрө алат.'
                                            : '';

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
                                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : (u.invitedAt ? `Чакыруу: ${new Date(u.invitedAt).toLocaleString()}` : '—')}
                                            </td>
                                            <td className="whitespace-nowrap flex gap-2 items-center">
                                                {u.invitedAt && (
                                                    <SubtleButton onClick={() => resendInvite(u.id)}>Чакыруу (кайра)</SubtleButton>
                                                )}
                                                {u.id !== user?.id && (u.isActive ? (
                                                    <GhostButton
                                                        onClick={() => openConfirm(u, false)}
                                                        disabled={!allowed}
                                                        title={btnTitle}
                                                    >
                                                        Өчүрүү
                                                    </GhostButton>
                                                ) : (
                                                    <GhostButton
                                                        onClick={() => openConfirm(u, true)}
                                                        disabled={!allowed}
                                                        title={btnTitle}
                                                    >
                                                        Активдештирүү
                                                    </GhostButton>
                                                ))}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </TBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div>Бет: {data?.page ?? 1} / {totalPages}</div>
                        <div className="flex gap-2">
                            <button disabled={!canPrev} onClick={() => setPage(p => p - 1)} className="btn" aria-label="Мурунку бет">←</button>
                            <button disabled={!canNext} onClick={() => setPage(p => p + 1)} className="btn" aria-label="Кийинки бет">→</button>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* New User Modal */}
            <NewUserModal
                open={newOpen}
                onClose={() => setNewOpen(false)}
                currentUserRole={user?.role || 'sales'}
                onCreated={async () => { await load(); }}
            />

            {/* Confirm Toggle Modal */}
            <ConfirmModal
                open={confirmOpen}
                loading={confirmLoading}
                onClose={() => { if (!confirmLoading) setConfirmOpen(false); }}
                onConfirm={confirmProceed}
                title={confirmMakeActive ? 'Колдонуучуну активдештирүү' : 'Колдонуучуну өчүрүү'}
                message={
                    confirmTarget
                        ? (
                            confirmMakeActive
                                ? `Колдонуучу “${confirmTarget.fullName}” (${ROLE_LABEL[confirmTarget.role]}) активдештирилет. Улантууга ишенесизби?`
                                : `Колдонуучу “${confirmTarget.fullName}” (${ROLE_LABEL[confirmTarget.role]}) өчүрүлөт. Улантууга ишенесизби?`
                        )
                        : ''
                }
                confirmLabel={confirmMakeActive ? 'Ооба, активдештир' : 'Ооба, өчүр'}
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
                        <GhostButton onClick={onClose} disabled={loading}>{cancelLabel}</GhostButton>
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
