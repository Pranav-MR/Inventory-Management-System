import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { itemKey } from './items';
import type { PeriodUnit } from '../types/item';

export interface ConsumptionEntry {
  id: string;
  date: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumptionRateHistoryEntry {
  id: string;
  ratePerPeriod: number;
  periodUnit: PeriodUnit;
  effectiveFrom: string;
}

const entriesKey = (itemId: string) => [...itemKey(itemId), 'consumption-entries'] as const;
const rateHistoryKey = (itemId: string) => [...itemKey(itemId), 'consumption-rate-history'] as const;

export function useConsumptionEntries(itemId: string) {
  return useQuery({
    queryKey: entriesKey(itemId),
    queryFn: () => apiClient.get<ConsumptionEntry[]>(`/items/${itemId}/consumption-entries`).then((r) => r.data),
    enabled: !!itemId,
  });
}

export function useConsumptionRateHistory(itemId: string) {
  return useQuery({
    queryKey: rateHistoryKey(itemId),
    queryFn: () =>
      apiClient.get<ConsumptionRateHistoryEntry[]>(`/items/${itemId}/consumption-rate/history`).then((r) => r.data),
    enabled: !!itemId,
  });
}

export function useCreateConsumptionEntry(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { date: string; quantity: number }) =>
      apiClient.post<ConsumptionEntry>(`/items/${itemId}/consumption-entries`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}

export function useUpdateConsumptionEntry(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: Partial<{ date: string; quantity: number }> }) =>
      apiClient.patch<ConsumptionEntry>(`/items/${itemId}/consumption-entries/${entryId}`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}

export function useDeleteConsumptionEntry(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => apiClient.delete(`/items/${itemId}/consumption-entries/${entryId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}
