import api from '@/lib/api';
import type { Insurer, PaginatedResponse } from '@/types/api.types';

export const insurersService = {
  list: async (params?: { search?: string; cursor?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const { data } = await api.get<PaginatedResponse<Insurer>>(`/insurers?${query}`);
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<Insurer>(`/insurers/${id}`);
    return data;
  },

  create: async (payload: Partial<Insurer>) => {
    const { data } = await api.post<Insurer>('/insurers', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Insurer>) => {
    const { data } = await api.patch<Insurer>(`/insurers/${id}`, payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/insurers/${id}`);
    return data;
  },
};
