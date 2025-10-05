import { tokenStore } from "./storage";

export type Role = 'sales' | 'assistant' | 'manager' | 'superadmin';
export type Me = { sub: number; email: string; role: Role; fullName?: string };

export function parseJwt<T = any>(token?: string | null): T | null {
    if (!token) return null;
    try {
        const [, payload] = token.split('.');
        const json = atob(payload);
        return JSON.parse(json) as T;
    } catch {
        return null;
    }
}

export function currentUser(): Me | null {
    const access = tokenStore.get()?.accessToken;
    if (!access) return null;
    const me = parseJwt<Me>(access);
    return me;
}

export function hasRole(required: Role | Role[]): boolean {
    const me = currentUser();
    if (!me) return false;
    const req = Array.isArray(required) ? required : [required];
    return req.includes(me.role);
}