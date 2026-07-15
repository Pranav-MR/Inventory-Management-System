import nodemailer from 'nodemailer';
import { env } from '../../lib/env.js';
import type { NotificationChannel, NotificationMessage, NotificationSendResult } from './NotificationChannel.js';

// No SMTP configured (e.g. local dev) -> fall back to a JSON transport so
// sends succeed and are logged instead of hard-failing the whole pipeline.
const isConfigured = Boolean(env.SMTP_HOST);
const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export const emailChannel: NotificationChannel = {
  type: 'EMAIL',
  async send(message: NotificationMessage): Promise<NotificationSendResult> {
    try {
      const info = await transporter.sendMail({
        from: env.SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.body,
      });
      if (!isConfigured) {
        console.log(`[email:dev] to=${message.to} subject="${message.subject}"\n${message.body}`);
      }
      return { success: true, providerMessageId: info.messageId };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
