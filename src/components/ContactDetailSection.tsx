import React from 'react';
import {
    Mail, Phone, Tag, CalendarClock, Flag, Save, X, ArrowLeft,
    // MoreHorizontal, Send, ArrowRightLeft,
    Pencil, ShieldCheck, Info,
} from 'lucide-react';
import { Card, CardBody, Section } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PrimaryButton, GhostButton, SubtleButton } from '@/components/ui/Button';
import StatusBadge from '@/components/StatusBadge';
import { Tabs } from '@/components/ui/Tabs';
import FollowUpBanner from './FollowUpBanner';
import QuickComms from './QuickComms';
import DetailsBlock from './DetailsBlock';

export type ContactDetailCtx = {
    // basics
    navBack: () => void;
    canEdit: boolean;
    isSalesOrManager: boolean;
    editing: boolean;
    setEditing: (v: boolean) => void;

    // entity & labels
    c: any;
    attempts: number;
    lastUpdateLabel: string;
    lastContactedLabel: string;
    sourceDisplay: string;

    // pipeline
    PIPELINE: string[];
    NEXT_ALLOWED: Record<string, string[]>;
    STATUS_LABELS: Record<string, string>;
    status: string;
    setStatus: (s: string) => void;
    primaryNext?: string;

    // suggestion banners
    suggestNoResponse: boolean;
    suggestLost: boolean;
    setStatusViaBanner: (s: string) => void;

    // tabs
    tab: 'overview' | 'timeline';
    setTab: (k: 'overview' | 'timeline') => void;

    // form
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

    // actions
    canSave: boolean;
    save: () => void | Promise<void>;
    cancel: () => void;
    saving: boolean;
    onOutreach: () => void;
    markContactedNow: () => void;
    markRespondedNow: () => void;
    markNoResponse: () => void;

    // notes
    noteItems: Array<{ id: number; body: string; createdAt: string; author?: { fullName?: string } }>;
    noteText: string;
    setNoteText: (v: string) => void;
    addNote: () => void;

    // i18n
    t: any;
};

export default function ContactDetailSection({ ctx }: { ctx: ContactDetailCtx }) {
    const {
        navBack, canEdit, isSalesOrManager, editing, setEditing,
        c, attempts, lastUpdateLabel, lastContactedLabel, sourceDisplay,
        PIPELINE, NEXT_ALLOWED, STATUS_LABELS, status, setStatus, primaryNext,
        suggestNoResponse, suggestLost, setStatusViaBanner,
        tab, setTab,
        nextFollowUpAt, setNextFollowUpAt, priority, setPriority,
        courseName, setCourseName, courseType, setCourseType,
        tagsStr, setTagsStr, tagsArr, removeTag,
        canSave, save, cancel, saving, onOutreach, markContactedNow, markRespondedNow, markNoResponse,
        noteItems, noteText, setNoteText, addNote,
        t,
    } = ctx;

    return (
        <div className="max-w-6xl w-full min-w-0 mx-auto space-y-5 pb-16 text-gray-900 dark:text-gray-100">
            {/* Sticky top title row */}
            <div
                className="
          flex items-center justify-between rounded-2xl border px-3 py-2
          sticky top-14 md:top-0 z-30
          bg-white border-gray-200
          dark:bg-gray-900 dark:border-gray-800
          overflow-hidden
        "
            >
                <div className="flex items-center gap-3 min-w-0 w-full">
                    <button
                        onClick={navBack}
                        className="btn"
                        title="Артка"
                        aria-label="Артка"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>

                    {/* Avatar chip */}
                    <div
                        className="
              h-9 w-9 md:h-10 md:w-10 rounded-full grid place-items-center font-semibold
              bg-emerald-200 text-emerald-900
              dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-1 dark:ring-emerald-800/50
            "
                    >
                        {c.fullName?.[0] ?? 'U'}
                    </div>

                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-semibold truncate">
                            {c.fullName}{' '}
                            <span className="text-gray-400 dark:text-gray-500 font-mono">#{c.id}</span>
                        </h1>

                        {/* Inline chips with truncation on mobile */}
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
                                <span
                                    className={[
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] md:text-xs',
                                        c.consent
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200'
                                            : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
                                    ].join(' ')}
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {c.consent ? 'Макулдук бар' : 'Макулдук жок'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                    {!editing ? (
                        <GhostButton
                            onClick={() => canEdit && setEditing(true)}
                            disabled={!canEdit}
                            title={!canEdit ? 'Бул бетти өзгөртүү укугуңуз жок' : undefined}
                            className="px-2 py-1 md:px-3"
                        >
                            <Pencil className="w-4 h-4" />
                            <span className="hidden md:inline ml-1">Оңдоо</span>
                        </GhostButton>
                    ) : (
                        <>
                            <GhostButton onClick={cancel} className="px-2 py-1 md:px-3">
                                <X className="w-4 h-4" />
                                <span className="hidden md:inline ml-1">{t.contacts.cancel}</span>
                            </GhostButton>
                            <PrimaryButton onClick={save} disabled={!canSave} className="px-2 py-1 md:px-3">
                                <Save className="w-4 h-4" />
                                <span className="hidden md:inline ml-1">{saving ? t.contacts.saving : t.contacts.save}</span>
                            </PrimaryButton>
                        </>
                    )}
                </div>
            </div>

            {/* Follow-up status banner */}
            <FollowUpBanner next={c.nextFollowUpAt} />

            {(isSalesOrManager && suggestNoResponse) && (
                <div
                    className="
            rounded-xl border p-3 flex items-center justify-between gap-3 shadow-sm
            bg-amber-50/90 border-amber-200 text-amber-900
            dark:bg-amber-900/35 dark:border-amber-800 dark:text-amber-200
          "
                >
                    <div className="text-sm">
                        Бул лидге <b>{attempts}</b> жолу байланыш жасалды, жооп келе элек окшойт.
                        <span className="ml-1">Статусту <b>ЖООП ЖОК</b> кылууну же кийинки байланыш убакытты коюуну сунуштайбыз.</span>
                    </div>
                    <div className="flex gap-2">
                        <GhostButton className="dark:hover:text-amber-50" onClick={() => setStatusViaBanner('NO_RESPONSE')}>
                            Жооп жок
                        </GhostButton>
                        <PrimaryButton onClick={() => canEdit && setEditing(true)} disabled={!canEdit}>
                            Кайра байланыш убактысын коюу
                        </PrimaryButton>
                    </div>
                </div>
            )}

            {(isSalesOrManager && suggestLost) && (
                <div
                    className="
            rounded-xl border p-3 flex items-center justify-between gap-3 shadow-sm
            bg-red-50/90 border-red-200 text-red-800
            dark:bg-red-900/35 dark:border-red-800 dark:text-red-200
          "
                >
                    <div className="text-sm">
                        <b>{attempts}</b> аракеттен кийин да байланыша албай жатабыз.
                        <span className="ml-1">Бул лидди <b>ЖОГОЛДУ</b> катары белгилөөгө убакыт келдиби?</span>
                    </div>
                    <div className="flex gap-2">
                        <GhostButton className="dark:hover:text-red-50" onClick={() => setStatusViaBanner('LOST')}>
                            Жоголду
                        </GhostButton>
                        <PrimaryButton onClick={() => canEdit && setEditing(true)} disabled={!canEdit}>
                            Дагы бир аракет
                        </PrimaryButton>
                    </div>
                </div>
            )}

            {c.status === 'CONTACTED' && (
                <div className="flex items-center gap-2 mt-2">
                    <PrimaryButton disabled={!editing || !canEdit} onClick={markRespondedNow}>
                        Жооп берди
                    </PrimaryButton>
                    <GhostButton
                        disabled={!editing || !canEdit}
                        onClick={markNoResponse}
                        className="dark:hover:text-gray-100"
                    >
                        Жооп жок
                    </GhostButton>
                </div>
            )}

            {noteItems.length > 0 && (
                <div className="rounded-xl border p-3 shadow-sm bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Акыркы эскертме — {new Date(noteItems[0].createdAt).toLocaleString()}
                        {noteItems[0].author?.fullName ? ` • ${noteItems[0].author.fullName}` : ''}
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3">
                        {noteItems[0].body}
                    </div>
                </div>
            )}

            {/* Sub header with tabs + last update (scrollable on mobile) */}
            <div
                className="
    border-b pb-2
    bg-white/70 dark:bg-gray-900/70 backdrop-blur-[2px]
    border-gray-200 dark:border-gray-800 rounded-t-md
    px-2 pt-2
    flex flex-col sm:flex-row sm:items-center sm:justify-between
  "
            >
                {/* Tabs — scrollable horizontally on mobile */}
                <div className="overflow-x-auto no-scrollbar -mx-2 px-2 flex-1">
                    <div className="inline-flex min-w-full sm:min-w-0 whitespace-nowrap">
                        <Tabs
                            value={tab}
                            onChange={(k) => setTab(k as any)}
                            items={[
                                { key: 'overview', label: 'Кыскача' },
                                { key: 'timeline', label: 'Таймлайн' },
                            ]}
                        />
                    </div>
                </div>

                {/* Last update label below on mobile, half-height style */}
                <div
                    className="
      text-[11px] sm:text-xs text-gray-500 dark:text-gray-300
      mt-1 sm:mt-0 sm:ml-3
      leading-tight break-words
      flex-1 sm:flex-none
    "
                >
                    <div className="max-h-[2.5em] overflow-hidden">
                        {lastUpdateLabel}
                    </div>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                {/* Related / Quick Summary */}
                <aside className="hidden lg:block">
                    <div className="sticky top-20">
                        <div className="rounded-2xl border bg-white border-gray-200 p-3 dark:bg-gray-900 dark:border-gray-800">
                            <div className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                                Кыскача маалымат
                            </div>

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
                                    <span className="text-gray-600 dark:text-gray-300">
                                        {Math.max(1, Number(c.priority ?? 1))}
                                    </span>
                                </li>

                                <li className="flex items-center justify-between">
                                    <span className="text-gray-700 dark:text-gray-200">Байланыш аракеттери</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600 dark:text-gray-300">{attempts}</span>
                                        {isSalesOrManager && (
                                            <SubtleButton
                                                title="Жаңы аракет белгилөө"
                                                onClick={onOutreach}
                                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                            >
                                                +1
                                            </SubtleButton>
                                        )}
                                    </div>
                                </li>

                                <li className="pt-1">
                                    <QuickComms
                                        phone={c.phone}
                                        email={c.email}
                                        onOutreach={onOutreach}
                                        onMark={markContactedNow}
                                    />
                                </li>
                            </ul>
                        </div>
                    </div>
                </aside>

                {/* Content */}
                <div className="space-y-6">
                    {tab === 'overview' ? (
                        <>
                            {/* Journey/State + Next status CTA */}
                            <Section title="ЖОЛ КАРТАНЫН АБАЛЫ">
                                <div className="flex items-center justify-between gap-3 mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {PIPELINE.map((s) => {
                                            const isCurrent = s === c.status;
                                            const allowedNext = new Set(NEXT_ALLOWED[c.status] ?? []);
                                            const canGo = canEdit && editing && (isCurrent || allowedNext.has(s));
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    disabled={!canGo}
                                                    onClick={() => canGo && setStatus(s)}
                                                    className={`px-3 py-1 rounded-lg border text-xs md:text-sm ${status === s
                                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                                        : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700'
                                                        } ${!canGo && 'opacity-50 cursor-not-allowed'}`}
                                                    aria-pressed={status === s}
                                                >
                                                    {STATUS_LABELS[s]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {primaryNext && (
                                        <PrimaryButton onClick={() => setStatus(primaryNext)} disabled={!canEdit || !editing}>
                                            Кийинки статус: {STATUS_LABELS[primaryNext]}
                                        </PrimaryButton>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                        <dt className="text-gray-500 dark:text-gray-400">Лид ээси</dt>
                                        <dd className="col-span-2 text-gray-900 dark:text-gray-100">{c.ownerName || '—'}</dd>

                                        <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                                        <dd className="col-span-2 text-gray-900 dark:text-gray-100">{c.email || '—'}</dd>

                                        <dt className="text-gray-500 dark:text-gray-400">Телефон</dt>
                                        <dd className="col-span-2 text-gray-900 dark:text-gray-100">{c.phone || '—'}</dd>

                                        <dt className="text-gray-500 dark:text-gray-400">Лид булагы</dt>
                                        <dd className="col-span-2 text-gray-900 dark:text-gray-100">{sourceDisplay}</dd>

                                        <dt className="text-gray-500 dark:text-gray-400">Курс</dt>
                                        <dd className="col-span-2 text-gray-900 dark:text-gray-100">{c.courseName ? `${c.courseName} (${c.courseType || '—'})` : '—'}</dd>

                                        <dt className="text-gray-500 dark:text-gray-400">Акыркы байланыш</dt>
                                        <dd className="col-span-2 text-gray-900 dark:text-gray-100">{lastContactedLabel}</dd>

                                        <dt className="text-gray-500 dark:text-gray-400">Лид статусу</dt>
                                        <dd className="col-span-2 text-gray-900 dark:text-gray-100">{STATUS_LABELS[c.status]}</dd>
                                    </dl>

                                    {/* Best time card (placeholder) */}
                                    <div className="md:col-span-1">
                                        <div className="rounded-2xl border bg-white shadow-sm dark:bg-gray-900 dark:border-gray-800">
                                            <div className="p-4">
                                                <div className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                                                    Эң ылайыктуу убакыт
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Чалуу — <span className="text-gray-400 dark:text-gray-500">жок</span>
                                                    <br />
                                                    Email — <span className="text-gray-400 dark:text-gray-500">жок</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
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
                                                const val = (c as any)[k];
                                                if (!val) return null;
                                                return (
                                                    <button
                                                        key={k}
                                                        type="button"
                                                        className={`px-2 py-0.5 rounded-full border ${(editing && canEdit)
                                                            ? 'bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                                                            : 'bg-gray-100 dark:bg-gray-800/70 opacity-60 cursor-not-allowed dark:border-gray-700'
                                                            }`}
                                                        onClick={() => (editing && canEdit) && setTagsStr(s => s ? `${s}, ${val}` : val)}
                                                        disabled={!(editing && canEdit)}
                                                    >
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
                                            <Input
                                                type="datetime-local"
                                                value={nextFollowUpAt}
                                                onChange={(e) => setNextFollowUpAt(e.target.value)}
                                                className="input h-10 text-sm flex-1 min-w-0 w-full"
                                                disabled={!(editing && canEdit)}
                                                aria-label="Кийинки байланыш убактысы"
                                            />
                                            {nextFollowUpAt && (
                                                <SubtleButton
                                                    onClick={() => (editing && canEdit) && setNextFollowUpAt('')}
                                                    title="Такташ"
                                                    disabled={!(editing && canEdit)}
                                                    className="px-2 py-1 shrink-0 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                                                >
                                                    Өчүрүү
                                                </SubtleButton>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1 flex items-center gap-1">
                                            <Flag className="w-4 h-4" /> {t.contacts.priority}
                                        </label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={5}
                                            value={priority}
                                            onChange={(e) => {
                                                const n = Math.max(1, Math.min(5, parseInt(e.target.value || '1', 10)));
                                                setPriority(Number.isFinite(n) ? n : 1);
                                            }}
                                            className="input h-10 text-sm w-full"
                                            disabled={!(editing && canEdit)}
                                            aria-label="Приоритет"
                                        />
                                    </div>

                                    {/* Course editing */}
                                    <div>
                                        <label className="block text-sm mb-1">Курс (аты)</label>
                                        <Input
                                            value={courseName}
                                            onChange={(e) => setCourseName(e.target.value)}
                                            placeholder="frontend, backend..."
                                            className="input h-10 text-sm w-full"
                                            disabled={!(editing && canEdit)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1">Курс түрү</label>
                                        <Select
                                            value={courseType}
                                            onChange={(e) => setCourseType(e.target.value as any)}
                                            className="input h-10 text-sm w-full"
                                            disabled={!(editing && canEdit)}
                                        >
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
                                        <Input
                                            value={tagsStr}
                                            onChange={(e) => setTagsStr(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (!(editing && canEdit)) return;
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setTagsStr(s => (s.endsWith(',') || s === '' ? s : s + ', '));
                                                }
                                            }}
                                            placeholder="morning, teen"
                                            className="input h-10 text-sm w-full min-w-0"
                                            disabled={!(editing && canEdit)}
                                        />
                                        {tagsArr.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2 break-words">
                                                {tagsArr.map((tg, i) => (
                                                    <span
                                                        key={`${tg}-${i}`}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs leading-5 ${editing && canEdit
                                                            ? 'bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
                                                            : 'bg-gray-100 dark:bg-gray-800/70 dark:border-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {tg}
                                                        <button
                                                            type="button"
                                                            className={`hover:text-red-600 ${!(editing && canEdit) && 'opacity-40 cursor-not-allowed'} dark:hover:text-red-400`}
                                                            onClick={() => removeTag(i)}
                                                            aria-label="Өчүрүү"
                                                            disabled={!(editing && canEdit)}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom action row (only in edit mode, desktop/tablet) */}
                                    {editing && (
                                        <div className="hidden md:flex md:col-span-2 gap-2 justify-end">
                                            <GhostButton onClick={cancel}><X className="w-4 h-4" /> {t.contacts.cancel}</GhostButton>
                                            <PrimaryButton disabled={!canSave} onClick={save}>
                                                <Save className="w-4 h-4" /> {saving ? t.contacts.saving : t.contacts.save}
                                            </PrimaryButton>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            {/* Append-only notes (history) */}
                            <Section title={`Эскертмелер (${noteItems.length})`}>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm mb-1">Жаңы эскертме</label>
                                        <textarea
                                            id="noteComposer"
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            className="input min-h-[80px] text-sm"
                                            placeholder="Лид менен сүйлөштүк, ата-энеси менен кеңешишет..."
                                        />
                                        <div className="mt-2 flex justify-end gap-2">
                                            <GhostButton onClick={() => setNoteText('')} disabled={!noteText.trim()}>Тазалоо</GhostButton>
                                            <PrimaryButton onClick={addNote} disabled={!noteText.trim()}>Сактоо</PrimaryButton>
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

                            {/* Details */}
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
        </div>
    );
}
