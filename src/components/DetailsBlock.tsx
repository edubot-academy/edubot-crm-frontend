import React, { useState } from 'react';
import { CardBody } from '@/components/ui/Card';

type ContactLite = {
    ownerName?: string | null;
    assignedToName?: string | null;
    createdByName?: string | null;
    duplicateOfId?: number | null;
    email?: string | null;
    status: string;
    createdAt: string;
    updatedAt?: string | null;
    phone?: string | null;
    courseName?: string | null;
    courseType?: string | null;
    utmSource?: string | null;
    source?: string | null;
    sourceProvider?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
    NEW: 'ЖАҢЫ',
    CONTACTED: 'БАЙЛАНЫШТЫК',
    RESPONDED: 'ЖООП БЕРДИ',
    QUALIFIED: 'ТАТЫКТУУ',
    UNQUALIFIED: 'ТАТЫКСЫЗ',
    FOLLOW_UP: 'КАЙРА БАЙЛАНЫШ',
    NO_RESPONSE: 'ЖООП ЖОК',
    PENDING_PAYMENT: 'ТӨЛӨМ КҮТҮЛҮҮДӨ',
    ENROLLED: 'КАТТАЛДЫ',
    DEFERRED: 'КИЙИНГЕ ЖЫЛДЫРЫЛДЫ',
    LOST: 'ЖОГОЛДУ',
    DUPLICATE: 'ДУБЛИКАТ',
    TEST: 'ТЕСТ',
    ARCHIVED: 'АРХИВДЕЛДИ',
};

export default function DetailsBlock({ c }: { c: ContactLite }) {
    const [open, setOpen] = useState(true);
    const sourceDisplay = c.sourceProvider ? `${c.source || '—'} · ${c.sourceProvider}` : (c.source || '—');

    return (
        <div
            className="
        rounded-2xl border shadow-sm
        bg-white border-gray-200
        dark:bg-gray-900 dark:border-gray-800
      "
        >
            <div
                className="
          flex items-center justify-between
          px-4 pt-4 pb-2 border-b rounded-t-2xl
          bg-gray-50/60 border-gray-200
          dark:bg-gray-800/60 dark:border-gray-800
        "
            >
                <div className="font-medium text-gray-900 dark:text-gray-100">Кеңири маалымат</div>

                <button
                    className="
            inline-flex items-center h-9 px-3 rounded-lg text-sm
            bg-white border border-gray-200 text-gray-800 hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-emerald-500
            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100
            dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:focus:ring-emerald-400
          "
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-label={open ? 'Жашыруу' : 'Көрсөтүү'}
                >
                    {open ? 'Жашыруу' : 'Көрсөтүү'}
                </button>
            </div>

            {open && (
                // If you don't have CardBody, replace with: <div className="p-4">...</div>
                <CardBody>
                    <div className="grid md:grid-cols-2 gap-8 text-sm">
                        <dl className="grid grid-cols-2 gap-y-2 gap-x-8">
                            <dt className="text-gray-500 dark:text-gray-400">Лид ээси</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{c.createdByName || '—'}</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Жооптуу</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{c.assignedToName ? c.assignedToName : '—'}</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Дубликаты</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{c.duplicateOfId ?? '—'}</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Email</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{c.email || '—'}</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Лид статусу</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{STATUS_LABELS[c.status] || c.status}</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Түзүлгөн убакыт</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{new Date(c.createdAt).toLocaleString()}</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Жаңыртылган убакыт</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{new Date(c.updatedAt || c.createdAt).toLocaleString()}</dd>
                        </dl>

                        <dl className="grid grid-cols-2 gap-y-2 gap-x-8">
                            <dt className="text-gray-500 dark:text-gray-400">Телефон</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{c.phone || '—'}</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Тармак</dt>
                            <dd className="text-gray-900 dark:text-gray-100">—</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Курс</dt>
                            <dd className="text-gray-900 dark:text-gray-100">
                                {c.courseName ? `${c.courseName} (${c.courseType || '—'})` : '—'}
                            </dd>

                            <dt className="text-gray-500 dark:text-gray-400">UTM булагы</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{c.utmSource || '—'}</dd>

                            <dt className="text-gray-500 dark:text-gray-400">Булак</dt>
                            <dd className="text-gray-900 dark:text-gray-100">{sourceDisplay}</dd>
                        </dl>
                    </div>
                </CardBody>
            )}
        </div>
    );
}

