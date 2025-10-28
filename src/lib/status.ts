// Centralized status logic for both list & detail UIs

export const RAW_STATUSES = [
    '', // All
    'NEW', 'CONTACTED', 'RESPONDED', 'QUALIFIED', 'UNQUALIFIED',
    'FOLLOW_UP', 'NO_RESPONSE', 'PENDING_PAYMENT', 'ENROLLED',
    'DEFERRED', 'LOST', 'DUPLICATE', 'TEST', 'ARCHIVED',
] as const;

export type S =
    | 'NEW' | 'CONTACTED' | 'RESPONDED' | 'QUALIFIED' | 'UNQUALIFIED'
    | 'FOLLOW_UP' | 'NO_RESPONSE' | 'PENDING_PAYMENT' | 'ENROLLED'
    | 'DEFERRED' | 'LOST' | 'DUPLICATE' | 'TEST' | 'ARCHIVED';

export const STATUS_LABELS: Record<(typeof RAW_STATUSES)[number], string> = {
    '': 'Баары',
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

// Allowed transitions (keep in sync with backend)
export const NEXT_ALLOWED: Record<S, S[]> = {
    NEW: ['CONTACTED', 'RESPONDED', 'NO_RESPONSE', 'LOST', 'DUPLICATE', 'TEST'],
    CONTACTED: ['RESPONDED', 'QUALIFIED', 'UNQUALIFIED', 'NO_RESPONSE', 'FOLLOW_UP', 'LOST'],
    RESPONDED: ['QUALIFIED', 'UNQUALIFIED', 'FOLLOW_UP', 'NO_RESPONSE', 'LOST'],
    QUALIFIED: ['PENDING_PAYMENT', 'FOLLOW_UP', 'LOST'],
    UNQUALIFIED: ['ARCHIVED', 'FOLLOW_UP'],
    FOLLOW_UP: ['RESPONDED', 'QUALIFIED', 'UNQUALIFIED', 'NO_RESPONSE', 'LOST'],
    NO_RESPONSE: ['FOLLOW_UP', 'ARCHIVED', 'LOST'],
    PENDING_PAYMENT: ['ENROLLED', 'DEFERRED', 'FOLLOW_UP', 'LOST'],
    ENROLLED: ['ARCHIVED'],
    DEFERRED: ['PENDING_PAYMENT', 'FOLLOW_UP', 'LOST'],
    LOST: ['ARCHIVED', 'NEW'],
    DUPLICATE: ['ARCHIVED'],
    TEST: ['ARCHIVED'],
    ARCHIVED: [],
};

// For journey/kanban visualization (do not use to filter options)
export const PIPELINE: S[] = [
    'NEW', 'CONTACTED', 'RESPONDED', 'NO_RESPONSE', 'QUALIFIED', 'PENDING_PAYMENT', 'ENROLLED',
];

export const PIPELINE_ORDER: S[] = [
    'NEW', 'CONTACTED', 'RESPONDED', 'QUALIFIED', 'UNQUALIFIED', 'FOLLOW_UP',
    'NO_RESPONSE', 'PENDING_PAYMENT', 'ENROLLED', 'DEFERRED', 'LOST', 'ARCHIVED', 'DUPLICATE', 'TEST'
];

export const ORDER_INDEX: Record<S, number> =
    PIPELINE_ORDER.reduce((m, s, i) => ((m[s] = i), m), {} as Record<S, number>);

export function getNextOptions(
    current: S,
    role: 'sales' | 'assistant' | 'manager' | 'admin' | 'superadmin'
): S[] {
    const raw = NEXT_ALLOWED[current] || [];
    const hidden = new Set<S>(role === 'sales' ? ['ARCHIVED', 'DUPLICATE', 'TEST'] : []);
    return raw.filter(s => !hidden.has(s)).sort((a, b) => ORDER_INDEX[a] - ORDER_INDEX[b]);
}
