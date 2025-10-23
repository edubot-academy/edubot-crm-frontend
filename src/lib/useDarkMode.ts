import { useEffect, useState } from 'react';

export function useDarkMode() {
    const [dark, setDark] = useState(() => {
        if (localStorage.theme === 'dark') return true;
        if (localStorage.theme === 'light') return false;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (dark) { root.classList.add('dark'); localStorage.theme = 'dark'; }
        else { root.classList.remove('dark'); localStorage.theme = 'light'; }
    }, [dark]);

    return { dark, setDark };
}
