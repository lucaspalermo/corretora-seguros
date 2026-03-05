import api from '@/lib/api';
import type { Seller, PaginatedResponse } from '@/types/api.types';

export const sellersService = {
  list: async (params?: { search?: string; cursor?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const { data } = await api.get<PaginatedResponse<Seller>>(`/sellers?${query}`);
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<Seller>(`/sellers/${id}`);
    return data;
  },

  create: async (payload: Partial<Seller>) => {
    const { data } = await api.post<Seller>('/sellers', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Seller>) => {
    const { data } = await api.patch<Seller>(`/sellers/${id}`, payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete(`/sellers/${id}`);
    return data;
  },
};
