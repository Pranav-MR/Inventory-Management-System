import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { roundQty } from '@/lib/format';
import type { UpcomingRecurringEntry } from '../../api/dashboard';

export function UpcomingRecurringSection({ entries }: { entries: UpcomingRecurringEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="size-4" />
          Upcoming recurring supplies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recurring deliveries scheduled.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {entries.map((entry) => (
              <Link
                key={entry.itemId}
                to={`/items/${entry.itemId}`}
                className="hover:bg-accent flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors"
              >
                <span className="truncate font-semibold">{entry.itemName}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {roundQty(entry.quantityPerDelivery)} {entry.unit} ·{' '}
                  {format(parseISO(entry.nextDeliveryDate), 'MMM d, yyyy')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
