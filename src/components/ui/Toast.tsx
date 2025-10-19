import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export type Toast = {
    id: number;
    title?: string;
    message: string;
    variant?: ToastVariant;
};

const ToastCtx = createContext<{ push: (t: Omit<Toast, 'id'>) => void }>({ push: () => { } });
export function useToast() {
    return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const push = useCallback((t: Omit<Toast, 'id'>) => {
        const id = Date.now() + Math.random();
        setToasts((arr) => [...arr, { id, ...t }]);
        window.setTimeout(() => {
            setToasts((arr) => arr.filter((x) => x.id !== id));
        }, 4500);
    }, []);

    const value = useMemo(() => ({ push }), [push]);

    function getVariantClasses(v?: ToastVariant) {
        switch (v) {
            case 'success':
                return 'border-emerald-500 bg-emerald-50 text-emerald-900';
            case 'error':
                return 'border-red-500 bg-red-50 text-red-900';
            case 'warning':
                return 'border-amber-500 bg-amber-50 text-amber-900';
            case 'info':
                return 'border-blue-500 bg-blue-50 text-blue-900';
            default:
                return 'border-slate-200 bg-white text-gray-900';
        }
    }

    return (
        <ToastCtx.Provider value={value}>
            {children}
            {createPortal(
                <div
                    className="fixed right-4 top-4 z-[9999] space-y-2 pointer-events-none"
                    role="region"
                    aria-label="Toast notifications"
                >
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`pointer-events-auto card shadow-sm animate-in fade-in slide-in-from-top-2 ${getVariantClasses(
                                t.variant || 'info'
                            )}`}
                        >
                            <div className="card-body">
                                {t.title && <div className="font-medium mb-1">{t.title}</div>}
                                <div className="text-sm">{t.message}</div>
                            </div>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastCtx.Provider>
    );
}
