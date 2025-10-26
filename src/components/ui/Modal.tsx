import React from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

/**
 * Reusable Modal with:
 * - Portal to document.body
 * - Mobile sheet, desktop centered card
 * - Backdrop (click to close, Esc to close)
 * - Focus trap + return focus to trigger
 * - Body scroll lock while open
 * - Sticky header/footer slots
 */
type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    size?: ModalSize;                 // content max width on desktop
    closeOnBackdrop?: boolean;        // default: true
    closeOnEsc?: boolean;             // default: true
    initialFocusRef?: React.RefObject<HTMLElement>;
    className?: string;               // extra classes on the panel
};

const sizeToMax: Record<ModalSize, string> = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
};

export default function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    size = 'xl',
    closeOnBackdrop = true,
    closeOnEsc = true,
    initialFocusRef,
    className,
}: ModalProps) {
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const previouslyFocused = React.useRef<HTMLElement | null>(null);

    // Scroll lock on <body>
    React.useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // Focus management: capture opener, focus first element in modal
    React.useEffect(() => {
        if (!open) return;
        previouslyFocused.current = document.activeElement as HTMLElement | null;

        const toFocus =
            initialFocusRef?.current ??
            (panelRef.current?.querySelector<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) ?? panelRef.current);

        toFocus?.focus();

        return () => {
            previouslyFocused.current?.focus?.();
        };
    }, [open, initialFocusRef]);

    // Basic focus trap
    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'Escape' && closeOnEsc) {
            e.stopPropagation();
            onClose();
            return;
        }
        if (e.key !== 'Tab') return;
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;

        const list = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
        const first = list[0];
        const last = list[list.length - 1];
        const isShift = e.shiftKey;
        const cur = document.activeElement as HTMLElement;

        if (!isShift && cur === last) {
            e.preventDefault();
            first.focus();
        } else if (isShift && cur === first) {
            e.preventDefault();
            last.focus();
        }
    }

    if (!open) return null;

    return createPortal(
        <div aria-modal="true" role="dialog" className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <button
                aria-label="Жабуу"
                onClick={() => closeOnBackdrop && onClose()}
                className={clsx(
                    'absolute inset-0 z-[120]',
                    'bg-black/40 backdrop-blur-sm supports-[backdrop-filter]:bg-black/30'
                )}
            />

            {/* Panel wrapper */}
            <div className="absolute inset-x-0 top-2 sm:top-10 mx-auto z-[140]">
                <div
                    ref={panelRef}
                    onKeyDown={onKeyDown}
                    className={clsx(
                        // Desktop: centered card with max width; Mobile: full width sheet-like
                        'relative w-full sm:w-auto',
                        sizeToMax[size],
                        'rounded-none sm:rounded-2xl border shadow-xl',
                        'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800',
                        'mx-0 sm:mx-auto',
                        className
                    )}
                >
                    {/* Header */}
                    {(title || true) && (
                        <div
                            className="
                sticky top-0 z-10
                px-4 py-3 flex items-center justify-between
                rounded-t-none sm:rounded-t-2xl
                border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur
                border-gray-200 dark:border-gray-800
              "
                        >
                            <h2 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                                {title ?? 'Маалымат'}
                            </h2>
                            <button
                                onClick={onClose}
                                className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                                aria-label="Жабуу"
                                title="Жабуу"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Body */}
                    <div className="px-4 py-4 sm:p-4 overflow-auto max-h-[75vh] sm:max-h-[65vh]">
                        {children}
                    </div>

                    {/* Footer */}
                    {footer && (
                        <div
                            className="
                px-4 py-3
                rounded-b-none sm:rounded-b-2xl
                border-t border-gray-200 dark:border-gray-800
                bg-white/90 dark:bg-gray-900/90
                flex items-center justify-end gap-2
              "
                        >
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
