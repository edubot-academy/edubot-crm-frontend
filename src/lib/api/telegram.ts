// src/api/telegram.ts
// Small API helper for Telegram linking

import { api } from '@/lib/api';

export type TelegramLinkResp = { url: string };
export type TelegramStatusResp = { linked: boolean; username?: string | null };

export async function getTelegramLink() {
    const { data } = await api.get<TelegramLinkResp>('/notifications/telegram/link');
    return data;
}

// Optional: if you expose a status endpoint like GET /notifications/telegram/status
export async function getTelegramStatus() {
    const { data } = await api.get<TelegramStatusResp>('/notifications/telegram/status');
    return data;
}

// Optional: quick ping to send a test notification after linking
export async function sendTelegramTest() {
    const { data } = await api.post<{ ok: true }>('/notifications/telegram/test', {});
    return data;
}
