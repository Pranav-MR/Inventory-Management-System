import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Item, PeriodUnit } from '../types/item';

const itemsKey = ['items'] as const;
export const itemKey = (id: string) => ['items', id] as const;

export function useItems(options: { includeArchived?: boolean } = {}) {
  return useQuery({
    queryKey: [...itemsKey, options.includeArchived ?? false],
    queryFn: () =>
      apiClient
        .get<Item[]>('/items', { params: options.includeArchived ? { includeArchived: 'true' } : {} })
        .then((r) => r.data),
  });
}

export function useItem(itemId: string) {
  return useQuery({
    queryKey: itemKey(itemId),
    queryFn: () => apiClient.get<Item>(`/items/${itemId}`).then((r) => r.data),
    enabled: !!itemId,
  });
}

export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; unit: string; category?: string; lowStockThreshold?: number }) =>
      apiClient.post<Item>('/items', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useArchiveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => apiClient.delete(`/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useDeleteItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => apiClient.delete(`/items/${itemId}/permanent`),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKey }),
  });
}

export function useSetConsumptionRate(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { ratePerPeriod: number; periodUnit: PeriodUnit }) =>
      apiClient.put(`/items/${itemId}/consumption-rate`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}

export function useSetRecurringSupply(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      intervalValue: number;
      intervalUnit: PeriodUnit;
      quantityPerDelivery: number;
      nextExpectedDeliveryDate: string;
      assumedExpiryForFuture?: string | null;
      isActive?: boolean;
    }) => apiClient.put(`/items/${itemId}/recurring-supply`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}

export function useDeleteRecurringSupply(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete(`/items/${itemId}/recurring-supply`),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}
