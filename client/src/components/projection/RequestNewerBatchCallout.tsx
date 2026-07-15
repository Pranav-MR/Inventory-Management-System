import { format, parseISO } from 'date-fns';
import { Info } from 'lucide-react';

export function RequestNewerBatchCallout({ requestNewerExpiryFromDate }: { requestNewerExpiryFromDate: string | null }) {
  if (!requestNewerExpiryFromDate) return null;

  const isPast = new Date(requestNewerExpiryFromDate) <= new Date();

  return (
    <div className="border-success/20 border-l-success bg-success/6 text-success flex items-center gap-3 rounded-xl border border-l-[3px] px-4 py-3.5 text-[13.5px] shadow-[0_0_24px_rgba(74,222,128,0.12)] backdrop-blur-lg">
      <Info className="size-[18px] shrink-0" />
      {isPast ? (
        <span>Request a batch with a later expiry date going forward — the current expiry can no longer be fully consumed in time.</span>
      ) : (
        <span>
          Continue accepting the current expiry until{' '}
          <strong className="font-bold">{format(parseISO(requestNewerExpiryFromDate), 'MMM d, yyyy')}</strong>; after that, request
          a batch with a later expiry date.
        </span>
      )}
    </div>
  );
}
