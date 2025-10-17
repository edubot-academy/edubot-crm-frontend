// src/auth/RequireRole.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from './user-role';

type UseAuthResult = { user: { role: UserRole } | null };
function useAuthFallback(): UseAuthResult {
    // Replace with your real auth hook, e.g. import { useAuth } from '@/lib/useAuth';
    return { user: null };
}

type Props = {
    allow: UserRole[];           // roles allowed to view the route
    children: React.ReactNode;   // protected element
    useAuthHook?: () => UseAuthResult; // optional injection for tests
};

export default function RequireRole({ allow, children, useAuthHook }: Props) {
    const { user } = (useAuthHook ?? useAuthFallback)();
    const loc = useLocation();

    if (!user) {
        // Not logged in → send to login (or home)
        return <Navigate to="/login" state={{ from: loc }} replace />;
    }
    if (!allow.includes(user.role)) {
        // Logged in but forbidden → home (or a /403 page if you have one)
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
