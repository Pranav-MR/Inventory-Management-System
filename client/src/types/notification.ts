export type NotificationEventType =
  | 'LOW_STOCK'
  | 'STOCK_OUT_IMMINENT'
  | 'EXPIRY_WASTE_WARNING'
  | 'REQUEST_NEWER_BATCH'
  | 'CANDIDATE_BATCH_WASTE_WARNING'
  | 'UPCOMING_DELIVERY_REMINDER';

export type NotificationChannelType = 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface NotificationPreference {
  eventType: NotificationEventType;
  channel: NotificationChannelType;
  isEnabled: boolean;
  leadTimeDays: number;
}

export interface NotificationLog {
  id: string;
  itemId: string | null;
  eventType: NotificationEventType;
  channel: NotificationChannelType;
  subject: string;
  body: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}
