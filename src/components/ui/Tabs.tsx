import React, { useId, useMemo, useRef } from 'react';

export type TabItem = {
    key: string;
    label: React.ReactNode;
    badge?: React.ReactNode;   // e.g. count chip: <span>12</span>
    disabled?: boolean;
};

type TabsProps = {
    value: string;
    onChange: (k: string) => void;
    items: TabItem[];
    className?: string;
    size?: 'sm' | 'md';
    fullWidth?: boolean;       // stretch across container
};

export function Tabs({
    value,
    onChange,
    items,
    className = '',
    size = 'md',
    fullWidth = false,
}: TabsProps) {
    const baseId = useId();
    const activeIndex = Math.max(0, items.findIndex(i => i.key === value));
    const refs = useRef<Array<HTMLButtonElement | null>>([]);

    const sizing = size === 'sm'
        ? 'px-2.5 py-1 text-xs'
        : 'px-3 py-1.5 text-sm';

    const containerClasses = `
    inline-flex items-center gap-2 p-1 rounded-xl border
    bg-gray-50 border-gray-200
    dark:bg-gray-900/70 dark:border-gray-800
    ${fullWidth ? 'w-full' : 'w-fit'}
    ${className}
  `;

    const buttons = useMemo(() => items.map((it, i) => {
        const active = value === it.key;
        const id = `${baseId}-tab-${i}`;
        const panelId = `${baseId}-panel-${i}`;
        const common =
            'rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ' +
            'dark:focus-visible:ring-offset-gray-900';
        const state = it.disabled
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : active
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100';

        return (
            <button
                key={it.key}
                ref={(el) => { refs.current[i] = el; }}
                id={id}
                role="tab"
                aria-selected={active}
                aria-controls={panelId}
                tabIndex={active ? 0 : -1}
                disabled={!!it.disabled}
                onClick={() => !it.disabled && onChange(it.key)}
                className={`${sizing} ${common} ${state} ${fullWidth ? 'flex-1' : ''}`}
            >
                <span className="inline-flex items-center gap-1">
                    {it.label}
                    {it.badge != null && (
                        <span className="inline-flex min-w-5 h-5 items-center justify-center px-1 rounded-full text-[10px] leading-none border
                             bg-gray-100 text-gray-700 border-gray-200
                             dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700">
                            {it.badge}
                        </span>
                    )}
                </span>
            </button>
        );
    }), [items, value, onChange, baseId, fullWidth, sizing]);

    function focusIndex(next: number) {
        const clamped = (next + items.length) % items.length;
        const btn = refs.current[clamped];
        if (btn && !btn.disabled) btn.focus();
    }

    function moveActive(delta: number) {
        // find next enabled tab in direction
        let idx = activeIndex;
        for (let step = 0; step < items.length; step++) {
            idx = (idx + delta + items.length) % items.length;
            if (!items[idx].disabled) {
                onChange(items[idx].key);
                focusIndex(idx);
                return;
            }
        }
    }

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        switch (e.key) {
            case 'ArrowRight':
            case 'Right':
                e.preventDefault(); moveActive(1); break;
            case 'ArrowLeft':
            case 'Left':
                e.preventDefault(); moveActive(-1); break;
            case 'Home':
                e.preventDefault();
                onChange(items.find(i => !i.disabled)?.key ?? items[0].key);
                focusIndex(items.findIndex(i => !i.disabled));
                break;
            case 'End':
                e.preventDefault();
                for (let i = items.length - 1; i >= 0; i--) {
                    if (!items[i].disabled) {
                        onChange(items[i].key);
                        focusIndex(i);
                        break;
                    }
                }
                break;
        }
    }

    return (
        <div role="tablist" aria-orientation="horizontal" className={containerClasses} onKeyDown={onKeyDown}>
            {buttons}
        </div>
    );
}
