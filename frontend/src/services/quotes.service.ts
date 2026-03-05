import api from '@/lib/api';

export const quotesService = {
  list: async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params || {});
    const { data } = await api.get(`/quotes?${query}`);
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get(`/quotes/${id}`);
    return data;
  },

  create: async (payload: {
    clientId: string; sellerId: string; category: string;
    riskData: string; title?: string; expiresAt?: string; notes?: string;
  }) => {
    const { data } = await api.post('/quotes', payload);
    return data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/quotes/${id}`, payload);
    return data;
  },

  addItem: async (quoteId: string, payload: {
    insurerId: string; premiumCents: number; installments?: number;
    paymentMethod?: string; brokerCommissionPct: number;
    sellerCommissionPct?: number; coverages?: string;
    conditions?: string; proposalNumber?: string;
    validUntil?: string; notes?: string;
  }) => {
    const { data } = await api.post(`/quotes/${quoteId}/items`, payload);
    return data;
  },

  updateItem: async (quoteId: string, itemId: string, payload: Record<string, unknown>) => {
    const { data } = await api.patch(`/quotes/${quoteId}/items/${itemId}`, payload);
    return data;
  },

  removeItem: async (quoteId: string, itemId: string) => {
    await api.delete(`/quotes/${quoteId}/items/${itemId}`);
  },

  selectItem: async (quoteId: string, itemId: string) => {
    const { data } = await api.post(`/quotes/${quoteId}/items/${itemId}/select`);
    return data;
  },

  convertToPolicy: async (quoteId: string, payload: {
    policyNumber: string; startDate: string; endDate?: string;
    renewalDate?: string; paymentMethod: string; autoRenew?: boolean;
  }) => {
    const { data } = await api.post(`/quotes/${quoteId}/convert`, payload);
    return data;
  },

  duplicate: async (quoteId: string) => {
    const { data } = await api.post(`/quotes/${quoteId}/duplicate`);
    return data;
  },
};
