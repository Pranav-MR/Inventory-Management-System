import { useState } from 'react';
import { useItems } from '../api/items';
import { ItemForm } from '../components/items/ItemForm';
import { ItemListTable } from '../components/items/ItemListTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export function ItemsPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: items, isLoading, error } = useItems({ includeArchived });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Manage your inventory, batches, expiry dates, stock levels, and recurring supplies.
          </p>
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
