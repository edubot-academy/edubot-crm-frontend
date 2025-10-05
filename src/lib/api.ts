import axios from 'axios';
import { API_BASE_URL, REFRESH_ENABLED } from './env';
import { tokenStore } from './storage';

export const api = axios.create({ baseURL: API_BASE_URL, withCredentials: false });

api.interceptors.request.use((config) => {
    const tokens = tokenStore.get();
    if (tokens?.accessToken) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
});

// optional refresh flow
let refreshing = false;
let queue: Array<() => void> = [];

api.interceptors.response.use(
    (r) => r,
    async (error) => {
        const { response, config } = error;
        if (response?.status === 401 && REFRESH_ENABLED && !config._retried) {
            if (refreshing) {
                await new Promise<void>((res) => queue.push(res));
                config._retried = true; // @ts-ignore
                return api(config);
            }
            try {
                refreshing = true;
                const refreshToken = tokenStore.get()?.refreshToken;
                if (!refreshToken) throw new Error('no refresh');
                const r = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
                tokenStore.set(r.data);
                queue.forEach((fn) => fn());
                queue = [];
                config._retried = true; // @ts-ignore
                return api(config);
            } catch {
                tokenStore.clear();
                window.location.href = '/login';
            } finally {
                refreshing = false;
            }
        }
        return Promise.reject(error);
    }
);