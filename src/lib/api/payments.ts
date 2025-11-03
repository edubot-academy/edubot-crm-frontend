// Generic payments helpers for ledger, contact summary, and reports
import { api } from '@/lib/api';

export type PaymentKind = 'DEPOSIT' | 'ENROLLMENT' | 'OTHER';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'WALLET';

export type Payment = {
    id: number;
    companyId?: number;
    contactId: number;
    createdByUserId: number;
    amount: string;          // NUMERIC as string
    currency: string;        // e.g., KGS
    kind: PaymentKind;
    method: PaymentMethod;
    reference?: string | null;
    note?: string | null;
    createdAt: string;
};

export async function addDeposit(p: {
    contactId: number; amount: string; currency?: string; method?: PaymentMethod; reference?: string; note?: string;
}) {
    const { data } = await api.post('/payments/deposit', { currency: 'KGS', method: 'CASH', ...p });
    return data as Payment;
}

export async function addEnrollment(p: {
    contactId: number; amount: string; currency?: string; method?: PaymentMethod; reference?: string; note?: string;
}) {
    const { data } = await api.post('/payments/enroll', { currency: 'KGS', method: 'CASH', ...p });
    return data as Payment;
}

export async function listPayments(params: {
    page?: number; limit?: number; contactId?: number; kind?: PaymentKind; dateFrom?: string; dateTo?: string;
}) {
    const { data } = await api.get<{
        items: Payment[]; total: number; page: number; limit: number; totalPages: number;
    }>('/payments', { params });
    return data;
}

// Contact-focused convenience
export async function listPaymentsForContact(contactId: number, limit = 50) {
    return listPayments({ contactId, page: 1, limit });
}

// Reports
export async function reportByUser(params: { dateFrom?: string; dateTo?: string; assigneeId?: number; kind?: PaymentKind }) {
    const { data } = await api.get('/payments/report/by-user', { params });
    return data as { items: Array<{ userId: number; userName: string; role: string; totalAmount: string; paymentsCount: number; enrollCount: number }>; filters: any };
}

export async function reportByRole(params: { dateFrom?: string; dateTo?: string; assigneeId?: number; kind?: PaymentKind }) {
    const { data } = await api.get('/payments/report/by-role', { params });
    return data as { items: Array<{ role: string; totalAmount: string; paymentsCount: number; enrollCount: number }>; filters: any };
}

export async function reportTimeseries(params: { dateFrom?: string; dateTo?: string; assigneeId?: number; kind?: PaymentKind; groupBy?: 'day' }) {
    const { data } = await api.get('/payments/report/timeseries', { params: { groupBy: 'day', ...params } });
    return data as { items: Array<{ bucket: string; totalAmount: string; paymentsCount: number; enrollCount: number }>; filters: any; groupBy: 'day' };
}
