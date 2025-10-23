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
                return `
          border-emerald-400/70 text-emerald-900 bg-emerald-50
          dark:border-emerald-500/60 dark:text-emerald-100 dark:bg-emerald-900/70
        `;
            case 'error':
                return `
          border-red-400/70 text-red-900 bg-red-50
          dark:border-red-500/60 dark:text-red-100 dark:bg-red-900/70
        `;
            case 'warning':
                return `
          border-amber-400/70 text-amber-900 bg-amber-50
          dark:border-amber-500/60 dark:text-amber-100 dark:bg-amber-900/70
        `;
            case 'info':
                return `
          border-blue-400/70 text-blue-900 bg-blue-50
          dark:border-blue-500/60 dark:text-blue-100 dark:bg-blue-900/70
        `;
            default:
                return `
          border-slate-300 text-gray-900 bg-white
          dark:border-gray-700 dark:text-gray-100 dark:bg-gray-900
        `;
        }
    }

    return (
        <ToastCtx.Provider value={value}>
            {children}
            {createPortal(
                <div
                    className="
            fixed top-5 left-1/2 -translate-x-1/2 z-[9999]
            flex flex-col items-center gap-2
            pointer-events-none
            w-full px-4
          "
                    role="region"
                    aria-label="Toast notifications"
                >
                    {toasts.map((t) => (
                        <div
                            key={t.id}
                            className={`
                pointer-events-auto
                rounded-xl border shadow-lg ring-1 ring-black/5
                backdrop-blur-sm
                animate-in fade-in slide-in-from-top-2
                max-w-md w-full
                ${getVariantClasses(t.variant || 'info')}
              `}
                            role="status" aria-live="polite"
                        >
                            <div className="p-3">
                                {t.title && <div className="font-medium mb-0.5">{t.title}</div>}
                                <div className="text-sm leading-relaxed">{t.message}</div>
                            </div>
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </ToastCtx.Provider>
    );
}
