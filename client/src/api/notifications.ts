import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { NotificationLog, NotificationPreference } from '../types/notification';

const preferencesKey = ['notification-preferences'] as const;

export function useNotificationPreferences() {
  return useQuery({
    queryKey: preferencesKey,
    queryFn: () => apiClient.get<NotificationPreference[]>('/notification-preferences').then((r) => r.data),
  });
}

export function useUpsertNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotificationPreference[]) =>
      apiClient.put<NotificationPreference[]>('/notification-preferences', prefs).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: preferencesKey }),
  });
}

export function useNotificationLogs() {
  return useQuery({
    queryKey: ['notification-logs'],
    queryFn: () => apiClient.get<NotificationLog[]>('/notification-logs').then((r) => r.data),
  });
}
