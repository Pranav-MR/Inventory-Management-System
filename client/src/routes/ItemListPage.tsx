import { useState } from 'react';
import { useItems } from '../api/items';
import { ItemForm } from '../components/items/ItemForm';
import { ItemListTable } from '../components/items/ItemListTable';
import { DashboardSummaryCards } from '../components/items/DashboardSummaryCards';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ItemListPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: items, isLoading, error } = useItems({ includeArchived });

  return (
    <div className="flex flex-col gap-6">
      <DashboardSummaryCards />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Items</h2>
          <p className="text-muted-foreground text-sm">Track batches, expiry, and consumption for every item.</p>
        </div>
        <ItemForm />
      </div>

      <div className="flex items-center gap-2">
        <Switch id="include-archived" checked={includeArchived} onCheckedChange={setIncludeArchived} />
        <Label htmlFor="include-archived" className="text-muted-foreground font-normal">
          Show archived items
        </Label>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      )}
      {error && <p className="text-destructive text-sm">Could not load items.</p>}
      {items && <ItemListTable items={items} />}
    </div>
  );
}
