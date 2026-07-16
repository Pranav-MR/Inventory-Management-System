import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface DashboardSummary {
  totalItems: number;
  lowStockCount: number;
  expiringSoonCount: number;
  actionNeededCount: number;
}

export type ExpiringSoonGroup = 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'LATER';

export interface ExpiringSoonEntry {
  itemId: string;
  itemName: string;
  unit: string;
  group: ExpiringSoonGroup;
  daysRemaining: number;
  affectedQuantity: number;
  batchCount: number;
}

export interface LowStockEntry {
  itemId: string;
  itemName: string;
  unit: string;
  currentQuantity: number;
  daysOfStockRemaining: number;
}

export interface UpcomingRecurringEntry {
  itemId: string;
  itemName: string;
  unit: string;
  nextDeliveryDate: string;
  quantityPerDelivery: number;
  daysUntil: number;
}

export type ActivityType =
  | 'ITEM_ADDED'
  | 'ITEM_EDITED'
  | 'ITEM_ARCHIVED'
  | 'ITEM_DELETED'
  | 'BATCH_ADDED'
  | 'BATCH_EDITED'
  | 'BATCH_DELETED'
  | 'CONSUMPTION_RECORDED';

export interface ActivityEntry {
  id: string;
  itemId: string | null;
  itemName: string;
  type: ActivityType;
  message: string;
  createdAt: string;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  expiringSoon: ExpiringSoonEntry[];
  lowStock: LowStockEntry[];
  upcomingRecurring: UpcomingRecurringEntry[];
  recentActivity: ActivityEntry[];
  overview: {
    totalBatches: number;
    archivedItems: number;
    totalActiveItems: number;
    lastInventoryUpdate: string | null;
  };
  filterItemIds: {
    lowStock: string[];
    expiringSoon: string[];
    needsAction: string[];
  };
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => apiClient.get<DashboardOverview>('/dashboard/overview').then((r) => r.data),
  });
}
