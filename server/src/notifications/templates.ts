import type { NotificationEventType } from '@prisma/client';

export interface TemplateContext {
  itemName: string;
  unit: string;
  daysOfStockRemaining?: number;
  stockOutDate?: string;
  requestNewerExpiryFromDate?: string;
  wastedQuantity?: number;
  nextDeliveryDate?: string;
}

export function renderTemplate(eventType: NotificationEventType, ctx: TemplateContext): { subject: string; body: string } {
  switch (eventType) {
    case 'LOW_STOCK':
      return {
        subject: `Low stock: ${ctx.itemName}`,
        body: `${ctx.itemName} is running low${
          ctx.daysOfStockRemaining != null ? ` — about ${ctx.daysOfStockRemaining} day(s) of stock remaining.` : '.'
        }`,
      };
    case 'STOCK_OUT_IMMINENT':
      return {
        subject: `Stock-out coming up: ${ctx.itemName}`,
        body: `${ctx.itemName} is projected to run out${ctx.stockOutDate ? ` on ${ctx.stockOutDate}` : ' soon'}.`,
      };
    case 'EXPIRY_WASTE_WARNING':
      return {
        subject: `Expiry waste warning: ${ctx.itemName}`,
        body: `Some stock of ${ctx.itemName} is projected to expire before it can be consumed.`,
      };
    case 'REQUEST_NEWER_BATCH':
      return {
        subject: `Time to request a newer-expiry batch: ${ctx.itemName}`,
        body: `${
          ctx.requestNewerExpiryFromDate ? `From ${ctx.requestNewerExpiryFromDate}, request` : 'Request'
        } a batch of ${ctx.itemName} with a later expiry date instead of the current one.`,
      };
    case 'CANDIDATE_BATCH_WASTE_WARNING':
      return {
        subject: `Incoming batch may cause waste: ${ctx.itemName}`,
        body: `Accepting the next scheduled delivery of ${ctx.itemName} is projected to waste ~${ctx.wastedQuantity ?? 'some'} ${ctx.unit}.`,
      };
    case 'UPCOMING_DELIVERY_REMINDER':
      return {
        subject: `Upcoming delivery: ${ctx.itemName}`,
        body: `A delivery of ${ctx.itemName} is expected${ctx.nextDeliveryDate ? ` on ${ctx.nextDeliveryDate}` : ' soon'}.`,
      };
  }
}
