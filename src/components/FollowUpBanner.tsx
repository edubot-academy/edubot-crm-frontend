import React from 'react';

export default function FollowUpBanner({ next }: { next?: string | null }) {
    if (!next) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-700
                      dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                Кийинки байланыш дайындала элек.
                {/* <button className="link ml-2">Дайында</button> */}
            </div>
        );
    }

    const d = new Date(next);
    const now = new Date();
    const isOverdue = d < now && Math.abs(+now - +d) > 60_000; // 1 min buffer
    const isToday = !isOverdue && d.toDateString() === now.toDateString();

    const style = isOverdue
        ? {
            bg: 'bg-red-50 dark:bg-red-950/60',
            br: 'border-red-200 dark:border-red-800',
            tx: 'text-red-800 dark:text-red-200',
            label: 'Кийинки байланыш мөөнөтү өтүп кетти:',
        }
        : isToday
            ? {
                bg: 'bg-amber-50 dark:bg-amber-950/60',
                br: 'border-amber-200 dark:border-amber-800',
                tx: 'text-amber-800 dark:text-amber-200',
                label: 'Бүгүн байланышуу керек:',
            }
            : {
                bg: 'bg-emerald-50 dark:bg-emerald-950/60',
                br: 'border-emerald-200 dark:border-emerald-800',
                tx: 'text-emerald-800 dark:text-emerald-200',
                label: 'Пландалган байланыш:',
            };

    return (
        <div className={`rounded-xl border ${style.br} ${style.bg} p-3 ${style.tx}`}>
            {style.label} <b className="font-semibold">{d.toLocaleString()}</b>
        </div>
    );
}
