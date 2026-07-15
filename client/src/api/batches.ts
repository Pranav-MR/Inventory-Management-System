import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { itemKey } from './items';
import type { Batch, BatchStatus } from '../types/item';
import type { EvaluateCandidateResult } from '../types/projection';

export function useCreateBatch(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { batchLabel?: string; receivedDate: string; expiryDate: string; quantityReceived: number }) =>
      apiClient.post<Batch>(`/items/${itemId}/batches`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}

export function useUpdateBatch(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      input,
    }: {
      batchId: string;
      input: Partial<{ batchLabel: string | null; expiryDate: string; quantityRemaining: number; status: BatchStatus }>;
    }) => apiClient.patch<Batch>(`/items/${itemId}/batches/${batchId}`, input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}

export function useDeleteBatch(itemId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => apiClient.delete(`/items/${itemId}/batches/${batchId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: itemKey(itemId) }),
  });
}

export function useEvaluateCandidateBatch(itemId: string) {
  return useMutation({
    mutationFn: (input: { quantity: number; expiryDate: string }) =>
      apiClient
        .post<EvaluateCandidateResult>(`/items/${itemId}/batches/evaluate-candidate`, input)
        .then((r) => r.data),
  });
}
