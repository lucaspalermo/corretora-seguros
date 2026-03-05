import api from '@/lib/api';
import type { Policy, PaginatedResponse } from '@/types/api.types';

export interface CreatePolicyPayload {
  clientId: string;
  insurerId: string;
  sellerId: string;
  policyNumber: string;
  category: string;
  type?: string;
  startDate: string;
  endDate?: string;
  renewalDate?: string;
  premiumCents: number;
  paymentMethod: string;
  installments: number;
  brokerCommissionPct: number;
  sellerCommissionPct: number;
  autoRenew?: boolean;
  notes?: string;
}

export const policiesService = {
  list: async (params?: {
    search?: string; cursor?: string; limit?: number;
    category?: string; type?: string; sellerId?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.category) query.set('category', params.category);
    if (params?.type) query.set('type', params.type);
    if (params?.sellerId) query.set('sellerId', params.sellerId);
    const { data } = await api.get<PaginatedResponse<Policy>>(`/policies?${query}`);
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<Policy>(`/policies/${id}`);
    return data;
  },

  create: async (payload: CreatePolicyPayload) => {
    const { data } = await api.post<Policy>('/policies', payload);
    return data;
  },

  update: async (id: string, payload: Partial<CreatePolicyPayload>) => {
    const { data } = await api.patch<Policy>(`/policies/${id}`, payload);
    return data;
  },

  cancel: async (id: string) => {
    const { data } = await api.post(`/policies/${id}/cancel`);
    return data;
  },

  getUpcomingRenewals: async () => {
    const { data } = await api.get('/policies/renewals/upcoming');
    return data;
  },

  renew: async (id: string, overrides?: {
    premiumCents?: number;
    installments?: number;
    paymentMethod?: string;
    brokerCommissionPct?: number;
    sellerCommissionPct?: number;
  }) => {
    const { data } = await api.post(`/policies/${id}/renew`, overrides || {});
    return data;
  },
};
