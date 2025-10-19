import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import type { Contact as ContactList } from './ContactsPage';
import { Card, CardBody, Section } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { PrimaryButton, GhostButton, SubtleButton } from '@/components/ui/Button';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import {
    Mail, Phone, Tag, CalendarClock, Flag, Save, X, ArrowLeft,
    MoreHorizontal, Send, Pencil, ArrowRightLeft, ShieldCheck, Info,
} from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';

// ---------- Types ----------
export type Contact = ContactList & {
    notes?: string | null;                // summary (not history)
    nextFollowUpAt?: string | null;
    priority?: number | null;
    tags?: string[] | null;

    // New/updated fields from backend
    assignedToUserId?: number | null;
    consent?: boolean;
    courseName?: string | null;           // e.g. "frontend"
    courseType?: 'campus' | 'online' | 'hybrid' | string | null;
    duplicateOfId?: number | null;
    lastContactedAt?: string | null;
    message?: string | null;
    updatedAt?: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;

    ownerName?: string | null;
};

type NoteItem = {
    id: number;
    body: string;
    createdAt: string;
    author?: { fullName?: string };
};

// ---------- Pipeline & labels ----------
const NEXT_ALLOWED: Record<ContactList['status'], ContactList['status'][]> = {
    NEW: ['CONTACTED', 'LOST'],
    CONTACTED: ['QUALIFIED', 'LOST'],
    QUALIFIED: ['ENROLLED', 'LOST'],
    ENROLLED: ['LOST'],
    LOST: ['NEW'],
};

const PIPELINE: ContactList['status'][] = ['NEW', 'CONTACTED', 'QUALIFIED', 'ENROLLED', 'LOST'];

const STATUS_LABELS: Record<ContactList['status'], string> = {
    NEW: 'ЖАҢЫ',
    CONTACTED: 'БАЙЛАНЫШКАН',
    QUALIFIED: 'КВАЛИФИКАЦИЯЛАНГАН',
    ENROLLED: 'КАТТАЛДЫ',
    LOST: 'ЖОГОЛДУ',
};

// ---------- Time helpers ----------
// <input type="datetime-local"> expects a "local" string like 2025-10-17T08:30
function toLocalInputValue(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Convert the local picker value back to ISO (UTC) without shifting the intended local time
function fromLocalInputValue(local: string): string | null {
    if (!local) return null;
    const [date, time] = local.split('T');
    const [y, m, d] = date.split('-').map(Number);
    const [H, M] = time.split(':').map(Number);
    const asLocal = new Date(y, (m - 1), d, H, M, 0, 0);
    return asLocal.toISOString();
}

// ---------- Tag helpers ----------
function normTags(a: string[]) {
    const set = new Set(a.map(s => s.trim().toLowerCase()).filter(Boolean));
    return Array.from(set).sort();
}
function eqArr(a: string[], b: string[]) {
    const A = normTags(a); const B = normTags(b);
    if (A.length !== B.length) return false;
    for (let i = 0; i < A.length; i++) if (A[i] !== B[i]) return false;
    return true;
}

// ---------- Small util ----------
function openLink(href: string, newTab = false) {
    if (newTab) window.open(href, '_blank', 'noopener,noreferrer');
    else window.location.href = href;
}

// ---------- Follow-up status banner ----------
function FollowUpBanner({ next }: { next?: string | null }) {
    if (!next) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-700">
                Кийинки байланыш дайындала элек. <button className="link ml-2">Дайында</button>
            </div>
        );
    }
    const d = new Date(next);
    const now = new Date();
    const isOverdue = d < now && Math.abs(+now - +d) > 60_000; // 1 min buffer
    const isToday = !isOverdue && d.toDateString() === now.toDateString();

    const style = isOverdue
        ? { bg: 'bg-red-50', br: 'border-red-200', tx: 'text-red-800', label: 'Кийинки байланыш мөөнөтү өтүп кетти:' }
        : isToday
            ? { bg: 'bg-amber-50', br: 'border-amber-200', tx: 'text-amber-800', label: 'Бүгүн байланышуу керек:' }
            : { bg: 'bg-emerald-50', br: 'border-emerald-200', tx: 'text-emerald-800', label: 'Пландалган байланыш:' };

    return (
        <div className={`rounded-xl border ${style.br} ${style.bg} p-3 ${style.tx}`}>
            {style.label} <b>{d.toLocaleString()}</b>
        </div>
    );
}

// ---------- Quick comms ----------
function QuickComms({ phone, email, onMark }: { phone?: string | null; email?: string | null; onMark: () => void }) {
    const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
    return (
        <div className="flex flex-wrap gap-2">
            {phone && (
                <>
                    <GhostButton onClick={() => openLink(`tel:${phone}`)}>Тел</GhostButton>
                    <GhostButton onClick={() => openLink(`https://wa.me/${phoneDigits}`, true)}>WhatsApp</GhostButton>
                    <GhostButton onClick={() => openLink(`sms:${phone}`)}>SMS</GhostButton>
                </>
            )}
            {email && <GhostButton onClick={() => openLink(`mailto:${email}`)}>Email</GhostButton>}
            <SubtleButton onClick={onMark}>“Акыркы байланыш — азыр”</SubtleButton>
        </div>
    );
}

// ---------- Main ----------
export default function ContactDetailPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const toast = useToast();

    const [tab, setTab] = useState<'overview' | 'timeline'>('overview');

    const [c, setC] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // form state (summary + fields)
    const [status, setStatus] = useState<Contact['status']>('NEW');
    const [nextFollowUpAt, setNextFollowUpAt] = useState<string>('');
    const [priority, setPriority] = useState<number>(1);
    const [tagsStr, setTagsStr] = useState<string>('');
    const tagsArr = useMemo(
        () => tagsStr.split(',').map(s => s.trim()).filter(Boolean),
        [tagsStr]
    );

    // append-only notes (history)
    const [noteText, setNoteText] = useState('');
    const [noteItems, setNoteItems] = useState<NoteItem[]>([]);

    const toKgError = (err: any): string => {
        const msg = err?.response?.data?.message || err?.message;
        return typeof msg === 'string' ? msg : 'Белгисиз ката кетти.';
    };

    const load = useCallback(async () => {
        if (!id) return;
        const ac = new AbortController();
        setLoading(true);
        try {
            const { data } = await api.get<Contact>(`/contacts/${id}`, { signal: ac.signal as any });
            setC(data);
            setStatus(data.status);
            setPriority(Math.max(1, Number(data.priority ?? 1)));
            setNextFollowUpAt(toLocalInputValue(data.nextFollowUpAt));
            setTagsStr((data.tags ?? []).join(', '));
        } catch (e) {
            // optional: show toast
            toast.push({ title: 'Ката', message: toKgError(e), variant: 'error' });
        } finally {
            setLoading(false);
        }
        return () => ac.abort();
    }, [id]);

    // GET /contacts/:id/notes
    const loadNotes = useCallback(async (contactId: number) => {
        const ac = new AbortController();
        try {
            const { data } = await api.get(`/contacts/${contactId}/notes`, { params: { limit: 20 }, signal: ac.signal as any });
            setNoteItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e) {
            // optional: show toast
            toast.push({ title: 'Ката', message: toKgError(e), variant: 'error' });
        }
        return () => ac.abort();
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (c?.id) void loadNotes(c.id);
    }, [c?.id, loadNotes]);

    // Compute dirty state to enable/disable Save
    const isDirty = useMemo(() => {
        if (!c) return false;
        const baseNext = toLocalInputValue(c.nextFollowUpAt);
        const baseTags = (c.tags ?? []).slice().map(s => s.trim()).filter(Boolean);
        return (
            status !== c.status ||
            priority !== Math.max(1, Number(c.priority ?? 1)) ||
            nextFollowUpAt !== baseNext ||
            !eqArr(tagsArr, baseTags)
        );
    }, [c, status, priority, nextFollowUpAt, tagsArr]);

    const canSave = (isDirty || !!noteText.trim()) && !saving;

    // POST /contacts/:id/notes
    const addNote = useCallback(async () => {
        if (!noteText.trim() || !c) return;
        const body = noteText.trim();

        // optimistic UI
        const tempId = Math.random();
        const optimistic: NoteItem = { id: tempId, body, createdAt: new Date().toISOString(), author: { fullName: 'Сиз' } };
        setNoteItems(prev => [optimistic, ...prev]);
        setNoteText('');

        try {
            const { data } = await api.post(`/contacts/${c.id}/notes`, { body });
            if (data && data.id) {
                setNoteItems(prev => [data, ...prev.filter(n => n.id !== tempId)]);
            } else {
                await loadNotes(c.id);
            }
        } catch (err) {
            setNoteItems(prev => prev.filter(n => n.id !== tempId));
            toast.push({ title: 'Ката', message: toKgError(err), variant: 'error' });
        }
    }, [c, noteText, loadNotes, toast]);

    // PATCH save
    const save = useCallback(async () => {
        if (!c) return;
        setSaving(true);
        try {
            const payload: any = {};
            // Patch only changed fields (also allow clearing)
            if (status !== c.status) payload.status = status;
            if (priority !== Math.max(1, Number(c.priority ?? 1))) payload.priority = priority;

            const baseNext = toLocalInputValue(c.nextFollowUpAt);
            if (nextFollowUpAt !== baseNext) {
                payload.nextFollowUpAt = fromLocalInputValue(nextFollowUpAt); // null allowed
            }

            const baseTags = (c.tags ?? []).slice().map(s => s.trim()).filter(Boolean);
            if (!eqArr(tagsArr, baseTags)) payload.tags = tagsArr;

            // 1) Save contact (only if something changed)
            if (Object.keys(payload).length > 0) {
                await api.patch(`/contacts/${c.id}`, payload);
            }

            // 2) Append new note (history) if composer has text
            const pendingNote = noteText.trim();
            if (pendingNote) {
                try {
                    await api.post(`/contacts/${c.id}/notes`, { body: pendingNote });
                    setNoteText('');
                } catch (err) {
                    toast.push({ title: 'Эскертме сакталган жок', message: 'Калган өзгөртүүлөр сакталды.', variant: 'error' });
                }
            }

            // 3) Reload both
            await load();
            if (c.id) await loadNotes(c.id);

            toast.push({ title: 'OK', message: t.contacts.updateOk });
        } catch (err) {
            toast.push({ title: 'Ката', message: t.contacts.updateFail || toKgError(err), variant: 'error' });
        } finally {
            setSaving(false);
        }
    }, [c, status, priority, nextFollowUpAt, tagsArr, noteText, load, loadNotes, toast]);

    // Mark contacted now (quick action)
    const markContactedNow = useCallback(async () => {
        if (!c) return;
        try {
            await api.patch(`/contacts/${c.id}`, { lastContactedAt: new Date().toISOString() });
            await load();
            toast.push({ title: 'OK', message: 'Акыркы байланыш — жаңыртылды.', variant: 'success' });
        } catch (err) {
            toast.push({ title: 'Ката', message: toKgError(err), variant: 'error' });
        }
    }, [c, load, toast]);

    // Keyboard shortcut: ⌘/Ctrl + S
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const mod = navigator.platform.includes('Mac') ? e.metaKey : e.ctrlKey;
            if (mod && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (canSave) void save();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canSave, save]);

    // UI helpers
    function removeTag(i: number) {
        const arr = tagsArr.slice(); arr.splice(i, 1); setTagsStr(arr.join(', '));
    }

    if (loading) return <div className="text-sm text-gray-500">Жүктөлүүдө...</div>;
    if (!c) return <div>{t.contacts.empty}</div>;

    const allowed = NEXT_ALLOWED[c.status] ?? [];
    const lastUpdateLabel = `Акыркы жаңыртуу: ${new Date(c.updatedAt || c.createdAt).toLocaleString()}`;
    const lastContactedLabel = c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleString() : '—';
    const primaryNext = allowed[0];

    return (
        <div className="max-w-6xl mx-auto space-y-5 pb-16">
            {/* Top title row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => nav(-1)} className="btn" title="Артка">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="h-10 w-10 rounded-full bg-emerald-200 grid place-items-center text-emerald-900 font-semibold">
                        {c.fullName?.[0] ?? 'U'}
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-semibold truncate">
                            {c.fullName} <span className="text-gray-400 font-mono">#{c.id}</span>
                        </h1>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                            {c.email && (<span className="inline-flex items-center gap-1"><Mail className="w-4 h-4" /> {c.email}</span>)}
                            {c.phone && (<span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" /> {c.phone}</span>)}
                            <StatusBadge status={c.status} />
                            {typeof c.consent === 'boolean' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${c.consent ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {c.consent ? 'Макулдук бар' : 'Макулдук жок'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <GhostButton><Send className="w-4 h-4" /> Кат жөнөтүү</GhostButton>
                    <GhostButton><ArrowRightLeft className="w-4 h-4" /> Конвертациялоо</GhostButton>
                    <GhostButton><Pencil className="w-4 h-4" /> Оңдоо</GhostButton>
                    <GhostButton><MoreHorizontal className="w-4 h-4" /></GhostButton>
                </div>
            </div>

            {/* Follow-up status banner */}
            <FollowUpBanner next={c.nextFollowUpAt} />

            {noteItems.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="text-xs text-gray-500 mb-1">
                        Акыркы эскертме — {new Date(noteItems[0].createdAt).toLocaleString()}
                        {noteItems[0].author?.fullName ? ` • ${noteItems[0].author.fullName}` : ''}
                    </div>
                    <div className="text-sm text-gray-800 line-clamp-3">{noteItems[0].body}</div>
                </div>
            )}

            {/* Sub header with tabs + last update */}
            <div className="flex items-center justify-between border-b pb-2">
                <Tabs value={tab} onChange={(k) => setTab(k as any)} items={[{ key: 'overview', label: 'Кыскача' }, { key: 'timeline', label: 'Таймлайн' }]} />
                <div className="text-xs text-gray-500">{lastUpdateLabel}</div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                {/* Related / Quick Summary */}
                <aside className="hidden lg:block">
                    <div className="sticky top-20 space-y-2 text-sm">
                        <div className="font-medium text-gray-700 mb-2">Кыскача маалымат</div>
                        <ul className="space-y-1">
                            <li className="flex items-center justify-between"><span>Лид ээси</span><span className="text-gray-600">{c.ownerName || '—'}</span></li>
                            <li className="flex items-center justify-between"><span>Булагы</span><span className="text-gray-600">{c.source || '—'}</span></li>
                            <li className="flex items-center justify-between"><span>Акыркы байланыш</span><span className="text-gray-600">{lastContactedLabel}</span></li>
                            <li className="flex items-center justify-between"><span>Кийинки байланыш</span><span className="text-gray-600">{c.nextFollowUpAt ? new Date(c.nextFollowUpAt).toLocaleString() : '—'}</span></li>
                            <li className="flex items-center justify-between"><span>Приоритет</span><span className="text-gray-600">{Math.max(1, Number(c.priority ?? 1))}</span></li>
                            <li><QuickComms phone={c.phone} email={c.email} onMark={markContactedNow} /></li>
                        </ul>
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
                                            const canGo = isCurrent || allowedNext.has(s);
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    disabled={!canGo}
                                                    onClick={() => canGo && setStatus(s)}
                                                    className={`px-3 py-1 rounded-lg border text-xs md:text-sm
                            ${status === s ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white hover:bg-gray-50'}
                            ${!canGo && 'opacity-50 cursor-not-allowed'}`}
                                                >
                                                    {STATUS_LABELS[s]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {primaryNext && (
                                        <PrimaryButton onClick={() => setStatus(primaryNext as Contact['status'])}>
                                            Кийинки статус: {STATUS_LABELS[primaryNext]}
                                        </PrimaryButton>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                        <dt className="text-gray-500">Лид ээси</dt>
                                        <dd className="col-span-2">{c.ownerName || '—'}</dd>

                                        <dt className="text-gray-500">Email</dt>
                                        <dd className="col-span-2">{c.email || '—'}</dd>

                                        <dt className="text-gray-500">Телефон</dt>
                                        <dd className="col-span-2">{c.phone || '—'}</dd>

                                        <dt className="text-gray-500">Лид булагы</dt>
                                        <dd className="col-span-2">{c.source || '—'}</dd>

                                        <dt className="text-gray-500">Курс</dt>
                                        <dd className="col-span-2">{c.courseName ? `${c.courseName} (${c.courseType || '—'})` : '—'}</dd>

                                        <dt className="text-gray-500">Акыркы байланыш</dt>
                                        <dd className="col-span-2">{lastContactedLabel}</dd>

                                        <dt className="text-gray-500">Лид статусу</dt>
                                        <dd className="col-span-2">{STATUS_LABELS[c.status]}</dd>
                                    </dl>

                                    {/* Best time card (placeholder) */}
                                    <div className="md:col-span-1">
                                        <div className="card bg-white border rounded-2xl">
                                            <div className="card-body">
                                                <div className="font-medium mb-2">Эң ылайыктуу убакыт</div>
                                                <div className="text-sm text-gray-500">
                                                    Чалуу — <span className="text-gray-400">жок</span><br />
                                                    Email — <span className="text-gray-400">жок</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* UTM + Message */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <Section title="Канал маалыматтары (UTM)">
                                    <div className="text-sm text-gray-700 space-y-1">
                                        <div><span className="text-gray-500">utm_source: </span>{c.utmSource || '—'}</div>
                                        <div><span className="text-gray-500">utm_medium: </span>{c.utmMedium || '—'}</div>
                                        <div><span className="text-gray-500">utm_campaign: </span>{c.utmCampaign || '—'}</div>
                                        {/* Suggest turning UTM into tags */}
                                        <div className="mt-2 text-xs text-gray-500">
                                            UTMден тег кошуу: {' '}
                                            {['utmSource', 'utmMedium', 'utmCampaign'].map((k) => {
                                                const val = (c as any)[k];
                                                if (!val) return null;
                                                return (
                                                    <button
                                                        key={k}
                                                        type="button"
                                                        className="px-2 py-0.5 rounded-full border bg-gray-50 mr-1"
                                                        onClick={() => setTagsStr(s => s ? `${s}, ${val}` : val)}
                                                    >
                                                        + {val}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </Section>
                                <Section title="Колдонуучунун билдирүүсү">
                                    <div className="text-sm text-gray-700 flex items-start gap-2">
                                        <Info className="w-4 h-4 mt-0.5 text-gray-400" />
                                        <span>{c.message || '—'}</span>
                                    </div>
                                </Section>
                            </div>

                            {/* Quick update row */}
                            <Section title="Жаңыртуу">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm mb-1 flex items-center gap-1"><CalendarClock className="w-4 h-4" /> {t.contacts.nextFollowUpAt}</label>
                                        <div className="flex gap-2">
                                            <Input type="datetime-local" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} className="h-10 text-sm flex-1" />
                                            {nextFollowUpAt && (
                                                <SubtleButton onClick={() => setNextFollowUpAt('')} title="Такташ">Өчүрүү</SubtleButton>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1 flex items-center gap-1"><Flag className="w-4 h-4" /> {t.contacts.priority}</label>
                                        <Input
                                            type="number"
                                            min={1}
                                            max={5}
                                            value={priority}
                                            onChange={(e) => {
                                                const n = Math.max(1, Math.min(5, parseInt(e.target.value || '1', 10)));
                                                setPriority(Number.isFinite(n) ? n : 1);
                                            }}
                                            className="h-10 text-sm"
                                        />
                                        {priority < 1 && <div className="text-xs text-red-600 mt-1">Минималдуу 1</div>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm mb-1 flex items-center gap-1"><Tag className="w-4 h-4" /> {t.contacts.tags}</label>
                                        <Input
                                            value={tagsStr}
                                            onChange={(e) => setTagsStr(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    setTagsStr(s => (s.endsWith(',') || s === '' ? s : s + ', '));
                                                }
                                            }}
                                            placeholder="morning, teen"
                                            className="h-10 text-sm"
                                        />
                                        {tagsArr.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {tagsArr.map((tg, i) => (
                                                    <span key={`${tg}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-gray-50 text-xs leading-5">
                                                        {tg}
                                                        <button type="button" className="hover:text-red-600" onClick={() => removeTag(i)} aria-label="Өчүрүү">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 flex gap-2 justify-end">
                                        <GhostButton onClick={() => nav('/contacts')}><X className="w-4 h-4" /> {t.contacts.cancel}</GhostButton>
                                        <PrimaryButton disabled={!canSave} onClick={save}>
                                            <Save className="w-4 h-4" /> {saving ? t.contacts.saving : t.contacts.save}
                                        </PrimaryButton>
                                    </div>
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

                                    <div className="border-t pt-3">
                                        <div className="text-sm text-gray-600 mb-2">Акыркы эскертмелер</div>
                                        <ul className="space-y-3">
                                            {noteItems.map(n => (
                                                <li key={n.id} className="p-3 rounded-xl border bg-white">
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(n.createdAt).toLocaleString()} • {n.author?.fullName ?? 'Белгисиз'}
                                                    </div>
                                                    <div className="mt-1 text-sm whitespace-pre-wrap">{n.body}</div>
                                                </li>
                                            ))}
                                            {noteItems.length === 0 && <div className="text-sm text-gray-500">Азырынча эскертмелер жок</div>}
                                        </ul>
                                    </div>
                                </div>
                            </Section>

                            {/* Details */}
                            <DetailsBlock c={c} />
                        </>
                    ) : (
                        <Card>
                            <div className="px-4 pt-4 pb-2 border-b bg-gray-50/60 rounded-t-2xl font-medium">Таймлайн</div>
                            <CardBody>
                                {/* Later: merge notes + status history */}
                                <p className="text-sm text-gray-500">Логдор даяр болгондо бул жерге чыгат.</p>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

// ---------- Details block ----------
function DetailsBlock({ c }: { c: Contact }) {
    const [open, setOpen] = useState(true);
    return (
        <div className="card">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b bg-gray-50/60 rounded-t-2xl">
                <div className="font-medium">Кеңири маалымат</div>
                <button className="btn btn-ghost" onClick={() => setOpen((v) => !v)}>{open ? 'Жашыруу' : 'Көрсөтүү'}</button>
            </div>
            {open && (
                <CardBody>
                    <div className="grid md:grid-cols-2 gap-8 text-sm">
                        <dl className="grid grid-cols-2 gap-y-2 gap-x-8">
                            <dt className="text-gray-500">Lead Owner</dt>
                            <dd>{c.ownerName || '—'}</dd>

                            <dt className="text-gray-500">Assigned To (ID)</dt>
                            <dd>{c.assignedToUserId ?? '—'}</dd>

                            <dt className="text-gray-500">Duplicate Of</dt>
                            <dd>{c.duplicateOfId ?? '—'}</dd>

                            <dt className="text-gray-500">Email</dt>
                            <dd>{c.email || '—'}</dd>

                            <dt className="text-gray-500">Lead Status</dt>
                            <dd>{STATUS_LABELS[c.status]}</dd>

                            <dt className="text-gray-500">Created At</dt>
                            <dd>{new Date(c.createdAt).toLocaleString()}</dd>

                            <dt className="text-gray-500">Updated At</dt>
                            <dd>{new Date(c.updatedAt || c.createdAt).toLocaleString()}</dd>
                        </dl>

                        <dl className="grid grid-cols-2 gap-y-2 gap-x-8">
                            <dt className="text-gray-500">Phone</dt>
                            <dd>{c.phone || '—'}</dd>

                            <dt className="text-gray-500">Industry</dt>
                            <dd>—</dd>

                            <dt className="text-gray-500">Course</dt>
                            <dd>{c.courseName ? `${c.courseName} (${c.courseType || '—'})` : '—'}</dd>

                            <dt className="text-gray-500">Modified By</dt>
                            <dd>—</dd>

                            <dt className="text-gray-500">Referrer</dt>
                            <dd>{c.utmSource || '—'}</dd>
                        </dl>
                    </div>
                </CardBody>
            )}
        </div>
    );
}
