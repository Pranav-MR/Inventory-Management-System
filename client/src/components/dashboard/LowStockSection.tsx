import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { roundQty } from '@/lib/format';
import { DashboardListModal } from './DashboardListModal';
import { ViewMoreButton } from './ViewMoreButton';
import type { LowStockEntry } from '../../api/dashboard';

const PREVIEW_COUNT = 5;

function LowStockList({ entries }: { entries: LowStockEntry[] }) {
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
  const preview = entries.slice(0, PREVIEW_COUNT);
  const remaining = entries.length - PREVIEW_COUNT;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PackageSearch className="size-4" />
          Low stock
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="h-[280px] overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Nothing is running low right now.
            </div>
          ) : (
            <LowStockList entries={preview} />
          )}
        </div>
        {remaining > 0 && <ViewMoreButton remaining={remaining} onClick={() => setModalOpen(true)} />}
      </CardContent>

      <DashboardListModal open={modalOpen} onOpenChange={setModalOpen} title="Low Stock">
        <LowStockList entries={entries} />
      </DashboardListModal>
    </Card>
  );
}
