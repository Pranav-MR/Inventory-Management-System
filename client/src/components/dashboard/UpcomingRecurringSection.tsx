import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { roundQty } from '@/lib/format';
import { DashboardListModal } from './DashboardListModal';
import { StatChip } from './StatChip';
import { SummaryCardShell } from './SummaryCardShell';
import type { UpcomingRecurringEntry } from '../../api/dashboard';

function UpcomingRecurringList({ entries }: { entries: UpcomingRecurringEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">No recurring deliveries scheduled.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => (
        <Link
          key={entry.itemId}
          to={`/items/${entry.itemId}`}
          className="hover:bg-accent flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors"
        >
          <span className="truncate font-semibold">{entry.itemName}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {roundQty(entry.quantityPerDelivery)} {entry.unit} · {format(parseISO(entry.nextDeliveryDate), 'MMM d, yyyy')}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function UpcomingRecurringSection({ entries }: { entries: UpcomingRecurringEntry[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  const dueTodayCount = entries.filter((e) => e.daysUntil <= 0).length;
  const dueThisWeekCount = entries.filter((e) => e.daysUntil >= 1 && e.daysUntil <= 7).length;
  const next = entries[0];

  return (
    <>
      <SummaryCardShell icon={RefreshCw} title="Recurring supplies" onClick={() => setModalOpen(true)}>
        <div className="flex gap-2">
          <StatChip label="Due today" value={dueTodayCount} tone="destructive" />
          <StatChip label="Due this week" value={dueThisWeekCount} tone="warning" />
        </div>
        <div className="border-t pt-3">
          {next ? (
            <>
              <div className="text-muted-foreground mb-1 text-xs">Next supply</div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{next.itemName}</span>
                <span className="text-muted-foreground shrink-0 text-xs">{format(parseISO(next.nextDeliveryDate), 'MMM d, yyyy')}</span>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">No recurring deliveries scheduled.</div>
          )}
        </div>
      </SummaryCardShell>

      <DashboardListModal open={modalOpen} onOpenChange={setModalOpen} title="Upcoming Recurring Supplies">
        <UpcomingRecurringList entries={entries} />
      </DashboardListModal>
    </>
  );
}
