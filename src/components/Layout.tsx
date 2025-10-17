import { Link, useLocation, useNavigate } from 'react-router-dom';
import { tokenStore } from '@/lib/storage';
import { t } from '@/lib/i18n';
import { Users, LayoutDashboard } from 'lucide-react';
import { currentUser } from '@/lib/auth';

export default function Layout({ children }: { children: React.ReactNode }) {
    const loc = useLocation();
    const nav = useNavigate();
    const me = currentUser();
    const isActive = (p: string) => loc.pathname.startsWith(p);
    console.log(me);
    return (
        <div className="min-h-screen grid grid-cols-[240px_1fr] bg-gray-50 text-gray-900">
            <aside className="h-screen sticky top-0 border-r bg-white">
                <div className="container-lg h-14 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-md bg-gradient-to-br from-emerald-500 to-blue-600" />
                    <span className="font-semibold">EduBot CRM</span>
                </div>
                <nav className="px-2 py-2 space-y-1 text-sm">
                    <Link to="/" className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 ${isActive('/') ? 'bg-gray-50' : ''}`}>
                        <LayoutDashboard size={16} /> {t.nav.dashboard}
                    </Link>
                    <Link to="/contacts" className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 ${isActive('/contacts') ? 'bg-gray-50' : ''}`}>
                        <Users size={16} /> {t.nav.contacts}
                    </Link>
                    {me?.role === 'manager' || me?.role === 'superadmin' && (
                        <Link to="/admin" className={`flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 ${isActive('/admin') ? 'bg-gray-50' : ''}`}>
                            <Users size={16} /> {t.nav.admin}
                        </Link>
                    )}
                </nav>
                <div className="absolute bottom-3 left-2 right-2">
                    <button
                        onClick={() => { tokenStore.clear(); nav('/login'); }}
                        className="btn w-full"
                    >{t.auth.logout}</button>
                </div>
            </aside>
            <main className="min-h-screen">
                <div className="container-lg py-6">{children}</div>
            </main>
        </div>
    );
}