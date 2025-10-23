import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import { tokenStore } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const schema = z.object({
    email: z.string().min(1, t.auth.required).email(t.auth.invalid),
    password: z.string().min(1, t.auth.required),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
    const nav = useNavigate();
    const [showPwd, setShowPwd] = useState(false);
    const toast = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: zodResolver(schema) });

    async function onSubmit(values: FormValues) {
        try {
            const { data } = await api.post('/auth/login', values);
            tokenStore.set(data);
            nav('/contacts');
        } catch {
            toast.push({ title: 'Ката', message: errors.email?.message || errors.password?.message || 'Ката кетти', variant: 'error' });
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4
                  bg-gradient-to-br from-emerald-50 to-blue-50
                  dark:from-gray-900 dark:to-gray-950"> {/* dark bg */}
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden
                      dark:bg-gray-900 dark:border-gray-800"> {/* dark card */}
                    <div className="p-8 md:p-10 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="mx-auto h-14 w-14 rounded-xl">
                                <img src="/edubot-logo.svg" alt="Edubot CRM" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">EduBot CRM</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Сатуулар панелине кирүү</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Email */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t.auth.email}
                                </label>
                                <div
                                    className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white
                           px-4 md:px-5 shadow-sm
                           focus-within:ring-2 focus-within:ring-emerald-500
                           dark:bg-gray-800 dark:border-gray-700
                           dark:focus-within:ring-emerald-400"> {/* dark wrapper */}
                                    <Mail className="w-4 h-4 opacity-60 shrink-0 text-gray-600 dark:text-gray-400" />
                                    <input
                                        {...register('email')}
                                        placeholder="admin@example.com"
                                        autoComplete="email"
                                        inputMode="email"
                                        className="flex-1 bg-transparent outline-none border-0 text-sm
                             text-gray-900 placeholder-gray-400
                             dark:text-gray-100 dark:placeholder-gray-500" /> {/* force text/placeholder */}
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t.auth.password}
                                </label>
                                <div
                                    className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white
                           px-3 shadow-sm
                           focus-within:ring-2 focus-within:ring-emerald-500
                           dark:bg-gray-800 dark:border-gray-700
                           dark:focus-within:ring-emerald-400">
                                    <Lock className="w-4 h-4 opacity-60 shrink-0 text-gray-600 dark:text-gray-400" />
                                    <input
                                        type={showPwd ? 'text' : 'password'}
                                        {...register('password')}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className="flex-1 bg-transparent outline-none border-0 text-sm
                             text-gray-900 placeholder-gray-400
                             dark:text-gray-100 dark:placeholder-gray-500" />
                                    <button
                                        type="button"
                                        onClick={() => setShowPwd((s) => !s)}
                                        aria-label={showPwd ? 'Сырсөздү жашыруу' : 'Сырсөздү көрсөтүү'}
                                        className="p-1 -mr-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl
                         bg-emerald-600 text-white text-sm font-medium shadow-sm
                         hover:bg-emerald-700 disabled:opacity-70
                         focus:outline-none focus:ring-2 focus:ring-emerald-500
                         dark:focus:ring-emerald-400">
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? t.auth.loggingIn : t.auth.login}
                            </button>
                        </form>
                    </div>

                    <div className="bg-gray-50 border-t px-6 py-3 text-[11px] text-gray-500 flex items-center justify-between
                        dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400">
                        <span>© 2025 EduBot</span>
                        <span>Колдоо: support@edubot.it.com</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
