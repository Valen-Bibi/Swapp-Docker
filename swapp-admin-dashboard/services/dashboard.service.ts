import { api } from "@/lib/api";
import { DashboardMetrics } from "@/types/dashboard";

export const DashboardService = {
  getSummary: async (): Promise<DashboardMetrics> => {
    const timestamp = new Date().getTime();
    const { data } = await api.get(`/api/dashboard/admin/summary?t=${timestamp}`);
    return data;
  },
};