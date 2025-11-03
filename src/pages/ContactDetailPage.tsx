import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import { useToast } from '@/components/ui/Toast';
import { currentUser } from '@/lib/auth';

import ContactDetailSection, { ContactDetailCtx } from '@/components/contacts/ContactDetailSection';
import type { Contact as ContactList } from './ContactsPage';
import { NEXT_ALLOWED, PIPELINE, STATUS_LABELS, type S } from '@/lib/status';
import type { Outcome } from '@/components/OutcomeSelect';

// ---------- Types ----------
export type Contact = ContactList & {
    notes?: string | null;
    nextFollowUpAt?: string | null;
    priority?: number | null;
    tags?: string[] | null;
    consent?: boolean;
    courseName?: string | null;
    courseType?: 'campus' | 'online' | 'hybrid' | string | null;
    duplicateOfId?: number | null;
    lastContactedAt?: string | null;
    message?: string | null;
    updatedAt?: string;
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
    sourceProvider?: string | null;
    contactAttempts?: number | null;
    lastAttemptAt?: string | null;
    ownerName?: string | null;
    outcome?: Outcome | null;
    outcomeDetail?: string | null;
};

type NoteItem = { id: number; body: string; createdAt: string; author?: { fullName?: string } };

// ---------- Time helpers ----------
function toLocalInputValue(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
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

// ---------- Page ----------
export default function ContactDetailPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const toast = useToast();

    const me = currentUser();
    const role = me?.role as 'sales' | 'assistant' | 'manager' | 'admin' | 'superadmin' | undefined;
    const canEdit = role === 'sales' || role === 'manager' || role === 'admin' || role === 'superadmin';
    const isSalesOrManager = role === 'sales' || role === 'manager';

    const [tab, setTab] = useState<'overview' | 'timeline'>('overview');
    const [editing, setEditing] = useState(false);

    const [c, setC] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // form state
    const [status, setStatus] = useState<S>('NEW');
    const [nextFollowUpAt, setNextFollowUpAt] = useState<string>('');
    const [priority, setPriority] = useState<number>(1);
    const [tagsStr, setTagsStr] = useState<string>('');
    const tagsArr = useMemo(() => tagsStr.split(',').map(s => s.trim()).filter(Boolean), [tagsStr]);
    const [fullName, setFullName] = useState<string>('');

    // course
    const [courseName, setCourseName] = useState<string>('');
    const [courseType, setCourseType] = useState<'' | 'campus' | 'online' | 'hybrid'>('');

    // outcomes
    const [outcome, setOutcome] = useState<Outcome | undefined>(undefined);
    const [outcomeDetail, setOutcomeDetail] = useState('');

    // notes
    const [noteText, setNoteText] = useState('');
    const [noteItems, setNoteItems] = useState<NoteItem[]>([]);

    const toKgError = (err: any): string => {
        const msg = err?.response?.data?.message || err?.message;
        return typeof msg === 'string' ? msg : 'Белгисиз ката кетти.';
    };

    const hydrateFormFrom = (data: Contact) => {
        setFullName((data.fullName ?? '') as string);
        setStatus(data.status as S);
        setPriority(Math.max(1, Number(data.priority ?? 1)));
        setNextFollowUpAt(toLocalInputValue(data.nextFollowUpAt));
        setTagsStr((data.tags ?? []).join(', '));
        setCourseName((data.courseName ?? '') as string);
        setCourseType(((data.courseType as any) ?? '') as any);
        setOutcome((data.outcome ?? undefined) as any);
        setOutcomeDetail((data.outcomeDetail ?? '') as string);
    };

    const load = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data } = await api.get<Contact>(`/contacts/${id}`);
            setC(data);
            hydrateFormFrom(data);
        } catch (e) {
            toast.push({ title: 'Ката', message: toKgError(e), variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    const loadNotes = useCallback(async (contactId: number) => {
        try {
            const { data } = await api.get(`/contacts/${contactId}/notes`, { params: { limit: 20 } });
            setNoteItems(Array.isArray(data?.items) ? data.items : []);
        } catch (e) {
            toast.push({ title: 'Ката', message: toKgError(e), variant: 'error' });
        }
    }, [toast]);

    useEffect(() => { void load(); }, [load]);
    useEffect(() => { if (c?.id) void loadNotes(c.id); }, [c?.id, loadNotes]);

    // Reset outcome when status changes to a non-outcome status
    useEffect(() => {
        if (!['UNQUALIFIED', 'LOST', 'ARCHIVED'].includes(status)) {
            setOutcome(undefined);
            setOutcomeDetail('');
        }
    }, [status]);

    const isDirty = useMemo(() => {
        if (!c) return false;
        const baseNext = toLocalInputValue(c.nextFollowUpAt);
        const baseTags = (c.tags ?? []).slice().map(s => s.trim()).filter(Boolean);
        const baseCourseName = c.courseName ?? '';
        const baseCourseType = (c.courseType ?? '') as string;
        const needsOutcome = ['UNQUALIFIED', 'LOST', 'ARCHIVED'].includes(status);
        return (
            fullName !== (c.fullName ?? '') || status !== c.status ||
            priority !== Math.max(1, Number(c.priority ?? 1)) ||
            nextFollowUpAt !== baseNext ||
            !eqArr(tagsArr, baseTags) ||
            courseName !== baseCourseName ||
            (courseType || '') !== (baseCourseType || '') ||
            (needsOutcome && (outcome !== (c.outcome ?? undefined) || (outcomeDetail ?? '') !== (c.outcomeDetail ?? '')))
        );
    }, [c, fullName, status, priority, nextFollowUpAt, tagsArr, courseName, courseType, outcome, outcomeDetail]);

    const canSave = canEdit && editing && (isDirty || !!noteText.trim()) && !!fullName.trim() && !saving;

    const addNote = useCallback(async () => {
        if (!noteText.trim() || !c) return;
        const body = noteText.trim();
        const tempId = Math.random();
        const optimistic: NoteItem = { id: tempId, body, createdAt: new Date().toISOString(), author: { fullName: 'Сиз' } };
        setNoteItems(prev => [optimistic, ...prev]);
        setNoteText('');
        try {
            const { data } = await api.post(`/contacts/${c.id}/notes`, { body });
            if (data && data.id) setNoteItems(prev => [data, ...prev.filter(n => n.id !== tempId)]);
            else await loadNotes(c.id);
        } catch (err) {
            setNoteItems(prev => prev.filter(n => n.id !== tempId));
            toast.push({ title: 'Ката', message: toKgError(err), variant: 'error' });
        }
    }, [c, noteText, loadNotes, toast]);

    const save = useCallback(async () => {
        if (!c || !canEdit) return;
        setSaving(true);
        try {
            const payload: any = {};
            const trimmedName = fullName.trim().replace(/\s+/g, ' ');
            if (trimmedName !== (c.fullName ?? '')) {
                if (!trimmedName) {
                    toast.push({ title: 'Ката', message: 'Ат-жөнү бош болбошу керек.', variant: 'error' });
                    setSaving(false);
                    return;
                }
                payload.fullName = trimmedName;
            }
            if (status !== c.status) payload.status = status;
            if (priority !== Math.max(1, Number(c.priority ?? 1))) payload.priority = priority;

            const baseNext = toLocalInputValue(c.nextFollowUpAt);
            if (nextFollowUpAt !== baseNext) payload.nextFollowUpAt = fromLocalInputValue(nextFollowUpAt);

            const baseTags = (c.tags ?? []).slice().map(s => s.trim()).filter(Boolean);
            if (!eqArr(tagsArr, baseTags)) payload.tags = tagsArr;

            const baseCourseName = c.courseName ?? '';
            const baseCourseType = (c.courseType ?? '') as string;
            if (courseName !== baseCourseName) payload.courseName = courseName.trim() ? courseName.trim() : null;
            if ((courseType || '') !== (baseCourseType || '')) payload.courseType = courseType || null;

            // Outcomes when required
            const needsOutcome = ['UNQUALIFIED', 'LOST', 'ARCHIVED'].includes(status);
            if (needsOutcome) {
                if (!outcome) {
                    toast.push({ title: 'Ката', message: 'Жыйынтыкты тандаңыз.', variant: 'error' });
                    setSaving(false); return;
                }
                payload.outcome = outcome;
                if (outcomeDetail.trim()) payload.outcomeDetail = outcomeDetail.trim();
                if (status === 'ARCHIVED' && outcome === 'DO_NOT_CONTACT') payload.nextFollowUpAt = null;
            }

            if (Object.keys(payload).length > 0) await api.patch(`/contacts/${c.id}`, payload);

            // Note (append-only)
            const pendingNote = noteText.trim();
            if (pendingNote) {
                try { await api.post(`/contacts/${c.id}/notes`, { body: pendingNote }); setNoteText(''); }
                catch { toast.push({ title: 'Эскертме сакталган жок', message: 'Калган өзгөртүүлөр сакталды.', variant: 'error' }); }
            }

            await load();
            if (c.id) await loadNotes(c.id);
            setEditing(false);
            toast.push({ title: 'OK', message: t.contacts.updateOk });
        } catch (err) {
            toast.push({ title: 'Ката', message: t.contacts.updateFail || toKgError(err), variant: 'error' });
        } finally {
            setSaving(false);
        }
    }, [c, canEdit, fullName, status, priority, nextFollowUpAt, tagsArr, noteText, load, loadNotes, toast, courseName, courseType, outcome, outcomeDetail]);

    const cancel = useCallback(() => {
        if (!c) return;
        hydrateFormFrom(c);
        setEditing(false);
    }, [c]);

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

    const markRespondedNow = useCallback(async () => {
        if (!c) return;
        try {
            await api.patch(`/contacts/${c.id}`, { status: 'RESPONDED', lastContactedAt: new Date().toISOString() });
            await load();
            toast.push({ title: 'OK', message: 'Жооп белгиленди.', variant: 'success' });
        } catch (err) {
            toast.push({ title: 'Ката', message: toKgError(err), variant: 'error' });
        }
    }, [c, load, toast]);

    const markNoResponse = useCallback(async () => {
        if (!c) return;
        try {
            await api.patch(`/contacts/${c.id}`, { status: 'NO_RESPONSE' });
            await load();
            toast.push({ title: 'OK', message: 'Жооп жок катары белгиленди.', variant: 'success' });
        } catch (err) {
            toast.push({ title: 'Ката', message: toKgError(err), variant: 'error' });
        }
    }, [c, load, toast]);

    const onOutreach = useCallback(async () => {
        if (!c) return;
        try {
            await api.patch(`/contacts/${c.id}`, { outreach: true });
            await load();
            toast.push({
                title: 'OK',
                message: isSalesOrManager ? 'Байланыш белгиленди. Кийинки убакытты коюңуз.' : 'Байланыш белгиленди.',
                variant: 'success',
            });
        } catch (err) {
            toast.push({ title: 'Ката', message: toKgError(err), variant: 'error' });
        }
    }, [c, load, toast, isSalesOrManager]);

    const attempts = Math.max(0, Number(c?.contactAttempts ?? 0));
    const suggestNoResponse = (c?.status === 'CONTACTED' && attempts >= 2);
    const suggestLost = ((c?.status === 'CONTACTED' || c?.status === 'NO_RESPONSE') && attempts >= 4);

    const setStatusViaBanner = (s: string) => {
        if (!canEdit) return;
        if (!editing) setEditing(true);
        setStatus(s as S);
    };

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

    function removeTag(i: number) {
        if (!editing || !canEdit) return;
        const arr = tagsArr.slice(); arr.splice(i, 1); setTagsStr(arr.join(', '));
    }

    if (loading) return <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-gray-500 dark:text-gray-400">Жүктөлүүдө...</div>;
    if (!c) return <div className="max-w-6xl mx-auto px-4 py-10 text-gray-700 dark:text-gray-200">{t.contacts.empty}</div>;

    const allowed = NEXT_ALLOWED[c.status] ?? [];
    const lastUpdateLabel = `Акыркы жаңыртуу: ${new Date(c.updatedAt || c.createdAt).toLocaleString()}`;
    const lastContactedLabel = c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleString() : '—';
    const primaryNext = allowed[0] as S | undefined;
    const sourceDisplay = c.sourceProvider ? `${c.source || '—'} · ${c.sourceProvider}` : (c.source || '—');

    const ctx: ContactDetailCtx = {
        navBack: () => nav(-1),
        canEdit, isSalesOrManager, editing, setEditing,
        c, attempts, lastUpdateLabel, lastContactedLabel, sourceDisplay,
        status, setStatus, primaryNext,
        outcome, setOutcome, outcomeDetail, setOutcomeDetail,
        suggestNoResponse, suggestLost, setStatusViaBanner,
        tab, setTab,
        nextFollowUpAt, setNextFollowUpAt,
        priority, setPriority,
        courseName, setCourseName,
        courseType, setCourseType,
        tagsStr, setTagsStr, tagsArr, removeTag,
        canSave, save, cancel, saving,
        onOutreach, markContactedNow, markRespondedNow, markNoResponse,
        noteItems, noteText, setNoteText, addNote,
        fullName, setFullName,
        t,
        reload: load,
    };

    return (
        <div className="max-w-6xl w-full mx-auto flex-1 min-w-0 shrink-0 space-y-5 pb-16 lg:px-4 text-gray-900 dark:text-gray-100">
            <ContactDetailSection ctx={ctx} />
        </div>
    );
}
