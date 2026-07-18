export type ReportFrequency = 'WEEKLY' | 'MONTHLY';

export interface ReportSettings {
  isEnabled: boolean;
  recipientEmails: string[];
  frequency: ReportFrequency;
  lastSentAt: string | null;
}
