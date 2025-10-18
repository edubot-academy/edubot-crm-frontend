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

        // If no response (network error), just bubble up
        if (!response || !config) return Promise.reject(error);

        // If refresh is disabled OR this is already a retry OR this is the refresh call itself
        const notRefreshable =
            !REFRESH_ENABLED || config._retried || isAuthRefresh(config);

        // When unauthorized/forbidden and we can't/shouldn't refresh → logout
        if ((status === 401 || status === 403) && notRefreshable) {
            redirectToLogin();
            return Promise.reject(error);
        }

        // Only attempt refresh for 401 (unauthorized), not for 403 (forbidden)
        if (status !== 401) {
            return Promise.reject(error);
        }

        // ---- Refresh flow for 401 ----
        const original = config;

        // If a refresh is in-flight, queue until it finishes
        if (refreshing) {
            await new Promise<void>((resolve) => queueResolvers.push(resolve));
            // After refresh resolves (success or fail), if tokens exist, retry once
            const tokens = tokenStore.get();
            if (!tokens?.accessToken) {
                redirectToLogin();
                return Promise.reject(error);
            }
            original._retried = true;
            // Keep headers and re-attach Authorization
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${tokens.accessToken}`;
            return api(original);
        }

        // Start a refresh
        try {
            refreshing = true;

            const refreshToken = tokenStore.get()?.refreshToken;
            if (!refreshToken) {
                redirectToLogin();
                return Promise.reject(error);
            }

            const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });

            // Expect backend to return { accessToken, refreshToken? }
            tokenStore.set(data);

            // Release queued requests
            queueResolvers.forEach((res) => res());
            queueResolvers = [];

            // Retry the original request once with new token
            original._retried = true;
            original.headers = original.headers ?? {};
            (original.headers as any).Authorization = `Bearer ${data.accessToken ?? tokenStore.get()?.accessToken}`;
            return api(original);
        } catch (e) {
            // Refresh failed → logout and reject
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
