import React, { useEffect, useId, useMemo, useRef } from 'react';
import clsx from 'clsx';

export type TabItem = {
    key: string;
    label: React.ReactNode;
    badge?: React.ReactNode; // e.g., <span>12</span>
    disabled?: boolean;
};

type TabsProps = {
    value: string;
    onChange: (k: string) => void;
    items: TabItem[];
    className?: string;
    size?: 'sm' | 'md';
    fullWidth?: boolean;         // stretch across container
    scrollable?: boolean;        // enable horizontal scroll on overflow (default true)
    allowWrap?: boolean;         // allow wrapping to new line (default false when scrollable)
};

export function Tabs({
    value,
    onChange,
    items,
    className = '',
    size = 'md',
    fullWidth = false,
    scrollable = true,
    allowWrap,
}: TabsProps) {
    const baseId = useId();
    const listRef = useRef<HTMLDivElement | null>(null);
    const refs = useRef<Array<HTMLButtonElement | null>>([]);

    // Compute a safe active index (fallback to first enabled)
    let activeIndex = items.findIndex((i) => i.key === value);
    if (activeIndex < 0) {
        activeIndex = items.findIndex((i) => !i.disabled);
        if (activeIndex < 0) activeIndex = 0;
    }

    const isScrollable = scrollable !== false;
    const shouldWrap = allowWrap ?? !isScrollable;

    const sizing =
        size === 'sm'
            ? 'px-2.5 py-1 text-xs'
            : 'px-3 py-1.5 text-sm'; // md default

    const containerClasses = clsx(
        // outer
        'relative',
        // layout: inline row of “pills”
        'p-1 rounded-xl border',
        'bg-gray-50 border-gray-200',
        'dark:bg-gray-900/70 dark:border-gray-800',
        // spacing + overflow behavior
        'flex items-center gap-1.5 sm:gap-2',
        shouldWrap ? 'flex-wrap' : 'whitespace-nowrap',
        isScrollable && 'overflow-x-auto',
        fullWidth ? 'w-full' : 'w-fit',
        // avoid pulling focus outline behind border
        'focus-within:ring-1 focus-within:ring-emerald-500',
        className
    );

    // Ensure refs length matches items length
    useEffect(() => {
        refs.current = refs.current.slice(0, items.length);
    }, [items.length]);

    // Auto-scroll active tab into view on change
    useEffect(() => {
        const btn = refs.current[activeIndex];
        const wrap = listRef.current;
        if (btn && wrap && isScrollable) {
            // If button is partially out of view, scroll smoothly
            const btnRect = btn.getBoundingClientRect();
            const wrapRect = wrap.getBoundingClientRect();
            const overshootLeft = btnRect.left < wrapRect.left + 8;
            const overshootRight = btnRect.right > wrapRect.right - 8;
            if (overshootLeft || overshootRight) {
                btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [value, activeIndex, isScrollable]);

    const buttons = useMemo(
        () =>
            items.map((it, i) => {
                const active = i === activeIndex;
                const id = `${baseId}-tab-${i}`;
                const panelId = `${baseId}-panel-${i}`;

                const common =
                    'rounded-lg font-medium transition-colors outline-none ' +
                    'focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ' +
                    'focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900';

                const state = it.disabled
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : active
                        ? // active pill
                        'bg-white text-gray-900 shadow-sm border border-gray-200 ' +
                        'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100'
                        : // inactive
                        'text-gray-600 hover:text-gray-900 ' +
                        'dark:text-gray-400 dark:hover:text-gray-100';

                return (
                    <button
                        key={it.key}
                        ref={(el) => {
                            refs.current[i] = el;
                        }}
                        id={id}
                        role="tab"
                        aria-selected={active}
                        aria-controls={panelId}
                        tabIndex={active ? 0 : -1}
                        disabled={!!it.disabled}
                        onClick={() => !it.disabled && onChange(it.key)}
                        className={clsx(sizing, common, state, fullWidth && !isScrollable && 'flex-1')}
                    >
                        <span className="inline-flex items-center gap-1">
                            {it.label}
                            {it.badge != null && (
                                <span
                                    className={clsx(
                                        'inline-flex min-w-5 h-5 items-center justify-center px-1 rounded-full',
                                        'text-[10px] leading-none border',
                                        'bg-gray-100 text-gray-700 border-gray-200',
                                        'dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
                                    )}
                                >
                                    {it.badge}
                                </span>
                            )}
                        </span>
                    </button>
                );
            }),
        [items, activeIndex, baseId, fullWidth, isScrollable, sizing, onChange]
    );

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
                e.preventDefault();
                moveActive(1);
                break;
            case 'ArrowLeft':
            case 'Left':
                e.preventDefault();
                moveActive(-1);
                break;
            case 'Home': {
                e.preventDefault();
                const firstEnabled = items.findIndex((i) => !i.disabled);
                if (firstEnabled >= 0) {
                    onChange(items[firstEnabled].key);
                    focusIndex(firstEnabled);
                }
                break;
            }
            case 'End': {
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
    }

    return (
        <div
            ref={listRef}
            role="tablist"
            aria-orientation="horizontal"
            className={containerClasses}
            onKeyDown={onKeyDown}
        >
            {buttons}
        </div>
    );
}
