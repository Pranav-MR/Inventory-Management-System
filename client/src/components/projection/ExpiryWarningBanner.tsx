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
    <div className="flex flex-col gap-2.5">
      {banners.map((b, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 rounded-xl border border-l-[3px] px-4 py-3.5 text-[13.5px] backdrop-blur-lg',
            b.tone === 'critical'
              ? 'border-destructive/20 border-l-destructive bg-destructive/6 text-destructive shadow-[0_0_24px_rgba(251,113,133,0.15)] dark:shadow-none'
              : 'border-warning/20 border-l-warning bg-warning/6 text-warning shadow-[0_0_24px_rgba(251,191,36,0.12)] dark:shadow-none',
          )}
        >
          {b.tone === 'critical' ? (
            <AlertTriangle className="size-[18px] shrink-0" />
          ) : (
            <CalendarClock className="size-[18px] shrink-0" />
          )}
          <span>{b.text}</span>
        </div>
      ))}
    </div>
  );
}
