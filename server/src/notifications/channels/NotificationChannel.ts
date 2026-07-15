export interface NotificationMessage {
  to: string;
  subject: string;
  body: string;
}

export interface NotificationSendResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface NotificationChannel {
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  send(message: NotificationMessage): Promise<NotificationSendResult>;
}
