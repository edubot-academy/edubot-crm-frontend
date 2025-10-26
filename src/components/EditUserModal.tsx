import React, { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import type { UserRole } from '@/components/NewUserModal';
import { ROLE_ORDER, ROLE_LABEL } from '@/lib/constants/roles';
import { currentUser } from '@/lib/auth';

// ---- Role helpers (unchanged) ----
function visibleRoles(actor: UserRole, target: UserRole): UserRole[] {
    if (actor === 'superadmin') return ROLE_ORDER; // full control
    if (actor === 'admin') {
        if (target === 'superadmin') return []; // cannot change superadmin at all
        return ROLE_ORDER.filter((r) => r !== 'superadmin'); // up to admin
    }
    return []; // others cannot change roles
}

function canEditIdentity(actor: UserRole, target: UserRole) {
    if (actor === 'superadmin') return true;
    if (actor === 'admin') return target !== 'superadmin';
    return false;
}

function canChangeRole(actor: UserRole, target: UserRole, selfEdit: boolean) {
    if (selfEdit) return actor === 'superadmin'; // only superadmin can change their own role
    if (actor === 'superadmin') return true;
    if (actor === 'admin') return target !== 'superadmin';
    return false;
}

// ---- UI Field wrapper ----
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">{label}</label>
            {children}
            {error ? <div className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</div> : null}
        </div>
    );
}

export default function EditUserModal({
    open,
    user,
    onClose,
    onSaved,
}: {
    open: boolean;
    user: { id: number; fullName: string; email: string; role: UserRole } | null;
    onClose: () => void;
    onSaved: () => Promise<void> | void;
}) {
    const toast = useToast();
    const me = currentUser();
    const meRole = (me?.role ?? 'sales') as UserRole;
    const selfEdit = !!user && me?.id === user.id;

    const [form, setForm] = useState(() => ({
        fullName: user?.fullName ?? '',
        email: user?.email ?? '',
        role: (user?.role ?? 'sales') as UserRole,
    }));
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        setForm({
            fullName: user?.fullName ?? '',
            email: user?.email ?? '',
            role: (user?.role ?? 'sales') as UserRole,
        });
    }, [user]);

    const canEdit = user ? canEditIdentity(meRole, user.role) : false;
    const canRole = user ? canChangeRole(meRole, user.role, selfEdit) : false;

    const roleOptions = useMemo<UserRole[]>(() => {
        if (!user) return [];
        return visibleRoles(meRole, user.role);
    }, [meRole, user]);

    if (!user) {
        // Modal will handle `open` false; early return keeps types happy
        return null;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setLoading(true);

            // Only send fields user is allowed to change
            const payload: Partial<typeof form> = {};
            if (canEdit) {
                payload.fullName = form.fullName;
                payload.email = form.email;
            }
            if (canRole && roleOptions.includes(form.role)) {
                payload.role = form.role;
            }

            if (Object.keys(payload).length === 0) {
                toast.push({ title: 'Маалымат', message: 'Сиз өзгөртүү киргизген жоксуз.' });
                return;
            }

            await api.patch(`/users/${user?.id}`, payload);
            toast.push({ title: 'OK', message: 'Колдонуучу жаңыртылды.' });
            await onSaved();
        } catch (e: any) {
            const msg =
                e?.response?.status === 403
                    ? 'Сизде бул аракетке уруксат жок.'
                    : e?.response?.data?.message || 'Сактоо ишке ашкан жок.';
            toast.push({ title: 'Ката', message: msg });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Колдонуучуну өзгөртүү"
            size="md" // ~ sm:max-w-md to match your previous sizing
            footer={
                <div className="flex items-center justify-end gap-2 w-full">
                    <GhostButton type="button" onClick={onClose}>Жокко чыгаруу</GhostButton>
                    <PrimaryButton type="submit" form="edit-user-form" disabled={loading}>
                        {loading ? 'Сакталууда...' : 'Сактоо'}
                    </PrimaryButton>
                </div>
            }
        >
            <form id="edit-user-form" onSubmit={onSubmit} className="space-y-4">
                <Field label="Аты-жөнү">
                    <Input
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        required
                        disabled={!canEdit}
                        title={!canEdit ? 'Сиз бул талааны өзгөртө албайсыз.' : undefined}
                    />
                </Field>

                <Field label="Email">
                    <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        disabled={!canEdit}
                        title={!canEdit ? 'Сиз бул талааны өзгөртө албайсыз.' : undefined}
                    />
                </Field>

                <Field label="Роль">
                    <Select
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                        disabled={!canRole || roleOptions.length === 0}
                        title={!canRole ? 'Ролду өзгөртүү укугуңуз жок.' : undefined}
                    >
                        {roleOptions.map((r) => (
                            <option key={r} value={r}>
                                {ROLE_LABEL[r]} ({r})
                            </option>
                        ))}
                    </Select>
                    {roleOptions.length === 0 && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Бул колдонуучунун ролун өзгөртүүгө укугуңуз жок.
                        </p>
                    )}
                    {selfEdit && meRole !== 'superadmin' && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Өз ролуңузду өзгөртүү үчүн супер администратор керек.
                        </p>
                    )}
                </Field>
            </form>
        </Modal>
    );
}
