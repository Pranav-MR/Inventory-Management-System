import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ceilQty } from '@/lib/format';
import { DashboardListModal } from './DashboardListModal';
import { ViewMoreButton } from './ViewMoreButton';
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

const PREVIEW_COUNT = 8;

// `entries` arrives already sorted earliest-expiry-first; filtering into groups
// preserves that order, so no re-sort is needed within each group.
function groupEntries(entries: ExpiringSoonEntry[]) {
  return GROUP_ORDER.map((group) => ({
    group,
    items: entries.filter((e) => e.group === group),
  })).filter((g) => g.items.length > 0);
}

function ExpiringSoonList({ entries }: { entries: ExpiringSoonEntry[] }) {
  const grouped = groupEntries(entries);
  return (
    <div className="flex flex-col gap-3">
      {grouped.map(({ group, items }) => (
        <div key={group} className="flex flex-col gap-1">
          <Badge variant={GROUP_BADGE_VARIANT[group]}>{GROUP_LABELS[group]}</Badge>
          <div className="flex flex-col">
            {items.map((entry) => (
              <Link
                key={entry.itemId}
                to={`/items/${entry.itemId}`}
                className="hover:bg-accent flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
              >
                <span className="truncate font-semibold">{entry.itemName}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {ceilQty(entry.affectedQuantity)} {entry.unit} · {entry.batchCount} batch
                  {entry.batchCount === 1 ? '' : 'es'} · {entry.daysRemaining === 0 ? 'today' : `${entry.daysRemaining}d`}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExpiringSoonSection({ entries }: { entries: ExpiringSoonEntry[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const preview = entries.slice(0, PREVIEW_COUNT);
  const remaining = entries.length - PREVIEW_COUNT;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4" />
          Expiring soon
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="h-[360px] overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nothing expiring in the next 30 days.
            </div>
          ) : (
            <ExpiringSoonList entries={preview} />
          )}
        </div>
        {remaining > 0 && <ViewMoreButton remaining={remaining} onClick={() => setModalOpen(true)} />}
      </CardContent>

      <DashboardListModal open={modalOpen} onOpenChange={setModalOpen} title="Expiring Soon">
        <ExpiringSoonList entries={entries} />
      </DashboardListModal>
    </Card>
  );
}
