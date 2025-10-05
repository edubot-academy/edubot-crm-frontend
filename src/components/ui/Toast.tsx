import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export type Toast = { id: number; title?: string; message: string };

const ToastCtx = createContext<{ push: (t: Omit<Toast, 'id'>) => void }>({ push: () => { } });

export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const push = useCallback((t: Omit<Toast, 'id'>) => {
        const id = Date.now() + Math.random();
        setToasts((arr) => [...arr, { id, ...t }]);
        setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), 3000);
    }, []);

    const value = useMemo(() => ({ push }), [push]);

    return (
        <ToastCtx.Provider value={value}>
            {children}
            {createPortal(
                <div className="fixed right-4 top-4 z-[100] space-y-2">
                    {toasts.map(t => (
                        <div key={t.id} className="card border-emerald-200">
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