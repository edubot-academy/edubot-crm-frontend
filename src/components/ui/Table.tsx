import React from 'react';
import clsx from 'clsx';

export function Table({ children }: { children: React.ReactNode }) {
    return (
        <table
            className="
        table w-full border-collapse
        text-sm text-gray-900
        dark:text-gray-100
      "
        >
            {children}
        </table>
    );
}

export function THead({ children }: { children: React.ReactNode }) {
    const trBase = 'border-b border-gray-200 dark:border-gray-700';
    const thBase =
        'px-3 py-2 text-left text-sm font-semibold bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-200';

    const normalized = React.Children.map(children, (row) => {
        if (!React.isValidElement(row) || row.type !== 'tr') return row;

        const tr = row as React.ReactElement<{ children?: React.ReactNode; className?: string }>;
        const cells = React.Children.map(tr.props.children, (cell) => {
            if (!React.isValidElement(cell) || cell.type !== 'th') return cell;
            const cellEl = cell as React.ReactElement<{ className?: string }>;
            return React.cloneElement(cellEl, {
                className: clsx(thBase, cellEl.props.className),
            });
        });

        return React.cloneElement(tr, {
            className: clsx(trBase, tr.props.className),
            children: cells,
        });
    });

    // Keep header text color defaults here (bg is per <th>)
    return (
        <thead className="text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 z-20 relative">
            {normalized}
        </thead>
    );
}


export function TBody({ children }: { children: React.ReactNode }) {
    return (
        <tbody
            className="
        divide-y divide-gray-100
        dark:divide-gray-800
        bg-white dark:bg-gray-900
      "
        >
            {children}
        </tbody>
    );
}
