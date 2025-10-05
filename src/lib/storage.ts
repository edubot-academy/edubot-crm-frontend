export type Tokens = { accessToken: string; refreshToken?: string };
const ACCESS_KEY = 'edubot.access';
const REFRESH_KEY = 'edubot.refresh';
export const tokenStore = {
    get(): Tokens | null {
        const accessToken = localStorage.getItem(ACCESS_KEY) ?? undefined;
        if (!accessToken) return null;
        const refreshToken = localStorage.getItem(REFRESH_KEY) ?? undefined;
        return { accessToken, refreshToken };
    },
    set(tok: Tokens) {
        localStorage.setItem(ACCESS_KEY, tok.accessToken);
        if (tok.refreshToken) localStorage.setItem(REFRESH_KEY, tok.refreshToken);
    },
    clear() {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
    },
};