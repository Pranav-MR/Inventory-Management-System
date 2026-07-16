import type { ComponentType } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Archive, Boxes, Clock, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InventoryOverviewSection({
  overview,
}: {
  overview: { totalBatches: number; archivedItems: number; totalActiveItems: number; lastInventoryUpdate: string | null };
}) {
  const stats: Array<{ label: string; value: string; icon: ComponentType<{ className?: string }> }> = [
    { label: 'Total active items', value: String(overview.totalActiveItems), icon: Layers },
    { label: 'Total batches', value: String(overview.totalBatches), icon: Boxes },
    { label: 'Archived items', value: String(overview.archivedItems), icon: Archive },
    {
      label: 'Last update',
      value: overview.lastInventoryUpdate
        ? formatDistanceToNow(parseISO(overview.lastInventoryUpdate), { addSuffix: true })
        : '—',
      icon: Clock,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Inventory overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex min-w-0 flex-col gap-1">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Icon className="size-3.5 shrink-0" />
                <span className="truncate">{label}</span>
              </div>
              <div className="font-mono text-lg leading-tight font-bold tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
