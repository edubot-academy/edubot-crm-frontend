import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import type { Contact as ContactList } from './ContactsPage';
import { Card, CardBody, CardHeader, Section } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { PrimaryButton, GhostButton, SubtleButton } from '@/components/ui/Button';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { Mail, Phone, Tag, CalendarClock, Flag, Save, X, ArrowLeft, Clock } from 'lucide-react';
import { Tabs } from '@/components/ui/Tabs';

// Extend list Contact with detail fields
export type Contact = ContactList & {
    notes?: string | null;
    nextFollowUpAt?: string | null;
    priority?: number | null;
    tags?: string[] | null;
    ownerName?: string | null;
};

const NEXT_ALLOWED: Record<ContactList['status'], ContactList['status'][]> = {
    NEW: ['CONTACTED', 'LOST'],
    CONTACTED: ['QUALIFIED', 'LOST'],
    QUALIFIED: ['ENROLLED', 'LOST'],
    ENROLLED: ['LOST'],
    LOST: ['NEW'],
};

const STATUS_LABELS: Record<ContactList['status'], string> = {
    NEW: 'ЖАҢЫ',
    CONTACTED: 'БАЙЛАНЫШКАН',
    QUALIFIED: 'КВАЛИФИКАЦИЯЛАНГАН',
    ENROLLED: 'КАТТАЛДЫ',
    LOST: 'ЖОГОЛДУ',
};

function toLocalInputValue(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContactDetailPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const toast = useToast();

    const [tab, setTab] = useState<'overview' | 'timeline'>('overview');

    const [c, setC] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // form state
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<Contact['status']>('NEW');
    const [nextFollowUpAt, setNextFollowUpAt] = useState<string>('');
    const [priority, setPriority] = useState<number>(1);
    const [tagsStr, setTagsStr] = useState<string>('');
    const tagsArr = useMemo(() => tagsStr.split(',').map(s => s.trim()).filter(Boolean), [tagsStr]);

    async function load() {
        setLoading(true);
        try {
            const { data } = await api.get<Contact>(`/contacts/${id}`);
            setC(data);
            setStatus(data.status);
            setNotes(data.notes ?? '');
            setPriority(Number(data.priority ?? 1));
            setNextFollowUpAt(toLocalInputValue(data.nextFollowUpAt));
            setTagsStr((data.tags ?? []).join(', '));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

    async function save() {
        setSaving(true);
        try {
            const payload: any = { status, notes, priority };
            if (nextFollowUpAt) payload.nextFollowUpAt = new Date(nextFollowUpAt).toISOString();
            if (tagsArr.length) payload.tags = tagsArr;
            await api.patch(`/contacts/${id}`, payload);
            await load(); // reflect server truth
            toast.push({ title: 'OK', message: t.contacts.updateOk });
        } catch {
            toast.push({ title: 'Ката', message: t.contacts.updateFail });
        } finally { setSaving(false); }
    }

    function removeTag(i: number) {
        const arr = tagsArr.slice(); arr.splice(i, 1); setTagsStr(arr.join(', '));
    }

    if (loading) return <div className="text-sm text-gray-500">Жүктөлүүдө...</div>;
    if (!c) return <div>{t.contacts.empty}</div>;

    const allowed = NEXT_ALLOWED[c.status] ?? [];

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            {/* Sticky header like CRM */}
            <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-white/80 backdrop-blur border-b">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <button onClick={() => nav(-1)} className="btn" title="Артка">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-2xl font-semibold truncate">#{c.id} — {c.fullName}</h1>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
                                {c.phone && (<span className="inline-flex items-center gap-1"><Phone className="w-4 h-4" /> {c.phone}</span>)}
                                <StatusBadge status={c.status} />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <GhostButton onClick={() => nav('/contacts')}><X className="w-4 h-4" /> {t.contacts.cancel}</GhostButton>
                        <PrimaryButton disabled={saving} onClick={save}><Save className="w-4 h-4" /> {saving ? t.contacts.saving : t.contacts.save}</PrimaryButton>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center justify-between">
                <Tabs value={tab} onChange={(k) => setTab(k as any)} items={[{ key: 'overview', label: 'Кыскача' }, { key: 'timeline', label: 'Таймлайн' }]} />
            </div>

            {/* Main grid with related list like the screenshot */}
            <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
                {/* Related List (static placeholders for now) */}
                <aside className="hidden lg:block">
                    <div className="sticky top-20 space-y-2 text-sm">
                        <div className="font-medium text-gray-700 mb-2">Related</div>
                        <ul className="space-y-1">
                            <li><SubtleButton className="w-full justify-start">Attachments</SubtleButton></li>
                            <li><SubtleButton className="w-full justify-start">Emails</SubtleButton></li>
                            <li><SubtleButton className="w-full justify-start">Open Activities</SubtleButton></li>
                            <li><SubtleButton className="w-full justify-start">Closed Activities</SubtleButton></li>
                            <li><SubtleButton className="w-full justify-start">Notes</SubtleButton></li>
                        </ul>
                    </div>
                </aside>

                {/* Content */}
                <div className="space-y-6">
                    {tab === 'overview' ? (
                        <>
                            {/* Journey/State card */}
                            <Section title="Абалы">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <dl className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                                        <dt className="text-gray-500">Аты-жөнү</dt>
                                        <dd className="col-span-2">{c.fullName}</dd>
                                        <dt className="text-gray-500">Email</dt>
                                        <dd className="col-span-2">{c.email || '—'}</dd>
                                        <dt className="text-gray-500">Телефон</dt>
                                        <dd className="col-span-2">{c.phone || '—'}</dd>
                                        <dt className="text-gray-500">Булак</dt>
                                        <dd className="col-span-2">{c.source || '—'}</dd>
                                        <dt className="text-gray-500">Статус</dt>
                                        <dd className="col-span-2"><StatusBadge status={c.status} /></dd>
                                    </dl>
                                    <div className="md:col-span-2">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <Section title="Кийинки аракет">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <Clock className="w-4 h-4" /> {nextFollowUpAt ? new Date(nextFollowUpAt).toLocaleString() : '—'}
                                                </div>
                                            </Section>
                                            <Section title="Эң ылайыктуу убакыт">
                                                <div className="text-sm text-gray-500">{c.phone ? 'Чалуу: —' : '—'}</div>
                                            </Section>
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            {/* Editable block */}
                            <Section title="Жаңыртуу">
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Status segmented */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm mb-1">{t.contacts.status}</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[c.status, ...allowed.filter(s => s !== c.status)].map((s) => (
                                                <button key={s} type="button" onClick={() => setStatus(s as Contact['status'])}
                                                    className={`px-3 py-1 rounded-lg border text-xs md:text-sm ${status === s ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white hover:bg-gray-50'}`}>{STATUS_LABELS[s]}</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm mb-1 flex items-center gap-1"><CalendarClock className="w-4 h-4" /> {t.contacts.nextFollowUpAt}</label>
                                        <Input type="datetime-local" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} className="h-10 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm mb-1 flex items-center gap-1"><Flag className="w-4 h-4" /> {t.contacts.priority}</label>
                                        <Input type="number" min={1} max={5} value={priority} onChange={(e) => setPriority(parseInt(e.target.value || '1', 10))} className="h-10 text-sm" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm mb-1 flex items-center gap-1"><Tag className="w-4 h-4" /> {t.contacts.tags}</label>
                                        <Input value={tagsStr} onChange={(e) => setTagsStr(e.target.value)} placeholder="morning, teen" className="h-10 text-sm" />
                                        {tagsArr.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {tagsArr.map((tg, i) => (
                                                    <span key={`${tg}-${i}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-gray-50 text-xs leading-5">{tg}
                                                        <button type="button" className="hover:text-red-600" onClick={() => removeTag(i)} aria-label="Өчүрүү">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm mb-1">{t.contacts.notes}</label>
                                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[140px] text-sm" placeholder="Тел сүйлөштүк..." />
                                    </div>
                                </div>
                            </Section>

                            {/* System details */}
                            <Section title="Системалык маалымат">
                                <dl className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    <dt className="text-gray-500">{t.contacts.createdAt}</dt>
                                    <dd>{new Date(c.createdAt).toLocaleString()}</dd>
                                    <dt className="text-gray-500">ID</dt>
                                    <dd>#{c.id}</dd>
                                </dl>
                            </Section>
                        </>
                    ) : (
                        <Card>
                            <CardHeader>Таймлайн</CardHeader>
                            <CardBody>
                                <p className="text-sm text-gray-500">Логдор даяр болгондо бул жерге чыгат.</p>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
