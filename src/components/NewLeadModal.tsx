import React from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import type { SubmitHandler } from 'react-hook-form';

// Keep in sync with backend ContactSource enum
const SOURCE_VALUES = ['WEBSITE', 'MANUAL', 'SOCIAL', 'ADS', 'REFERRAL', 'CALL', 'IMPORT'] as const;

const schema = z.object({
    fullName: z.string().min(2, { message: 'Аты-жөнү 2 белгиден кыска болбошу керек.' }),
    email: z.string().email({ message: 'Email туура эмес.' }).optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    source: z.enum(SOURCE_VALUES),
    // only required when source is SOCIAL or ADS (validated in superRefine)
    sourceProvider: z.string().max(40, { message: 'Платформа 40 белгиден ашпоого тийиш.' }).optional().or(z.literal('')),
    consent: z.boolean(),
    message: z.string().max(1000, { message: 'Билдирүү 1000 белгиден ашпоого тийиш.' }).optional().or(z.literal('')),
    // keep these on the form for analytics; backend accepts them now
    utmSource: z.string().max(80).optional().or(z.literal('')),
    utmMedium: z.string().max(80).optional().or(z.literal('')),
    utmCampaign: z.string().max(120).optional().or(z.literal('')),
    // optional local-only fields (not sent)
    courseName: z.string().optional().or(z.literal('')),
    courseType: z.enum(['campus', 'online', 'hybrid']).optional().or(z.literal('')),
    preferredLang: z.enum(['kg', 'ru', 'en']),
}).superRefine((val, ctx) => {
    const hasEmail = !!val.email && val.email.trim() !== '';
    const hasPhone = !!val.phone && val.phone.trim() !== '';
    if (!hasEmail && !hasPhone) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['phone'],
            message: 'Телефон же Email талааларынын бирин толтуруңуз.',
        });
    }
    const needsProvider = val.source === 'SOCIAL' || val.source === 'ADS';
    const hasProvider = !!val.sourceProvider && val.sourceProvider.trim() !== '';
    if (needsProvider && !hasProvider) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sourceProvider'],
            message: 'Платформаны көрсөтүңүз (мисалы: instagram, telegram).',
        });
    }
});

type FormValues = z.infer<typeof schema>;

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated?: (newId: number) => void;
};

export default function NewLeadModal({ open, onClose, onCreated }: Props) {
    const toast = useToast();
    const {
        register, handleSubmit, formState: { errors, isSubmitting },
        setValue, reset, watch,
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            source: 'MANUAL',
            sourceProvider: '',
            consent: false,
            message: '',
            utmSource: '',
            utmMedium: '',
            utmCampaign: '',
            courseName: '',
            courseType: undefined,
            preferredLang: 'kg',
        },
    });

    const source = watch('source');
    const showProvider = source === 'SOCIAL' || source === 'ADS';

    React.useEffect(() => {
        if (!open) return;
        // Prefill UTM from URL if exists
        const p = new URLSearchParams(window.location.search);
        const us = p.get('utm_source'); if (us) setValue('utmSource', us);
        const um = p.get('utm_medium'); if (um) setValue('utmMedium', um);
        const uc = p.get('utm_campaign'); if (uc) setValue('utmCampaign', uc);
    }, [open, setValue]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        const payload = {
            fullName: values.fullName.trim(),
            email: values.email?.trim() || null,
            phone: values.phone?.trim() || null,
            source: values.source,
            sourceProvider: showProvider ? values.sourceProvider?.trim().toLowerCase() || null : null,
            message: values.message?.trim() || null,
            utmSource: values.utmSource?.trim() || null,
            utmMedium: values.utmMedium?.trim() || null,
            utmCampaign: values.utmCampaign?.trim() || null,
            // consent / course* / preferredLang are *not* part of backend DTO right now
        };

        try {
            const { data } = await api.post('/contacts/manual', payload);
            toast.push({
                title: 'OK',
                message: data?.assignedToName
                    ? `Лид ийгиликтүү кошулду. Жооптуу: ${data.assignedToName}.`
                    : 'Лид ийгиликтүү кошулду.',
                variant: 'success',
            });
            reset();
            onCreated?.(data?.id);
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Ката кетти. Кийин кайра аракет кылыңыз.';
            toast.push({ title: 'Ката!', message: Array.isArray(msg) ? msg.join('\n') : String(msg), variant: 'error' });
        }
    };

    if (!open) return null;

    return createPortal(
        <div aria-modal className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <button aria-label="Жабуу" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            {/* Dialog */}
            <div className="absolute inset-x-0 top-10 mx-auto max-w-2xl">
                <div className="rounded-2xl border bg-white shadow-xl">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                        <h2 className="font-semibold">Жаңы лид кошуу</h2>
                        <button className="btn btn-ghost" onClick={onClose}>X</button>
                    </div>

                    <div className="p-4">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Field label="Аты-жөнү *" error={errors.fullName?.message}>
                                    <Input placeholder="Асан Үсөн" {...register('fullName')} />
                                </Field>

                                <Field label="Булагы">
                                    <Select {...register('source')}>
                                        {SOURCE_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                                    </Select>
                                </Field>

                                {showProvider && (
                                    <Field label="Платформа" error={errors.sourceProvider?.message}>
                                        <Input placeholder="instagram / telegram / tiktok ..." {...register('sourceProvider')} />
                                    </Field>
                                )}

                                <Field label="Email" error={errors.email?.message}>
                                    <Input placeholder="user@example.com" {...register('email')} />
                                </Field>

                                <Field label="Телефон" error={errors.phone?.message}>
                                    <Input placeholder="+996700000000" {...register('phone')} />
                                </Field>

                                <div className="flex items-center gap-2 mt-6">
                                    <input id="consent" type="checkbox" {...register('consent')} />
                                    <label htmlFor="consent" className="text-sm">Маркетингге макулдук</label>
                                </div>
                            </div>

                            {/* Optional local-only fields for later use */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <Field label="Курс (аты)">
                                    <Input placeholder="frontend, backend..." {...register('courseName')} />
                                </Field>
                                <Field label="Курс түрү">
                                    <Select {...register('courseType')}>
                                        <option value="">—</option>
                                        <option value="campus">campus</option>
                                        <option value="online">online</option>
                                        <option value="hybrid">hybrid</option>
                                    </Select>
                                </Field>
                            </div>

                            <Field label="Билдирүү (каалоо-тилек)" error={errors.message?.message}>
                                <textarea className="input min-h-[90px]" placeholder="Кыскача маалымат..." {...register('message')} />
                            </Field>

                            <div className="grid md:grid-cols-3 gap-4">
                                <Field label="utm_source">
                                    <Input placeholder="instagram / meta / google ..." {...register('utmSource')} />
                                </Field>
                                <Field label="utm_medium">
                                    <Input placeholder="bio / cpc / story / ..." {...register('utmMedium')} />
                                </Field>
                                <Field label="utm_campaign">
                                    <Input placeholder="sept_launch" {...register('utmCampaign')} />
                                </Field>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <GhostButton type="button" onClick={onClose}>Жокко чыгаруу</GhostButton>
                                <PrimaryButton type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? 'Жүктөлүүдө...' : 'Сактоо'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm mb-1">{label}</label>
            {children}
            {error ? <div className="text-xs text-red-600 mt-1">{error}</div> : null}
        </div>
    );
}
