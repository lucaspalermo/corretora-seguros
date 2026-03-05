import api from '@/lib/api';

export const reportsService = {
  monthlyReceipts: async (month: string) => {
    const { data } = await api.get(`/reports/monthly-receipts?month=${month}`);
    return data;
  },

  byInsurer: async (from: string, to: string) => {
    const { data } = await api.get(`/reports/by-insurer?from=${from}&to=${to}`);
    return data;
  },

  bySeller: async (from: string, to: string) => {
    const { data } = await api.get(`/reports/by-seller?from=${from}&to=${to}`);
    return data;
  },

  overdue: async () => {
    const { data } = await api.get('/reports/overdue');
    return data;
  },

  activePolicies: async () => {
    const { data } = await api.get('/reports/active-policies');
    return data;
  },

  commissionsByPeriod: async (from: string, to: string) => {
    const { data } = await api.get(`/reports/commissions-by-period?from=${from}&to=${to}`);
    return data;
  },
};
