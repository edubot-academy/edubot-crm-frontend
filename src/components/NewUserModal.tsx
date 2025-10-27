import React from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import clsx from 'clsx';

export type UserRole = 'sales' | 'assistant' | 'manager' | 'admin' | 'superadmin';

type CreateUserDto = { fullName: string; email: string; role: UserRole };
type InviteRes = { userId: number; inviteLink: string; inviteToken: string };

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated?: (payload: InviteRes) => void;
    currentUserRole: UserRole;
};

const schema = z.object({
    fullName: z.string().min(2, { message: 'Аты-жөнү 2 белгиден кыска болбошу керек.' }).max(160, { message: 'Аты-жөнү 160 белгиден ашпоого тийиш.' }),
    email: z.string().email({ message: 'Email форматы туура эмес.' }).max(160, { message: 'Email 160 белгиден ашпоого тийиш.' }),
    role: z.enum(['sales', 'assistant', 'manager', 'admin', 'superadmin'], { message: 'Роль тандаңыз.' }),
});

export default function NewUserModal({ open, onClose, onCreated, currentUserRole }: Props) {
    const toast = useToast();

    const roleOptions: { value: UserRole; label: string }[] =
        currentUserRole === 'superadmin'
            ? [
                { value: 'sales', label: 'САТУУЧУ (sales)' },
                { value: 'assistant', label: 'АССИСТЕНТ (assistant)' },
                { value: 'manager', label: 'МЕНЕДЖЕР (manager)' },
                { value: 'admin', label: 'АДМИН (admin)' },
                { value: 'superadmin', label: 'СУПЕРАДМИН (superadmin)' },
            ]
            : currentUserRole === 'admin'
                ? [
                    { value: 'sales', label: 'САТУУЧУ (sales)' },
                    { value: 'assistant', label: 'АССИСТЕНТ (assistant)' },
                    { value: 'manager', label: 'МЕНЕДЖЕР (manager)' },
                    { value: 'admin', label: 'АДМИН (admin)' },
                ]
                : currentUserRole === 'manager'
                    ? [{ value: 'sales', label: 'САТУУЧУ (sales)' }]
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
            toast.push({ title: 'OK', message: 'Колдонуучу кошулду жана чакыруу жиберилди.', variant: 'success' });
            reset();
        } catch (err: any) {
            if (err?.response?.status === 409) {
                toast.push({ title: 'Ката', message: 'Бул email менен колдонуучу мурда бар.', variant: 'error' });
                return;
            }
            const raw = err?.response?.data?.message ?? err?.message ?? 'Кошууда ката кетти.';
            const message = Array.isArray(raw) ? raw.join('\n') : typeof raw === 'object' ? JSON.stringify(raw) : String(raw);
            toast.push({ title: 'Ката', message, variant: 'error' });
        }
    };

    return (
        <Modal
            open={open}
            onClose={() => {
                setSuccess(null);
                onClose();
                reset();
            }}
            title={success ? 'Чакыруу түзүлдү' : 'Жаңы колдонуучу кошуу'}
            size="xl"
            footer={
                !success ? (
                    <div className="flex items-center justify-end gap-2 w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                reset();
                                onClose();
                            }}
                        >
                            Жокко чыгаруу
                        </Button>
                        <Button
                            type="submit"
                            form="new-user-form"
                            variant="primary"
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            onClick={() => (document.activeElement as HTMLElement)?.blur()}
                        >
                            {isSubmitting ? 'Жүктөлүүдө...' : 'Чакыруу жөнөтүү'}
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-end gap-2 w-full">
                        <Button
                            variant="ghost"
                            onClick={() => setSuccess(null)}
                        >
                            Дагы кошуу
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                reset();
                                onClose();
                            }}
                        >
                            Жабуу
                        </Button>
                    </div>
                )
            }
        >
            {!success ? (
                roleOptions.length === 0 ? (
                    <div className="text-sm text-red-600 dark:text-red-400">
                        Бул иш-аракетке уруксат жок. Жаңы колдонуучуну <b>менеджер</b> же <b>(супер)админ</b> гана кошо алат.
                    </div>
                ) : (
                    <form id="new-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <Field label="Аты-жөнү *" error={errors.fullName?.message}>
                            <Input placeholder="Айбек Турдубек" {...register('fullName')} />
                        </Field>

                        <Field label="Email *" error={errors.email?.message}>
                            <Input placeholder="user@example.com" type="email" {...register('email')} />
                        </Field>

                        <Field label="Роль *" error={errors.role?.message}>
                            <Select {...register('role')}>
                                {roleOptions.map((r) => (
                                    <option key={r.value} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </form>
                )
            ) : (
                <SuccessInviteCard data={success} />
            )}
        </Modal>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">{label}</label>
            {children}
            {error ? <div className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</div> : null}
        </div>
    );
}

function SuccessInviteCard({ data }: { data: { userId: number; inviteLink: string; inviteToken: string } }) {
    function copy(text: string) {
        navigator.clipboard?.writeText(text);
    }
    return (
        <div className="space-y-4">
            <div className="text-sm text-gray-800 dark:text-gray-200">
                Колдонуучу ийгиликтүү түзүлдү. Чакыруу шилтемеси email аркылуу жөнөтүлдү.
            </div>

            <Box title="Колдонуучу ID">
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100">{data.userId}</div>
            </Box>

            <Box title="Чакыруу шилтемеси" shaded>
                <div className="flex items-center gap-2">
                    <input
                        readOnly
                        value={data.inviteLink}
                        className="flex-1 text-xs rounded-xl border px-3 py-2 bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    />
                    <Button
                        variant="subtle"
                        onClick={() => copy(data.inviteLink)}
                    >
                        Көчүрүү
                    </Button>
                    <Button
                        variant="subtle"
                        onClick={() => window.open(data.inviteLink, '_blank', 'noopener,noreferrer')}
                    >
                        Ачуy
                    </Button>
                </div>
            </Box>

            <Box title="Чакыруу токени" shaded>
                <div className="flex items-center gap-2">
                    <input
                        readOnly
                        value={data.inviteToken}
                        className="flex-1 text-xs rounded-xl border px-3 py-2 bg-white text-gray-900 placeholder-gray-400 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                    />
                    <Button
                        variant="subtle"
                        onClick={() => copy(data.inviteToken)}
                    >
                        Көчүрүү
                    </Button>
                </div>
            </Box>
        </div>
    );
}

function Box({ title, children, shaded }: { title: string; children: React.ReactNode; shaded?: boolean }) {
    return (
        <div
            className={clsx(
                'rounded-xl border p-3',
                shaded
                    ? 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            )}
        >
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{title}</div>
            {children}
        </div>
    );
}
