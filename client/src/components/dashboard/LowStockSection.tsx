import { Link } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { roundQty } from '@/lib/format';
import type { LowStockEntry } from '../../api/dashboard';

export function LowStockSection({ entries }: { entries: LowStockEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PackageSearch className="size-4" />
          Low stock
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing is running low right now.</p>
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
                  {roundQty(entry.currentQuantity)} {entry.unit} left · ~{entry.daysOfStockRemaining}d remaining
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
