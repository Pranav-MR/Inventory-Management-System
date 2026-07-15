import type { NotificationChannelType } from '@prisma/client';
import { emailChannel } from './channels/EmailChannel.js';
import type { NotificationChannel } from './channels/NotificationChannel.js';

// SMS/WhatsApp channels (e.g. Twilio) register here later, keyed the same way.
export const channelRegistry = new Map<NotificationChannelType, NotificationChannel>([['EMAIL', emailChannel]]);
