import { Link, useLocation, useNavigate } from 'react-router-dom';
import { tokenStore } from '@/lib/storage';
import { t } from '@/lib/i18n';
import { Users, LayoutDashboard } from 'lucide-react';
import { currentUser } from '@/lib/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
    const loc = useLocation();
    const nav = useNavigate();
    const me = currentUser();
    const isActive = (p: string) => loc.pathname === p || loc.pathname.startsWith(p + '/');

    const navLinkClass = (active: boolean) =>
        [
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400',
            active
                ? // active
                'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                : // idle + hover
                'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
        ].join(' ');

    return (
        <div className="min-h-screen grid grid-cols-[240px_1fr] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
            {/* Sidebar */}
            <aside className="h-screen sticky top-0 border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                {/* Brand */}
                <div className="container-lg h-14 flex items-center gap-2">
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
                    {(me?.role === 'manager' || me?.role === 'superadmin') && (
                        <Link to="/admin" className={navLinkClass(isActive('/admin'))}>
                            <Users size={16} className="text-current" />
                            {t.nav.admin}
                        </Link>
                    )}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-3 left-2 right-2">
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
            </aside>

            {/* Main */}
            <main className="min-h-screen">
                <div className="container-lg py-6">{children}</div>
            </main>
        </div>
    );
}
