import { format, parseISO } from 'date-fns';
import { AlertTriangle, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProjectionSummary } from '../../types/projection';

export function ExpiryWarningBanner({ summary }: { summary: ProjectionSummary }) {
  const banners: { tone: 'critical' | 'warning'; text: string }[] = [];

  if (summary.hasExpiryWasteWarning) {
    banners.push({
      tone: 'critical',
      text: 'Some current stock is projected to expire before it can be consumed.',
    });
  }
  if (summary.daysOfStockRemaining !== null && summary.daysOfStockRemaining <= 14) {
    banners.push({
      tone: 'warning',
      text: `Stock is projected to run out in ${summary.daysOfStockRemaining} day(s).`,
    });
  }
  if (summary.nextExpiryDate) {
    const days = Math.round((new Date(summary.nextExpiryDate).getTime() - Date.now()) / 86_400_000);
    if (days >= 0 && days <= 30) {
      banners.push({
        tone: 'warning',
        text: `Soonest batch expires on ${format(parseISO(summary.nextExpiryDate), 'MMM d, yyyy')} (${days} day(s) away).`,
      });
    }
  }

  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {banners.map((b, i) => (
        <div
          key={i}
          className={cn(
            'flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm',
            b.tone === 'critical'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-warning/30 bg-warning/10 text-warning-foreground dark:text-warning',
          )}
        >
          {b.tone === 'critical' ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          ) : (
            <CalendarClock className="mt-0.5 size-4 shrink-0" />
          )}
          {b.text}
        </div>
      ))}
    </div>
  );
}
