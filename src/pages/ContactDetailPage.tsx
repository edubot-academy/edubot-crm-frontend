import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { t } from '@/lib/i18n';
import type { Contact } from './ContactsPage';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { PrimaryButton, GhostButton } from '@/components/ui/Button';
import StatusBadge from '@/components/StatusBadge';
import { useToast } from '@/components/ui/Toast';

const NEXT_ALLOWED: Record<Contact['status'], Contact['status'][]> = {
    NEW: ['CONTACTED', 'LOST'],
    CONTACTED: ['QUALIFIED', 'LOST'],
    QUALIFIED: ['ENROLLED', 'LOST'],
    ENROLLED: ['LOST'],
    LOST: ['NEW'],
};

export default function ContactDetailPage() {
    const { id } = useParams();
    const nav = useNavigate();
    const toast = useToast();
    const [c, setC] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<Contact['status']>('NEW');
    const [nextFollowUpAt, setNextFollowUpAt] = useState<string>('');
    const [priority, setPriority] = useState<number>(1);
    const [tags, setTags] = useState<string>('');

    async function load() {
        setLoading(true);
        try {
            const { data } = await api.get<Contact>(`/contacts/${id}`);
            setC(data);
            setStatus(data.status);
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
            if (tags.trim()) payload.tags = tags.split(',').map(s => s.trim());
            await api.patch(`/contacts/${id}`, payload);
            toast.push({ title: 'OK', message: t.contacts.updateOk });
            nav('/contacts');
        } catch (e) {
            toast.push({ title: 'Ката', message: t.contacts.updateFail });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div>Жүктөлүүдө...</div>;
    if (!c) return <div>{t.contacts.empty}</div>;

    const allowed = NEXT_ALLOWED[c.status] ?? [];

    return (
        <div className="space-y-4">
            <button onClick={() => nav(-1)} className="btn">← Артка</button>
            <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">#{c.id} — {c.fullName}</h1>
                <StatusBadge status={c.status} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>Негизги маалымат</CardHeader>
                    <CardBody>
                        <div className="text-sm grid grid-cols-3 gap-2">
                            <div className="text-gray-500">Email</div>
                            <div className="col-span-2">{c.email || '—'}</div>
                            <div className="text-gray-500">Телефон</div>
                            <div className="col-span-2">{c.phone || '—'}</div>
                            <div className="text-gray-500">Булак</div>
                            <div className="col-span-2">{c.source || '—'}</div>
                            <div className="text-gray-500">Статус</div>
                            <div className="col-span-2">{c.status}</div>
                            <div className="text-gray-500">{t.contacts.createdAt}</div>
                            <div className="col-span-2">{new Date(c.createdAt).toLocaleString()}</div>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>Жаңыртуу</CardHeader>
                    <CardBody>
                        <div className="grid gap-3">
                            <div>
                                <label className="block text-sm mb-1">{t.contacts.status}</label>
                                <Select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                                    <option value={c.status}>{c.status}</option>
                                    {allowed.filter(s => s !== c.status).map(s => <option key={s} value={s}>{s}</option>)}
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{t.contacts.nextFollowUpAt}</label>
                                <Input type="datetime-local" value={nextFollowUpAt} onChange={(e) => setNextFollowUpAt(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{t.contacts.priority}</label>
                                <Input type="number" min={1} max={5} value={priority} onChange={(e) => setPriority(parseInt(e.target.value || '1'))} />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{t.contacts.tags}</label>
                                <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="teen, evening" />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">{t.contacts.notes}</label>
                                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[120px]" placeholder="Тел сүйлөштүк..." />
                            </div>
                            <div className="flex gap-2">
                                <PrimaryButton disabled={saving} onClick={save}>{saving ? t.contacts.saving : t.contacts.save}</PrimaryButton>
                                <GhostButton onClick={() => nav(-1)}>{t.contacts.cancel}</GhostButton>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}