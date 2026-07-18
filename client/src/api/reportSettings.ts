import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type { ReportFrequency, ReportSettings } from '../types/reportSettings';

export interface TestEmailResult {
  sent: number;
  failed: number;
  failedAddresses: string[];
}

const reportSettingsKey = ['report-settings'] as const;

export function useReportSettings() {
  return useQuery({
    queryKey: reportSettingsKey,
    queryFn: () => apiClient.get<ReportSettings>('/report-settings').then((r) => r.data),
  });
}

export function useSaveReportSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { isEnabled: boolean; recipientEmails: string[]; frequency: ReportFrequency }) =>
      apiClient.put<ReportSettings>('/report-settings', input).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: reportSettingsKey }),
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: (input: { recipientEmails: string[]; frequency: ReportFrequency }) =>
      apiClient.post<TestEmailResult>('/report-settings/test-email', input).then((r) => r.data),
  });
}
