import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ceilQty } from '@/lib/format';
import type { ExpiringSoonEntry, ExpiringSoonGroup } from '../../api/dashboard';

const GROUP_LABELS: Record<ExpiringSoonGroup, string> = {
  TODAY: 'Today',
  TOMORROW: 'Tomorrow',
  THIS_WEEK: 'This week',
  LATER: 'Later',
};

const GROUP_ORDER: ExpiringSoonGroup[] = ['TODAY', 'TOMORROW', 'THIS_WEEK', 'LATER'];

const GROUP_BADGE_VARIANT: Record<ExpiringSoonGroup, 'destructive' | 'warning' | 'secondary'> = {
  TODAY: 'destructive',
  TOMORROW: 'warning',
  THIS_WEEK: 'warning',
  LATER: 'secondary',
};

export function ExpiringSoonSection({ entries }: { entries: ExpiringSoonEntry[] }) {
  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: entries.filter((e) => e.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" />
          Expiring soon
        </CardTitle>
      </CardHeader>
      <CardContent>
        {grouped.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing expiring in the next 30 days.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map(({ group, items }) => (
              <div key={group} className="flex flex-col gap-2">
                <Badge variant={GROUP_BADGE_VARIANT[group]}>{GROUP_LABELS[group]}</Badge>
                <div className="flex flex-col gap-1">
                  {items.map((entry) => (
                    <Link
                      key={entry.itemId}
                      to={`/items/${entry.itemId}`}
                      className="hover:bg-accent flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors"
                    >
                      <span className="truncate font-semibold">{entry.itemName}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {ceilQty(entry.affectedQuantity)} {entry.unit} · {entry.batchCount} batch
                        {entry.batchCount === 1 ? '' : 'es'} ·{' '}
                        {entry.daysRemaining === 0 ? 'today' : `${entry.daysRemaining}d`}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
