import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { roundQty } from '@/lib/format';
import { DashboardListModal } from './DashboardListModal';
import { StatChip } from './StatChip';
import { SummaryCardShell } from './SummaryCardShell';
import type { LowStockEntry } from '../../api/dashboard';

const CRITICAL_DAYS_THRESHOLD = 3;

function LowStockList({ entries }: { entries: LowStockEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">Nothing is running low right now.</p>;
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
            {roundQty(entry.currentQuantity)} {entry.unit} left · ~{entry.daysOfStockRemaining}d remaining
          </span>
        </Link>
      ))}
    </div>
  );
}

export function LowStockSection({ entries }: { entries: LowStockEntry[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  const criticalCount = entries.filter((e) => e.daysOfStockRemaining <= CRITICAL_DAYS_THRESHOLD).length;
  const lowCount = entries.length - criticalCount;
  const mostCritical = entries[0];

  return (
    <>
      <SummaryCardShell icon={PackageSearch} title="Low stock" onClick={() => setModalOpen(true)}>
        <div className="flex gap-2">
          <StatChip label="Critical" value={criticalCount} tone="destructive" />
          <StatChip label="Low stock" value={lowCount} tone="warning" />
        </div>
        <div className="border-t pt-3">
          {mostCritical ? (
            <>
              <div className="text-muted-foreground mb-1 text-xs">Most critical</div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{mostCritical.itemName}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {roundQty(mostCritical.currentQuantity)} {mostCritical.unit} · ~{mostCritical.daysOfStockRemaining}d
                </span>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">Nothing is running low right now.</div>
          )}
        </div>
      </SummaryCardShell>

      <DashboardListModal open={modalOpen} onOpenChange={setModalOpen} title="Low Stock">
        <LowStockList entries={entries} />
      </DashboardListModal>
    </>
  );
}
