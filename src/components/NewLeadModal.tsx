import React from 'react';
import Modal from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import type { SubmitHandler } from 'react-hook-form';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

// Keep in sync with backend ContactSource enum
const SOURCE_VALUES = ['WEBSITE', 'MANUAL', 'SOCIAL', 'ADS', 'REFERRAL', 'CALL', 'IMPORT'] as const;

const schema = z.object({
    fullName: z.string().min(2, { message: 'Аты-жөнү 2 белгиден кыска болбошу керек.' }),
    email: z.string().email({ message: 'Email туура эмес.' }).optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    source: z.enum(SOURCE_VALUES),
    sourceProvider: z.string().max(40, { message: 'Платформа 40 белгиден ашпоого тийиш.' }).optional().or(z.literal('')),
    consent: z.boolean(),
    message: z.string().max(1000, { message: 'Билдирүү 1000 белгиден ашпоого тийиш.' }).optional().or(z.literal('')),
    utmSource: z.string().max(80).optional().or(z.literal('')),
    utmMedium: z.string().max(80).optional().or(z.literal('')),
    utmCampaign: z.string().max(120).optional().or(z.literal('')),
    courseName: z.string().optional().or(z.literal('')),
    courseType: z.enum(['campus', 'online', 'hybrid']).optional().or(z.literal('')),
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
    const [showAdvanced, setShowAdvanced] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        reset,
        watch,
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
        },
    });

    const source = watch('source');
    const showProvider = source === 'SOCIAL' || source === 'ADS';

    // Prefill UTM from URL when opened
    React.useEffect(() => {
        if (!open) return;
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
            courseName: values.courseName?.trim() || null,
            courseType: values.courseType,
            consent: values.consent,
            utmSource: values.utmSource?.trim() || null,
            utmMedium: values.utmMedium?.trim() || null,
            utmCampaign: values.utmCampaign?.trim() || null,
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

    return (
        <Modal
            open={open}
            onClose={() => {
                reset();
                onClose();
            }}
            title="Жаңы лид кошуу"
            size="xl"
            className="sm:max-w-2xl" // match previous md:max-w-2xl
            footer={
                <div className="flex items-center justify-end gap-2 w-full">
                    <GhostButton
                        type="button"
                        onClick={() => {
                            reset();
                            onClose();
                        }}
                    >
                        Жокко чыгаруу
                    </GhostButton>
                    <PrimaryButton
                        type="submit"
                        form="new-lead-form"
                        disabled={isSubmitting}
                        onClick={() => (document.activeElement as HTMLElement)?.blur()}
                    >
                        {isSubmitting ? 'Жүктөлүүдө...' : 'Сактоо'}
                    </PrimaryButton>
                </div>
            }
        >
            <form id="new-lead-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
                {/* Essentials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <Field label="Аты-жөнү *" error={errors.fullName?.message}>
                        <Input placeholder="Асан Үсөн" autoFocus {...register('fullName')} />
                    </Field>

                    <Field label="Булагы">
                        <Select {...register('source')}>
                            {SOURCE_VALUES.map((v) => (
                                <option key={v} value={v}>{v}</option>
                            ))}
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

                    <div className="flex items-center gap-2 md:mt-6">
                        <input
                            id="consent"
                            type="checkbox"
                            {...register('consent')}
                            className="
                h-4 w-4 rounded border-gray-300 text-emerald-600
                focus:ring-emerald-500
                dark:border-gray-700 dark:bg-gray-800
                dark:focus:ring-emerald-400
              "
                        />
                        <label htmlFor="consent" className="text-sm text-gray-800 dark:text-gray-200">
                            Маркетингге макулдук
                        </label>
                    </div>
                </div>

                {/* Advanced (collapsible on mobile) */}
                <div className="border-t border-gray-200 dark:border-gray-800 pt-3 md:pt-4">
                    <button
                        type="button"
                        onClick={() => setShowAdvanced((v) => !v)}
                        aria-expanded={showAdvanced}
                        className="md:hidden w-full flex items-center justify-between text-sm font-medium px-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        Кошумча талаалар
                        <ChevronDown size={16} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 ${showAdvanced ? '' : 'hidden md:grid'}`}>
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

                        <Field className="md:col-span-2" label="Билдирүү (каалоо-тилек)" error={errors.message?.message}>
                            <textarea
                                className="
                  input min-h-[84px] md:min-h-[100px] text-sm
                  bg-white text-gray-900 placeholder-gray-400
                  dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500
                "
                                placeholder="Кыскача маалымат..."
                                {...register('message')}
                            />
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 md:col-span-2">
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
                    </div>
                </div>
            </form>
        </Modal>
    );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={clsx(className)}>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">{label}</label>
            {children}
            {error ? <div className="text-xs mt-1 text-red-600 dark:text-red-400">{error}</div> : null}
        </div>
    );
}
