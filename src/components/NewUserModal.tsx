import React from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PrimaryButton, GhostButton, SubtleButton } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';

export type UserRole = 'sales' | 'assistant' | 'manager' | 'superadmin';

type CreateUserDto = {
    fullName: string;
    email: string;
    role: UserRole;
};

type InviteRes = { userId: number; inviteLink: string; inviteToken: string };

type Props = {
    open: boolean;
    onClose: () => void;
    // Optional: after successful creation
    onCreated?: (payload: InviteRes) => void;
    // Who is using the modal (to limit role options in UI)
    currentUserRole: UserRole;
};

// Zod schema (client-side validation)
const schema = z.object({
    fullName: z.string().min(2, { message: 'Аты-жөнү 2 белгиден кыска болбошу керек.' }).max(160, { message: 'Аты-жөнү 160 белгиден ашпоого тийиш.' }),
    email: z.string().email({ message: 'Email форматы туура эмес.' }).max(160, { message: 'Email 160 белгиден ашпоого тийиш.' }),
    role: z.enum(['sales', 'assistant', 'manager', 'superadmin'], { message: 'Роль тандаңыз.' }),
});

export default function NewUserModal({ open, onClose, onCreated, currentUserRole }: Props) {
    const toast = useToast();
    console.log(currentUserRole);
    // Allowed roles per current user
    const roleOptions: { value: UserRole; label: string }[] =
        currentUserRole === 'superadmin'
            ? [
                { value: 'sales', label: 'САТУУЧУ (sales)' },
                { value: 'assistant', label: 'АССИСТЕНТ (assistant)' },
                { value: 'manager', label: 'МЕНЕДЖЕР (manager)' },
                { value: 'superadmin', label: 'СУПЕРАДМИН (superadmin)' },
            ]
            : currentUserRole === 'manager'
                ? [
                    { value: 'sales', label: 'САТУУЧУ (sales)' },
                ]
                : [];

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<CreateUserDto>({
        resolver: zodResolver(schema),
        defaultValues: { fullName: '', email: '', role: roleOptions[0]?.value },
    });

    // Success state (shows invite link + token)
    const [success, setSuccess] = React.useState<InviteRes | null>(null);

    const onSubmit: SubmitHandler<CreateUserDto> = async (values) => {
        try {
            const payload: CreateUserDto = {
                fullName: values.fullName.trim(),
                email: values.email.trim(),
                role: values.role,
            };

            const { data } = await api.post<InviteRes>('/users', payload);

            setSuccess(data);
            onCreated?.(data);

            toast.push({
                title: 'OK',
                message: 'Колдонуучу кошулду жана чакыруу жиберилди.',
                variant: 'success',
            });

            reset();
        } catch (err: any) {
            // Try to pull a friendly message from Nest validation/HTTP errors
            if (err?.response?.status === 409) {
                toast.push({ title: 'Ката', message: 'Бул email менен колдонуучу мурда бар.', variant: 'error' });
                return;
            }

            const raw = err?.response?.data?.message ?? err?.message ?? 'Кошууда ката кетти.';
            const message =
                Array.isArray(raw) ? raw.join('\n') :
                    typeof raw === 'object' ? JSON.stringify(raw) :
                        String(raw);

            toast.push({
                title: 'Ката',
                message,
                variant: 'error',
            });
        }
    };


    if (!open) return null;

    return createPortal(
        <div aria-modal className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <button aria-label="Жабуу" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            {/* Dialog */}
            <div className="absolute inset-x-0 top-10 mx-auto max-w-xl">
                <div className="rounded-2xl border bg-white shadow-xl">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                        <h2 className="font-semibold">{success ? 'Чакыруу түзүлдү' : 'Жаңы колдонуучу кошуу'}</h2>
                        <button className="btn btn-ghost" onClick={onClose}>X</button>
                    </div>

                    <div className="p-4">
                        {!success ? (
                            roleOptions.length === 0 ? (
                                <div className="text-sm text-red-600">
                                    Бул иш-аракетке уруксат жок. Жаңы колдонуучуну **менеджер** же **суперадмин** гана кошо алат.
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <Field label="Аты-жөнү *" error={errors.fullName?.message}>
                                        <Input placeholder="Айбек Турдубек" {...register('fullName')} />
                                    </Field>

                                    <Field label="Email *" error={errors.email?.message}>
                                        <Input placeholder="user@example.com" {...register('email')} />
                                    </Field>

                                    <Field label="Роль *" error={errors.role?.message}>
                                        <Select {...register('role')}>
                                            {roleOptions.map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </Select>
                                    </Field>

                                    <div className="flex items-center justify-end gap-2">
                                        <GhostButton type="button" onClick={onClose}>Жокко чыгаруу</GhostButton>
                                        <PrimaryButton type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Жүктөлүүдө...' : 'Чакыруу жөнөтүү'}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            )
                        ) : (
                            <SuccessInviteCard data={success} onClose={onClose} onReset={() => setSuccess(null)} />
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// Simple field wrapper
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm mb-1">{label}</label>
            {children}
            {error ? <div className="text-xs text-red-600 mt-1">{error}</div> : null}
        </div>
    );
}

function SuccessInviteCard({ data, onClose, onReset }: { data: { userId: number; inviteLink: string; inviteToken: string }, onClose: () => void, onReset: () => void }) {
    function copy(text: string) {
        navigator.clipboard?.writeText(text);
    }
    return (
        <div className="space-y-4">
            <div className="text-sm">
                Колдонуучу ийгиликтүү түзүлдү. Чакыруу шилтемеси email аркылуу жөнөтүлдү.
            </div>

            <div className="rounded-xl border p-3 bg-gray-50">
                <div className="text-xs text-gray-500">Колдонуучу ID</div>
                <div className="font-mono text-sm">{data.userId}</div>
            </div>

            <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500 mb-1">Чакыруу шилтемеси</div>
                <div className="flex items-center gap-2">
                    <input className="input flex-1 text-xs" readOnly value={data.inviteLink} />
                    <SubtleButton onClick={() => copy(data.inviteLink)}>Көчүрүү</SubtleButton>
                    <SubtleButton onClick={() => window.open(data.inviteLink, '_blank', 'noopener,noreferrer')}>Ачуy</SubtleButton>
                </div>
            </div>

            <div className="rounded-xl border p-3">
                <div className="text-xs text-gray-500 mb-1">Чакыруу токени</div>
                <div className="flex items-center gap-2">
                    <input className="input flex-1 text-xs" readOnly value={data.inviteToken} />
                    <SubtleButton onClick={() => copy(data.inviteToken)}>Көчүрүү</SubtleButton>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <GhostButton onClick={onReset}>Дагы кошуу</GhostButton>
                <PrimaryButton onClick={onClose}>Жабуу</PrimaryButton>
            </div>
        </div>
    );
}
