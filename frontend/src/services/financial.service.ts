import api from '@/lib/api';
import type { Receivable, PaginatedResponse } from '@/types/api.types';

export interface CommissionPayment {
  id: string;
  sellerId: string;
  receivableId: string;
  amountCents: number;
  paidDate?: string;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  seller?: { id: string; name: string };
  receivable?: {
    id: string;
    installmentNumber: number;
    grossAmountCents: number;
    policy?: { id: string; policyNumber: string };
  };
}

export interface CommissionSummary {
  sellerId: string;
  sellerName: string;
  totalCents: number;
  paidCents: number;
  pendingCents: number;
  count: number;
}

export const financialService = {
  listReceivables: async (params?: {
    status?: string; clientId?: string; policyId?: string;
    dueDateFrom?: string; dueDateTo?: string;
    cursor?: string; limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.clientId) query.set('clientId', params.clientId);
    if (params?.policyId) query.set('policyId', params.policyId);
    if (params?.dueDateFrom) query.set('dueDateFrom', params.dueDateFrom);
    if (params?.dueDateTo) query.set('dueDateTo', params.dueDateTo);
    if (params?.cursor) query.set('cursor', params.cursor);
    query.set('limit', String(params?.limit || 50));
    const { data } = await api.get<PaginatedResponse<Receivable>>(`/receivables?${query}`);
    return data;
  },

  getReceivable: async (id: string) => {
    const { data } = await api.get<Receivable>(`/receivables/${id}`);
    return data;
  },

  updateReceivable: async (id: string, payload: {
    status?: string; receivedDate?: string;
    grossAmountCents?: number; notes?: string;
  }) => {
    const { data } = await api.patch<Receivable>(`/receivables/${id}`, payload);
    return data;
  },

  listCommissions: async (params?: {
    sellerId?: string; status?: string;
    dateFrom?: string; dateTo?: string;
    cursor?: string; limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.sellerId) query.set('sellerId', params.sellerId);
    if (params?.status) query.set('status', params.status);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);
    if (params?.cursor) query.set('cursor', params.cursor);
    query.set('limit', String(params?.limit || 50));
    const { data } = await api.get<PaginatedResponse<CommissionPayment>>(`/commissions?${query}`);
    return data;
  },

  commissionSummary: async (dateFrom?: string, dateTo?: string) => {
    const query = new URLSearchParams();
    if (dateFrom) query.set('dateFrom', dateFrom);
    if (dateTo) query.set('dateTo', dateTo);
    const { data } = await api.get<CommissionSummary[]>(`/commissions/summary?${query}`);
    return data;
  },

  payCommission: async (id: string) => {
    const { data } = await api.patch(`/commissions/${id}/pay`);
    return data;
  },
};
