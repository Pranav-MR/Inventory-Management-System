import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface DashboardSummary {
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  actionNeededCount: number;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
  });
}
