import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ceilQty } from '@/lib/format';
import { DashboardListModal } from './DashboardListModal';
import { StatChip } from './StatChip';
import { SummaryCardShell } from './SummaryCardShell';
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

// `entries` arrives already sorted earliest-expiry-first; filtering into groups
// preserves that order, so no re-sort is needed within each group.
function groupEntries(entries: ExpiringSoonEntry[]) {
  return GROUP_ORDER.map((group) => ({
    group,
    items: entries.filter((e) => e.group === group),
  })).filter((g) => g.items.length > 0);
}

function ExpiringSoonList({ entries }: { entries: ExpiringSoonEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">Nothing expiring in the next 30 days.</p>;
  }
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

  const todayCount = entries.filter((e) => e.group === 'TODAY').length;
  const thisWeekCount = entries.filter((e) => e.group === 'TOMORROW' || e.group === 'THIS_WEEK').length;
  const laterCount = entries.filter((e) => e.group === 'LATER').length;
  const next = entries[0];

  return (
    <>
      <SummaryCardShell icon={CalendarClock} title="Expiring soon" onClick={() => setModalOpen(true)}>
        <div className="flex gap-2">
          <StatChip label="Today" value={todayCount} tone="destructive" />
          <StatChip label="This week" value={thisWeekCount} tone="warning" />
          <StatChip label="Later" value={laterCount} tone="secondary" />
        </div>
        <div className="border-t pt-3">
          {next ? (
            <>
              <div className="text-muted-foreground mb-1 text-xs">Next to expire</div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{next.itemName}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {next.daysRemaining === 0 ? 'today' : `${next.daysRemaining}d`}
                </span>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">Nothing expiring soon.</div>
          )}
        </div>
      </SummaryCardShell>

      <DashboardListModal open={modalOpen} onOpenChange={setModalOpen} title="Expiring Soon">
        <ExpiringSoonList entries={entries} />
      </DashboardListModal>
    </>
  );
}
