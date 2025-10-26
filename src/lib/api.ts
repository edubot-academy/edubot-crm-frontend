import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, REFRESH_ENABLED } from './env';
import { tokenStore } from './storage';

// Extend config to track one-time retry
declare module 'axios' {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    export interface AxiosRequestConfig {
        _retried?: boolean;
    }
}

export const api = axios.create({ baseURL: API_BASE_URL, withCredentials: false });

api.interceptors.request.use((config) => {
    const tokens = tokenStore.get();
    if (tokens?.accessToken) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
});

// === Refresh handling ===
let refreshing = false;
let queueResolvers: Array<() => void> = [];

function isAuthRefresh(config?: AxiosRequestConfig) {
    if (!config?.url) return false;
    // Works whether you pass full URL or relative
    return String(config.url).includes('/auth/refresh');
}

function redirectToLogin() {
    tokenStore.clear();
    // Optional: show a message before redirecting
    // toast.push({ title: 'Сессия бүттү', message: 'Кайра кириңиз.' });
    window.location.href = '/login';
}

api.interceptors.response.use(
    (r) => r,
    async (error: AxiosError<any>) => {
        const { response, config } = error;
        const status = response?.status;

        if (!response || !config) return Promise.reject(error);

        const notRefreshable =
            !REFRESH_ENABLED || (config as any)._retried || isAuthRefresh(config);


        // 403 → permission issue, NEVER redirect; bubble up so UI can toast
        if (status === 403) {
            return Promise.reject(error);
        }
        // 401 and not refreshable → redirect to login
        if (status === 401 && notRefreshable) {
            redirectToLogin();
            return Promise.reject(error);
        }

        // Only attempt refresh for 401; anything else just bubble up
        if (status !== 401) return Promise.reject(error);

        // ---- Refresh flow for 401 ----
        const original = config as AxiosRequestConfig & { _retried?: boolean };

        if (refreshing) {
            await new Promise<void>((resolve) => queueResolvers.push(resolve));
            const tokens = tokenStore.get();
            if (!tokens?.accessToken) {
                redirectToLogin();
                return Promise.reject(error);
            }
            original._retried = true;
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${tokens.accessToken}`;
            return api(original);
        }

        try {
            refreshing = true;

            const refreshToken = tokenStore.get()?.refreshToken;
            if (!refreshToken) {
                redirectToLogin();
                return Promise.reject(error);
            }

            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

            tokenStore.set(data);

            queueResolvers.forEach((res) => res());
            queueResolvers = [];

            original._retried = true;
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${data.accessToken ?? tokenStore.get()?.accessToken}`;
            return api(original);
        } catch (e) {
            queueResolvers.forEach((res) => res());
            queueResolvers = [];
            redirectToLogin();
            return Promise.reject(e);
        } finally {
            refreshing = false;
        }
    }
);

export async function acceptInvite(token: string, password: string) {
    const { data } = await api.post('/auth/accept-invite', { token, password });
    // Option A: backend returns tokens -> store & redirect to app
    // Option B: just 200 -> redirect to /login
    return data;
}
