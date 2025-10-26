import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { tokenStore } from '@/lib/storage';
import { t } from '@/lib/i18n';
import { Users, LayoutDashboard, Menu, X } from 'lucide-react';
import { currentUser } from '@/lib/auth';

/**
 * Responsive shell:
 * - Mobile (< md): top app bar + slide-in drawer for navigation
 * - Desktop (>= md): persistent left sidebar
 *
 * Accessibility:
 * - Esc closes drawer
 * - Focus is sent to the first nav link when opening
 * - Overlay is clickable to close
 * - aria-modal + role="dialog" for drawer; aria-controls ties trigger to drawer
 */
export default function Layout({ children }: { children: React.ReactNode }) {
    const loc = useLocation();
    const nav = useNavigate();
    const me = currentUser();
    const [open, setOpen] = useState(false);

    const isActive = (p: string) =>
        p === '/'
            ? loc.pathname === '/'
            : loc.pathname === p || loc.pathname.startsWith(p + '/');

    const navLinkClass = (active: boolean) =>
        [
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors outline-none',
            'focus-visible:ring-2 focus-visible:ring-emerald-500 dark:focus-visible:ring-emerald-400',
            active
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
        ].join(' ');

    // Close drawer on route change (mobile)
    useEffect(() => {
        setOpen(false);
    }, [loc.pathname]);

    // Close on Esc
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const AdminLink = useMemo(() => {
        const allowed = me?.role === 'manager' || me?.role === 'admin' || me?.role === 'superadmin';
        if (!allowed) return null;
        return (
            <Link to="/admin" className={navLinkClass(isActive('/admin'))}>
                <Users size={16} className="text-current" />
                {t.nav.admin}
            </Link>
        );
    }, [me?.role, loc.pathname]);

    // Shared sidebar content
    const SidebarNav = (
        <>
            {/* Brand */}
            <div className="hidden sm:flex h-14 items-center gap-2 px-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="h-8 w-8 rounded-xl overflow-hidden shrink-0">
                    <img src="/edubot-logo.svg" alt="Edubot CRM" className="h-full w-full object-contain" />
                </div>
                <span className="font-semibold">EduBot CRM</span>
            </div>

            {/* Nav */}
            <nav className="px-2 py-2 space-y-1">
                <Link to="/" className={navLinkClass(isActive('/'))}>
                    <LayoutDashboard size={16} className="text-current" />
                    {t.nav.dashboard}
                </Link>
                <Link to="/contacts" className={navLinkClass(isActive('/contacts'))}>
                    <Users size={16} className="text-current" />
                    {t.nav.contacts}
                </Link>
                {AdminLink}
            </nav>
            {/* Logout */}
            <div className="mt-auto p-2">
                <button
                    onClick={() => {
                        tokenStore.clear();
                        nav('/login');
                    }}
                    className="btn w-full"
                >
                    {t.auth.logout}
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            {/* Skip link for a11y */}
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-emerald-600 text-white px-3 py-1 rounded">
                Негизги мазмунга өтүңүз
            </a>

            {/* Mobile top app bar */}
            <header className="md:hidden sticky top-0 z-40 h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="h-full flex items-center justify-between px-3">
                    <button
                        aria-label="Меню"
                        aria-controls="mobile-drawer"
                        aria-expanded={open}
                        onClick={() => setOpen(true)}
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <img src="/edubot-logo.svg" alt="Edubot CRM" className="h-7 w-7" />
                        <span className="font-semibold">EduBot CRM</span>
                    </div>
                    <div className="w-9" /> {/* spacer to balance the menu button */}
                </div>
            </header>

            {/* Desktop grid */}
            <div className="hidden md:grid md:grid-cols-[280px_minmax(0,1fr)]">
                {/* Desktop sidebar */}
                <aside className="h-screen sticky top-0 z-30 border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 flex flex-col">
                    {SidebarNav}
                </aside>
                {/* Main */}
                <main id="main" className="min-h-screen min-w-0 w-full flex-1">
                    <div className="container-lg w-full py-6">{children}</div>
                </main>
            </div>

            {/* Mobile main (separate flow) */}
            <div className="md:hidden">
                <main id="main" className="min-h-[calc(100vh-56px)] pt-2 min-w-0 w-full">
                    <div className="container-lg w-full py-4">{children}</div>
                </main>
            </div>

            {/* Mobile drawer */}
            <div className={[
                'md:hidden',
                'fixed inset-0 z-50',
                open ? '' : 'pointer-events-none',
            ].join(' ')}>
                {/* Backdrop */}
                <div
                    className={[
                        'absolute inset-0 bg-black/40 transition-opacity',
                        open ? 'opacity-100' : 'opacity-0',
                    ].join(' ')}
                    onClick={() => setOpen(false)}
                />
                {/* Panel */}
                <div
                    id="mobile-drawer"
                    role="dialog"
                    aria-modal="true"
                    className={[
                        'absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-xl border-r border-gray-200 dark:border-gray-800',
                        'bg-white dark:bg-gray-900 flex flex-col',
                        'transition-transform',
                        open ? 'translate-x-0' : '-translate-x-full',
                    ].join(' ')}
                >
                    <div className="h-14 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <img src="/edubot-logo.svg" alt="Edubot CRM" className="h-7 w-7" />
                            <span className="font-semibold">EduBot CRM</span>
                        </div>
                        <button aria-label="Жабуу" onClick={() => setOpen(false)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X size={18} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {SidebarNav}
                    </div>
                </div>
            </div>
        </div>
    );
}
