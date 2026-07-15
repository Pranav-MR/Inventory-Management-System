import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';
import type { ProjectionSummary, SimulationResult } from '../types/projection';

export function useProjectionSummary(itemId: string) {
  return useQuery({
    queryKey: ['items', itemId, 'projection', 'summary'],
    queryFn: () => apiClient.get<ProjectionSummary>(`/items/${itemId}/projection/summary`).then((r) => r.data),
    enabled: !!itemId,
    retry: false,
  });
}

export function useProjection(itemId: string, horizonDays = 365) {
  return useQuery({
    queryKey: ['items', itemId, 'projection', horizonDays],
    queryFn: () =>
      apiClient
        .get<SimulationResult>(`/items/${itemId}/projection`, { params: { horizonDays } })
        .then((r) => r.data),
    enabled: !!itemId,
    retry: false,
  });
}
