import api from '@/lib/api';
import type { Client, PaginatedResponse } from '@/types/api.types';

export const clientsService = {
  list: async (params?: { search?: string; cursor?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const { data } = await api.get<PaginatedResponse<Client>>(`/clients?${query}`);
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<Client & { policies: any[]; _count: any }>(`/clients/${id}`);
    return data;
  },

  create: async (payload: Partial<Client>) => {
    const { data } = await api.post<Client>('/clients', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Client>) => {
    const { data } = await api.patch<Client>(`/clients/${id}`, payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/clients/${id}`);
    return data;
  },
};
