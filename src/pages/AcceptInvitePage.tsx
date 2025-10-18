import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { acceptInvite } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

export default function AcceptInvitePage() {
    const [sp] = useSearchParams();
    const token = sp.get('token') || '';
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const nav = useNavigate();

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (pw !== pw2) {
            toast.push({ title: 'Ката', message: 'Сырсөздөр дал келбейт.' });
            return;
        }
        setLoading(true);
        try {
            await acceptInvite(token, pw);
            toast.push({ title: 'OK', message: 'Каттоо ийгиликтүү аяктады.' });
            nav('/login'); // or straight to /contacts if tokens returned
        } catch (err: any) {
            toast.push({ title: 'Ката', message: 'Текшерип көрүңүз: чакыруу мөөнөтү өтүп кеткен же токен жараксыз.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="max-w-md mx-auto p-6">
            <h1 className="text-xl font-semibold mb-4">Аккаунтту активдештирүү</h1>
            <input type="password" placeholder="Жаңы сырсөз" className="input mb-3"
                value={pw} onChange={e => setPw(e.target.value)} required minLength={8} />
            <input type="password" placeholder="Сырсөздү кайталаңыз" className="input mb-4"
                value={pw2} onChange={e => setPw2(e.target.value)} required minLength={8} />
            <button className="btn-primary" disabled={loading}>
                {loading ? 'Жүктөлүүдө…' : 'Катталуу'}
            </button>
        </form>
    );
}
