export type UserRole = 'sales' | 'assistant' | 'manager' | 'admin' | 'superadmin';

// Role hierarchy (for guards/UI)
export const ROLE_ORDER: UserRole[] = ['sales', 'assistant', 'manager', 'admin', 'superadmin'];

export const ROLE_LABEL: Record<UserRole, string> = {
    sales: 'Сатуучу',
    assistant: 'Ассистент',
    manager: 'Менеджер',
    admin: 'Админ',
    superadmin: 'Суперадмин',
};

// Permission helpers — purely frontend display or client-guard logic
export function canToggleFor(actor: UserRole | undefined, target: UserRole): boolean {
    if (!actor) return false;
    if (actor === 'superadmin') return true;
    if (actor === 'admin') return target !== 'superadmin' && target !== 'admin';
    if (actor === 'manager') return target === 'sales';
    return false;
}

export const canResendInvite = (actor?: UserRole) =>
    actor === 'superadmin' || actor === 'admin' || actor === 'manager';

export function canSoftDelete(actorRole?: UserRole, targetRole?: UserRole) {
    if (!actorRole || !targetRole) return false;

    // Superadmin can delete anyone (except themselves)
    if (actorRole === 'superadmin') return true;

    // Admin can delete only non-superadmins
    if (actorRole === 'admin' && targetRole !== 'superadmin') return true;

    // Managers, assistants, sales → no delete permission
    return false;
}


export const canHardDelete = (actor?: UserRole) => actor === 'superadmin';

export const canUpdateUser = (actor?: UserRole) => actor === 'superadmin' || actor === 'admin';
