import type { ReportChannel } from './ReportChannel.js';
import { emailReportChannel } from './EmailReportChannel.js';

// One entry today; adding SMS/WhatsApp/Push later is one new channel file + one
// line here, with zero changes to report generation or the templates.
export const reportChannels: Record<string, ReportChannel> = {
  EMAIL: emailReportChannel,
};
