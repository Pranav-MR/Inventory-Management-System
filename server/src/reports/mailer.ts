import nodemailer from 'nodemailer';
import { env } from '../lib/env.js';

// No SMTP configured (e.g. local dev) -> fall back to a JSON transport so sends
// succeed and are logged instead of hard-failing the whole pipeline.
const isConfigured = Boolean(env.SMTP_HOST);
export const transporter = isConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export async function sendMail(message: {
  to: string;
  subject: string;
  text: string;
  attachments: MailAttachment[];
}): Promise<void> {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: message.to,
    subject: message.subject,
    text: message.text,
    attachments: message.attachments,
  });
  if (!isConfigured) {
    console.log(`[report-email:dev] to=${message.to} subject="${message.subject}" attachments=${message.attachments.length}`);
  }
}
