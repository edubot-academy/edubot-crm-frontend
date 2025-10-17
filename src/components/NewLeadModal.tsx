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

const schema = z.object({
    fullName: z.string().min(2, { message: 'Аты-жөнү 2 белгиден кыска болбошу керек.' }),
    email: z.string().email({ message: 'Email туура эмес.' }).optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    source: z.enum(['MANUAL', 'WEBSITE', 'INSTAGRAM', 'TELEGRAM', 'REFERRAL']).default('MANUAL'),
    consent: z.boolean().optional().default(false),
    message: z.string().max(1000, { message: 'Билдирүү 1000 белгиден ашпоого тийиш.' }).optional().or(z.literal('')),
    courseName: z.string().optional().or(z.literal('')),
    courseType: z.enum(['campus', 'online', 'hybrid']).optional().or(z.literal('')),
    utmSource: z.string().optional().or(z.literal('')),
    utmMedium: z.string().optional().or(z.literal('')),
    utmCampaign: z.string().optional().or(z.literal('')),
    preferredLang: z.enum(['kg', 'ru', 'en']).optional().default('kg'),
}).superRefine((val, ctx) => {
    const hasEmail = !!val.email && val.email.trim() !== '';
    const hasPhone = !!val.phone && val.phone.trim() !== '';
    if (!hasEmail && !hasPhone) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Телефон же Email талааларынын бирин толтуруңуз.' });
    }
});

type FormValues = z.infer<typeof schema>;

type Props = {
    open: boolean;
    onClose: () => void;
    onCreated?: (newId: number) => void; // parent can refresh or navigate
};

export default function NewLeadModal({ open, onClose, onCreated }: Props) {
    const toast = useToast();
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, reset } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            fullName: '', email: '', phone: '', source: 'MANUAL', consent: false,
            message: '', courseName: '', courseType: undefined, utmSource: '', utmMedium: '', utmCampaign: '',
            preferredLang: 'kg',
        }
    });

    React.useEffect(() => {
        if (!open) return;
        // Prefill UTM from URL if exists
        const p = new URLSearchParams(window.location.search);
        const us = p.get('utm_source'); if (us) setValue('utmSource', us);
        const um = p.get('utm_medium'); if (um) setValue('utmMedium', um);
        const uc = p.get('utm_campaign'); if (uc) setValue('utmCampaign', uc);
    }, [open, setValue]);

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        const payload: any = {
            fullName: values.fullName.trim(),
            email: values.email?.trim() || null,
            phone: values.phone?.trim() || null,
            source: values.source || 'MANUAL',
            consent: !!values.consent,
            message: values.message?.trim() || null,
            courseName: values.courseName?.trim() || null,
            courseType: values.courseType || null,
            utmSource: values.utmSource?.trim() || null,
            utmMedium: values.utmMedium?.trim() || null,
            utmCampaign: values.utmCampaign?.trim() || null,
            preferredLang: values.preferredLang || 'kg',
        };

        const { data } = await api.post('/contacts', payload);
        toast.push({ title: 'OK', message: 'Лид ийгиликтүү кошулду.' });
        reset();
        onCreated?.(data?.id);
        onClose();
    };


    if (!open) return null;

    // Simple modal without external deps (portal to body)
    return createPortal(
        <div aria-modal className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <button
                aria-label="Жабуу"
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Dialog */}
            <div className="absolute inset-x-0 top-10 mx-auto max-w-2xl">
                <div className="rounded-2xl border bg-white shadow-xl">
                    <div className="px-4 py-3 border-b flex items-center justify-between">
                        <h2 className="font-semibold">Жаңы лид кошуу</h2>
                        <button className="btn btn-ghost" onClick={onClose}>Жабуу</button>
                    </div>
                    <div className="p-4">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <Field label="Аты-жөнү *" error={errors.fullName?.message}>
                                    <Input placeholder="Асан Үсөн" {...register('fullName')} />
                                </Field>

                                <Field label="Булагы">
                                    <Select {...register('source')}>
                                        <option value="MANUAL">MANUAL</option>
                                        <option value="WEBSITE">WEBSITE</option>
                                        <option value="INSTAGRAM">INSTAGRAM</option>
                                        <option value="TELEGRAM">TELEGRAM</option>
                                        <option value="REFERRAL">REFERRAL</option>
                                    </Select>
                                </Field>

                                <Field label="Email" error={errors.email?.message}>
                                    <Input placeholder="user@example.com" {...register('email')} />
                                </Field>

                                <Field label="Телефон" error={errors.phone?.message}>
                                    <Input placeholder="+996700000000" {...register('phone')} />
                                </Field>

                                <Field label="Тандалган тил">
                                    <Select {...register('preferredLang')}>
                                        <option value="kg">Кыргызча</option>
                                        <option value="ru">Русча</option>
                                        <option value="en">Англисче</option>
                                    </Select>
                                </Field>

                                <div className="flex items-center gap-2 mt-6">
                                    <input id="consent" type="checkbox" {...register('consent')} />
                                    <label htmlFor="consent" className="text-sm">Маркетингге макулдук</label>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <Field label="Курс (аты)" error={errors.courseName?.message}>
                                    <Input placeholder="frontend, backend..." {...register('courseName')} />
                                </Field>
                                <Field label="Курс түрү" error={errors.courseType?.message}>
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
                                    <Input placeholder="instagram" {...register('utmSource')} />
                                </Field>
                                <Field label="utm_medium">
                                    <Input placeholder="bio / cpc / ..." {...register('utmMedium')} />
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

// Small field wrapper to show label + error consistently
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm mb-1">{label}</label>
            {children}
            {error ? <div className="text-xs text-red-600 mt-1">{error}</div> : null}
        </div>
    );
}
