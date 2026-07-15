import { format, parseISO } from 'date-fns';
import { Info } from 'lucide-react';

export function RequestNewerBatchCallout({ requestNewerExpiryFromDate }: { requestNewerExpiryFromDate: string | null }) {
  if (!requestNewerExpiryFromDate) return null;

  const isPast = new Date(requestNewerExpiryFromDate) <= new Date();

  return (
    <div className="border-primary/30 bg-primary/5 text-foreground flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm">
      <Info className="text-primary mt-0.5 size-4 shrink-0" />
      {isPast ? (
        <span>Request a batch with a later expiry date going forward — the current expiry can no longer be fully consumed in time.</span>
      ) : (
        <span>
          Continue accepting the current expiry until{' '}
          <strong className="font-semibold">{format(parseISO(requestNewerExpiryFromDate), 'MMM d, yyyy')}</strong>; after that,
          request a batch with a later expiry date.
        </span>
      )}
    </div>
  );
}
