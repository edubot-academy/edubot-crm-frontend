import React from 'react';
import {
    Mail, Phone, Tag, CalendarClock, Flag, Save, X, ArrowLeft, Pencil, ShieldCheck, Info, ArrowDown
} from 'lucide-react';
import { Card, CardBody, Section } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import FollowUpBanner from '../FollowUpBanner';
import QuickComms from '../QuickComms';
import DetailsBlock from '../DetailsBlock';
import { getNextOptions, PIPELINE, STATUS_LABELS, type S, NEXT_ALLOWED } from '@/lib/status';
import OutcomeSelect, { OUTCOME_LABEL, type Outcome } from '@/components/OutcomeSelect';
import { currentUser } from '@/lib/auth';
import FinanceCard from '@/components/contacts/FinanceCard';
import PaymentModal from '@/components/payments/PaymentModal';
import { addDeposit, addEnrollment } from '@/lib/api/payments';
import { useToast } from '@/components/ui/Toast';

// Context that parent owns (no API calls here)
export type ContactDetailCtx = {
    navBack: () => void;
    canEdit: boolean;
    isSalesOrManager: boolean;
    editing: boolean;
    setEditing: (v: boolean) => void;

    c: any;
    attempts: number;
    lastUpdateLabel: string;
    lastContactedLabel: string;
    sourceDisplay: string;

    status: S;
    setStatus: (s: S) => void;
    primaryNext?: S;

    // Outcomes (optional, only used for UNQUALIFIED/LOST/ARCHIVED)
    outcome?: Outcome;
    setOutcome?: (o?: Outcome) => void;
    outcomeDetail?: string;
    setOutcomeDetail?: (v: string) => void;

    suggestNoResponse: boolean;
    suggestLost: boolean;
    setStatusViaBanner: (s: string) => void;

    tab: 'overview' | 'timeline';
    setTab: (k: 'overview' | 'timeline') => void;

    nextFollowUpAt: string;
    setNextFollowUpAt: (v: string) => void;
    priority: number;
    setPriority: (n: number) => void;
    courseName: string;
    setCourseName: (v: string) => void;
    courseType: '' | 'campus' | 'online' | 'hybrid';
    setCourseType: (v: '' | 'campus' | 'online' | 'hybrid') => void;
    tagsStr: string;
    setTagsStr: (v: string | ((s: string) => string)) => void;
    tagsArr: string[];
    removeTag: (i: number) => void;

    canSave: boolean;
    save: () => void | Promise<void>;
    cancel: () => void;
    saving: boolean;
    onOutreach: () => void;
    markContactedNow: () => void;
    markRespondedNow: () => void;
    markNoResponse: () => void;

    noteItems: Array<{ id: number; body: string; createdAt: string; author?: { fullName?: string } }>;
    noteText: string;
    setNoteText: (v: string) => void;
    addNote: () => void;
    fullName: string;                 
    setFullName: (v: string) => void;
    t: any;
    reload: () => void | Promise<void>; 
};

export default function ContactDetailSection({ ctx }: { ctx: ContactDetailCtx }) {
    const {
        navBack, canEdit, isSalesOrManager, editing, setEditing,
        c, attempts, lastUpdateLabel, lastContactedLabel, sourceDisplay,
        status, setStatus, primaryNext,
        outcome, setOutcome, outcomeDetail = '', setOutcomeDetail,
        suggestNoResponse, suggestLost, setStatusViaBanner,
        tab, setTab,
        nextFollowUpAt, setNextFollowUpAt, priority, setPriority,
        courseName, setCourseName, courseType, setCourseType,
        tagsStr, setTagsStr, tagsArr, removeTag,
        canSave, save, cancel, saving, onOutreach, markContactedNow, markRespondedNow, markNoResponse,
        noteItems, noteText, setNoteText, addNote,
        t,
        reload
    } = ctx;

    const toast = useToast();
    const [payOpen, setPayOpen] = React.useState<null | ('DEPOSIT' | 'ENROLLMENT')>(null);
    const [payLoading, setPayLoading] = React.useState(false);

    const me = currentUser();
    const nextOptions = React.useMemo<S[]>(
        () => getNextOptions(c.status as S, me?.role ?? 'sales'),
        [c.status, me?.role],
    );

    const needsOutcome = ['UNQUALIFIED', 'LOST', 'ARCHIVED'].includes(status);

    const onSetStatus = (s: S) => {
        if (!canEdit) return;
        if (!editing) setEditing(true);
        setStatus(s);
        if (!['UNQUALIFIED', 'LOST', 'ARCHIVED'].includes(s)) {
            setOutcome?.(undefined);
            setOutcomeDetail?.('');
        }
    };

    // at top of ContactDetailSection
    const EXTRA_ONLY = (NEXT_ALLOWED[c.status as S] ?? []).filter((s: S) => !PIPELINE.includes(s));
    const [extraStatus, setExtraStatus] = React.useState<S | ''>('');


    // reset the select after save/cancel (editing toggles to false in your save())
    React.useEffect(() => {
        if (!editing) setExtraStatus('');
    }, [editing]);


    const handlePaymentSubmit = React.useCallback(async (v: {
        amount: string; currency: string; method: any; reference?: string; note?: string;
        }) => {
        if (!c) return;
        setPayLoading(true);
        try {
            if (payOpen === 'DEPOSIT') {
            await addDeposit({ contactId: c.id, ...v });
            toast.push({ title: 'OK', message: 'Депозит кошулду.', variant: 'success' });
            } else if (payOpen === 'ENROLLMENT') {
            await addEnrollment({ contactId: c.id, ...v });
            toast.push({ title: 'OK', message: 'Каттоо төлөмү кошулду.', variant: 'success' });
            }
            setPayOpen(null);
            await reload(); // refresh header/summary if needed
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? e?.message ?? 'Ката кетти.';
            toast.push({ title: 'Ката', message: Array.isArray(msg) ? msg.join('\n') : String(msg), variant: 'error' });
        } finally {
            setPayLoading(false);
        }
    }, [c, payOpen, toast, ctx]);

    return (
        <div className="max-w-6xl w-full min-w-0 mx-auto space-y-5 pb-16 text-gray-900 dark:text-gray-100">
            {/* Sticky top row */}
            <div className="flex items-center justify-between rounded-2xl border px-3 py-2 sticky top-14 md:top-0 z-30
        bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center gap-3 min-w-0 w-full">
                    <Button variant="ghost" onClick={navBack} title="Артка" aria-label="Артка" size="sm">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="h-9 w-9 md:h-10 md:w-10 rounded-full grid place-items-center font-semibold
                        bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-1 dark:ring-emerald-800/50">
                        {(editing ? ctx.fullName : c.fullName)?.[0] ?? 'U'}
                    </div>
                    <div className="min-w-0">
                        {editing && canEdit ? (
                            <div className="flex items-center gap-2">
                            <Input
                                value={ctx.fullName}
                                onChange={(e) => ctx.setFullName(e.target.value)}
                                placeholder="Ат-жөнү"
                                aria-label="Ат-жөнү"
                                className="input h-9 md:h-10 text-base md:text-lg flex-1"
                            />
                            <span className="text-gray-400 dark:text-gray-500 font-mono shrink-0">#{c.id}</span>
                            </div>
                        ) : (
                            <h1 className="text-lg md:text-2xl font-semibold truncate">
                            {c.fullName}{' '}
                            <span className="text-gray-400 dark:text-gray-500 font-mono">#{c.id}</span>
                            </h1>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-gray-600 dark:text-gray-300">
                            {c.email && (
                                <span className="inline-flex items-center gap-1 max-w-[42vw] md:max-w-none truncate">
                                    <Mail className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{c.email}</span>
                                </span>
                            )}
                            {c.phone && (
                                <span className="inline-flex items-center gap-1 max-w-[42vw] md:max-w-none truncate">
                                    <Phone className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{c.phone}</span>
                                </span>
                            )}
                            <StatusBadge status={c.status} />
                            {typeof c.consent === 'boolean' && (
                                <span className={[
                                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] md:text-xs',
                                    c.consent
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
                                ].join(' ')}>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {c.consent ? 'Макулдук бар' : 'Макулдук жок'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 shrink-0">
                    {!editing ? (
                        <Button
                            variant="ghost"
                            onClick={() => canEdit && setEditing(true)}
                            disabled={!canEdit}
                            title={!canEdit ? 'Бул бетти өзгөртүү укугуңуз жок' : undefined}
                            className="px-2 py-1 md:px-3"
                        >
                            <Pencil className="w-4 h-4" />
                            <span className="hidden md:inline ml-1">Оңдоо</span>
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={cancel} className="px-2 py-1 md:px-3">
                                <X className="w-4 h-4" />
                                <span className="hidden md:inline ml-1">{t.contacts.cancel}</span>
                            </Button>
                            <Button
                                variant="primary"
                                onClick={save}
                                disabled={!canSave}
                                className="px-2 py-1 md:px-3"
                                loading={saving}
                            >
                                <Save className="w-4 h-4" />
                                <span className="hidden md:inline ml-1">
                                    {saving ? t.contacts.saving : t.contacts.save}
                                </span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Follow-up banners */}
            <FollowUpBanner next={c.nextFollowUpAt} />

            {(isSalesOrManager && suggestNoResponse) && (
                <div className="rounded-xl border p-3 flex items-center justify-between gap-3 shadow-sm
            bg-amber-50/90 border-amber-200 text-amber-900
            dark:bg-amber-900/35 dark:border-amber-800 dark:text-amber-200">
                    <div className="text-sm">
                        Бул лидге <b>{attempts}</b> жолу байланыш жасалды, жооп келе элек окшойт.
                        <span className="ml-1">Статусту <b>ЖООП ЖОК</b> кылууну же кийинки байланыш убакытты коюуну сунуштайбыз.</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" className="dark:hover:text-amber-50" onClick={() => setStatusViaBanner('NO_RESPONSE')}>
                            Жооп жок
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => canEdit && setEditing(true)}
                            disabled={!canEdit}
                        >
                            Кайра байланыш убактысын коюу
                        </Button>
                    </div>
                </div>
            )}

            {(isSalesOrManager && suggestLost) && (
                <div className="rounded-xl border p-3 flex items-center justify-between gap-3 shadow-sm
            bg-red-50/90 border-red-200 text-red-800
            dark:bg-red-900/35 dark:border-red-800 dark:text-red-200">
                    <div className="text-sm">
                        <b>{attempts}</b> аракеттен кийин да байланыша албай жатабыз.
                        <span className="ml-1">Бул лидди <b>ЖОГОЛДУ</b> катары белгилөөгө убакыт келдиби?</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="danger" className="dark:hover:text-red-50" onClick={() => setStatusViaBanner('LOST')}>
                            Жоголду
                        </Button>
                        <Button onClick={() => canEdit && setEditing(true)} disabled={!canEdit} variant="primary">
                            Дагы бир аракет
                        </Button>
                    </div>
                </div>
            )}

            {c.status === 'CONTACTED' && (
                <div className="flex items-center gap-2 mt-2">
                    <Button variant="primary" onClick={markRespondedNow} loading={saving}>Жооп берди</Button>
                    <Button variant="ghost" onClick={markNoResponse} className="dark:hover:text-gray-100">Жооп жок</Button>
                </div>
            )}

            {noteItems.length > 0 && (
                <div className="rounded-xl border p-3 shadow-sm bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Акыркы эскертме — {new Date(noteItems[0].createdAt).toLocaleString()}
                        {noteItems[0].author?.fullName ? ` • ${noteItems[0].author.fullName}` : ''}
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">{noteItems[0].body}</div>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b pb-2 bg-white/70 dark:bg-gray-900/70 backdrop-blur-[2px]
          border-gray-200 dark:border-gray-800 rounded-t-md px-2 pt-2
          flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="overflow-x-auto no-scrollbar -mx-2 px-2 flex-1">
                    <div className="inline-flex min-w-full sm:min-w-0 whitespace-nowrap">
                        <Tabs value={tab} onChange={(k) => setTab(k as any)} items={[
                            { key: 'overview', label: 'Кыскача' },
                            { key: 'timeline', label: 'Таймлайн' },
                        ]} />
                    </div>
                </div>
                <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-300 mt-1 sm:mt-0 sm:ml-3 leading-tight break-words flex-1 sm:flex-none">
                    <div className="max-h-[2.5em] overflow-hidden">{lastUpdateLabel}</div>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                {/* Sidebar */}
                <aside className="hidden lg:block">
                    <div className="sticky top-20">
                        <div className="rounded-2xl border bg-white border-gray-200 p-3 dark:bg-gray-900 dark:border-gray-800">
                            <div className="font-medium text-gray-700 dark:text-gray-200 mb-2">Кыскача маалымат</div>
                            <ul className="space-y-1 text-sm">
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-200">Лид ээси</span>
                                    <span className="text-gray-600 dark:text-gray-300">{c.createdByName || '—'}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-200">Жооптуу</span>
                                    <span className="text-gray-600 dark:text-gray-300">{c.assignedToName || '—'}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-200">Булагы</span>
                                    <span className="text-gray-600 dark:text-gray-300">{sourceDisplay}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-200">Акыркы байланыш</span>
                                    <span className="text-gray-600 dark:text-gray-300">{lastContactedLabel}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-200">Кийинки байланыш</span>
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toLocaleString() : '—'}
                                    </span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-200">Приоритет</span>
                                    <span className="text-gray-600 dark:text-gray-300">{Math.max(1, Number(c.priority ?? 1))}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-200">Байланыш аракеттери</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600 dark:text-gray-300">{attempts}</span>
                                        <Button variant="subtle" title="Жаңы аракет белгилөө" onClick={onOutreach}
                                            className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" size="sm">+1</Button>
                                    </div>
                                </li>
                                <li className="pt-1"><QuickComms phone={c.phone} email={c.email} onOutreach={onOutreach} onMark={markContactedNow} /></li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <div className="space-y-6">
                    {tab === 'overview' ? (
                        <>
                            {/* Finance summary + quick actions */}
                            <Section title="Каржы (бул контакт)">
                                <FinanceCard
                                    contactId={c.id}
                                    onAddDeposit={() => setPayOpen('DEPOSIT')}
                                    onAddEnroll={() => setPayOpen('ENROLLMENT')}
                                    adminLink={`/admin/payments?contactId=${c.id}`}
                                />
                            </Section>
                            {/* Journey + Next */}
                            <Section title="ЖОЛ КАРТАНЫН АБАЛЫ">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {PIPELINE.map((ps) => {
                                            const isCurrent = ps === c.status;
                                            const canGo = canEdit && editing && (isCurrent || nextOptions.includes(ps as S));
                                            return (
                                                <button
                                                    key={ps}
                                                    type="button"
                                                    disabled={!canGo}
                                                    onClick={() => canGo && onSetStatus(ps as S)}
                                                    className={`px-3 py-1 rounded-lg border text-xs md:text-sm ${status === ps ? 'bg-emerald-600 border-emerald-600 text-white'
                                                        : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700'
                                                        } ${!canGo && 'opacity-50 cursor-not-allowed'}`}
                                                    aria-pressed={status === ps}
                                                >
                                                    {STATUS_LABELS[ps as S]}
                                                </button>
                                            );
                                        })}
                                    </div>

                                </div>
                                {/* row below the rail */}
                                <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between min-w-0">
                                    {editing && canEdit && c.status !== 'NEW' && EXTRA_ONLY.length > 0 && (
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Select
                                                id="extra-status"
                                                className="input h-9 text-xs md:text-sm min-w-[160px] max-w-full"
                                                value={extraStatus}
                                                onChange={(e) => {
                                                    const s = e.target.value as S;
                                                    setExtraStatus(s);
                                                    if (s) setStatus(s);
                                                }}
                                                aria-label="Кошумча статус"
                                                title="Кошумча статус тандоо"
                                            >
                                                <option value="">{'+ Кошумча статус…'}</option>
                                                {EXTRA_ONLY.map((s) => (
                                                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                                ))}
                                            </Select>
                                        </div>
                                    )}

                                    {primaryNext && (
                                        <div className="md:ml-auto min-w-0">
                                            <Button
                                                variant="primary"
                                                onClick={() => onSetStatus(primaryNext)}
                                                disabled={!canEdit || !editing}
                                                className="w-full md:w-auto"
                                                title={`Кийинки: ${STATUS_LABELS[primaryNext]}`}
                                            >
                                                Кийинки статус: {STATUS_LABELS[primaryNext]}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Outcome UI (editing) */}
                                {editing && canEdit && needsOutcome && (
                                    <div className="mt-4 rounded-2xl border bg-white border-gray-200 p-3 md:p-4 dark:bg-gray-900 dark:border-gray-800">
                                        <div className="grid gap-4 md:grid-cols-3 min-w-0">
                                            <div className="md:col-span-1 min-w-0">
                                                <OutcomeSelect value={outcome} onChange={ctx.setOutcome!} />
                                            </div>
                                            <div className="md:col-span-2 min-w-0">
                                                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-200">Кыскача түшүндүрмө</label>
                                                <textarea
                                                    className="input w-full min-h-[96px] text-sm break-words"
                                                    placeholder="Эмне үчүн ушундай чечим?: бюджет, жаш курак, ата-эне каршы, башка курс…"
                                                    value={outcomeDetail}
                                                    onChange={(e) => ctx.setOutcomeDetail!(e.target.value)}
                                                />
                                                <p className="mt-1 text-[11px] text-gray-500 break-words">
                                                    Эскертүү: түшүндүрмө кийинки иш-аракеттерге жардам берет.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Outcome summary (read-only) */}
                                {!editing && (c.outcome || c.outcomeDetail) && (
                                    <div className="mt-4 rounded-2xl border bg-white border-gray-200 p-3 md:p-4 dark:bg-gray-900 dark:border-gray-800">
                                        <div className="flex items-start justify-between gap-3 min-w-0">
                                            <div className="min-w-0">
                                                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Жыйынтык</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-200 flex flex-col gap-1 break-words">
                                                    {c.outcome && (
                                                        <div>
                                                            <span className="text-gray-500 dark:text-gray-400">Түрү: </span>
                                                            {OUTCOME_LABEL[c.outcome as Outcome]}
                                                        </div>
                                                    )}
                                                    {c.outcomeDetail && (
                                                        <div>
                                                            <span className="text-gray-500 dark:text-gray-400">Түшүндүрмө: </span>
                                                            {c.outcomeDetail}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Абалы: {STATUS_LABELS[c.status as S]}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Section>

                            {/* UTM + Message */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <Section title="Канал маалыматтары (UTM)">
                                    <div className="text-sm text-gray-700 dark:text-gray-200 space-y-1">
                                        <div><span className="text-gray-500 dark:text-gray-400">utm_source: </span>{c.utmSource || '—'}</div>
                                        <div><span className="text-gray-500 dark:text-gray-400">utm_medium: </span>{c.utmMedium || '—'}</div>
                                        <div><span className="text-gray-500 dark:text-gray-400">utm_campaign: </span>{c.utmCampaign || '—'}</div>
                                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            UTMден тег кошуу:{' '}
                                            {['utmSource', 'utmMedium', 'utmCampaign'].map((k) => {
                                                const val = (c as any)[k]; if (!val) return null;
                                                return (
                                                    <button key={k} type="button"
                                                        className={`px-2 py-0.5 rounded-full border ${(editing && canEdit)
                                                            ? 'bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                                                            : 'bg-gray-100 dark:bg-gray-800/70 opacity-60 cursor-not-allowed dark:border-gray-700'}`}
                                                        onClick={() => (editing && canEdit) && ctx.setTagsStr(s => s ? `${s}, ${val}` : val)}
                                                        disabled={!(editing && canEdit)}>
                                                        + {val}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Section>
                                <Section title="Колдонуучунун билдирүүсү">
                                    <div className="text-sm text-gray-700 dark:text-gray-200 flex items-start gap-2">
                                        <Info className="w-4 h-4 mt-0.5 text-gray-400 dark:text-gray-500" />
                                        <span>{c.message || '—'}</span>
                                    </div>
                                </Section>
                            </div>

                            {/* Quick update row */}
                            <Section title="Жаңыртуу">
                                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="min-w-0">
                                        <label className="block text-sm mb-1 flex items-center gap-1">
                                            <CalendarClock className="w-4 h-4" /> {t.contacts.nextFollowUpAt}
                                        </label>
                                        <div className="flex gap-2 items-stretch min-w-0">
                                            <Input type="datetime-local" value={nextFollowUpAt}
                                                onChange={(e) => setNextFollowUpAt(e.target.value)}
                                                className="input h-10 text-sm flex-1 min-w-0 w-full"
                                                disabled={!(editing && canEdit)} aria-label="Кийинки байланыш убактысы" />
                                            {nextFollowUpAt && (
                                                <Button variant="subtle" onClick={() => (editing && canEdit) && setNextFollowUpAt('')}
                                                    title="Такташ" disabled={!(editing && canEdit)}
                                                    className="px-2 py-1 shrink-0 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" size="sm">
                                                    Өчүрүү
                                                </Button>
                                            )}
                                        </div>
                                        {(status === 'ARCHIVED' && outcome === 'DO_NOT_CONTACT') && (
                                            <div className="text-[11px] mt-1 text-amber-700 dark:text-amber-300">DNC: кийинки байланыш коюлбайт.</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1 flex items-center gap-1">
                                            <Flag className="w-4 h-4" /> {t.contacts.priority}
                                        </label>
                                        <Input type="number" min={1} max={5} value={priority}
                                            onChange={(e) => {
                                                const n = Math.max(1, Math.min(5, parseInt(e.target.value || '1', 10)));
                                                setPriority(Number.isFinite(n) ? n : 1);
                                            }}
                                            className="input h-10 text-sm w-full" disabled={!(editing && canEdit)} aria-label="Приоритет" />
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1">Курс (аты)</label>
                                        <Input value={courseName} onChange={(e) => setCourseName(e.target.value)}
                                            placeholder="frontend, backend..." className="input h-10 text-sm w-full"
                                            disabled={!(editing && canEdit)} />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">Курс түрү</label>
                                        <Select value={courseType} onChange={(e) => setCourseType(e.target.value as any)}
                                            className="input h-10 text-sm w-full" disabled={!(editing && canEdit)}>
                                            <option value="">—</option>
                                            <option value="campus">campus</option>
                                            <option value="online">online</option>
                                            <option value="hybrid">hybrid</option>
                                        </Select>
                                    </div>

                                    <div className="md:col-span-2 min-w-0">
                                        <label className="block text-sm mb-1 flex items-center gap-1">
                                            <Tag className="w-4 h-4" /> {t.contacts.tags}
                                        </label>
                                        <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (!(editing && canEdit)) return;
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    ctx.setTagsStr(s => (s.endsWith(',') || s === '' ? s : s + ', '));
                                                }
                                            }}
                                            placeholder="morning, teen" className="input h-10 text-sm w-full min-w-0"
                                            disabled={!(editing && canEdit)} />
                                        {tagsArr.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2 break-words">
                                                {tagsArr.map((tg, i) => (
                                                    <span key={`${tg}-${i}`}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs leading-5 ${editing && canEdit
                                                            ? 'bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
                                                            : 'bg-gray-100 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-300'
                                                            }`}>
                                                        {tg}
                                                        <button type="button"
                                                            className={`hover:text-red-600 ${!(editing && canEdit) && 'opacity-40 cursor-not-allowed'} dark:hover:text-red-400`}
                                                            onClick={() => ctx.removeTag(i)} aria-label="Өчүрүү" disabled={!(editing && canEdit)}>×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {editing && (
                                        <div className="hidden md:flex md:col-span-2 gap-2 justify-end">
                                            <Button variant="ghost" onClick={cancel}><X className="w-4 h-4" /> {t.contacts.cancel}</Button>
                                            <Button variant="primary" disabled={!canSave} onClick={save} loading={saving}>
                                                <Save className="w-4 h-4" /> {saving ? t.contacts.saving : t.contacts.save}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {/* Notes */}
                            <Section title={`Эскертмелер (${noteItems.length})`}>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm mb-1">Жаңы эскертме</label>
                                        <textarea id="noteComposer" value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)} className="input min-h-[80px] text-sm"
                                            placeholder="Лид менен сүйлөштүк, ата-энеси менен кеңешишет..." />
                                        <div className="mt-2 flex justify-end gap-2">
                                            <Button variant="ghost" onClick={() => setNoteText('')} disabled={!noteText.trim()}>Тазалоо</Button>
                                            <Button variant="primary" onClick={addNote} disabled={!noteText.trim()}>Сактоо</Button>
                                        </div>
                                    </div>

                                    <div className="border-t pt-3 dark:border-gray-800">
                                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Акыркы эскертмелер</div>
                                        <ul className="space-y-3">
                                            {noteItems.map(n => (
                                                <li key={n.id} className="p-3 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-800">
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(n.createdAt).toLocaleString()} • {n.author?.fullName ?? 'Белгисиз'}
                                                    </div>
                                                    <div className="mt-1 text-sm whitespace-pre-wrap text-gray-800 dark:text-gray-200">{n.body}</div>
                                                </li>
                                            ))}
                                            {noteItems.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">Азырынча эскертмелер жок</div>}
                                        </ul>
                                    </div>
                                </div>
                            </Section>

                            <DetailsBlock c={c} />
                        </>
                    ) : (
                        <Card>
                            <div className="px-4 pt-4 pb-2 border-b bg-gray-50/60 dark:bg-gray-800/60 dark:border-gray-800 rounded-t-2xl font-medium">Таймлайн</div>
                            <CardBody>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Логдор даяр болгондо бул жерге чыгат.</p>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
            <PaymentModal
                open={!!payOpen}
                kind={payOpen || 'DEPOSIT'}
                onClose={() => setPayOpen(null)}
                onSubmit={handlePaymentSubmit}
                loading={payLoading}
            />
        </div >
    );
}
