import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { useItems } from '../api/items';
import { useDashboardOverview } from '../api/dashboard';
import { ItemForm } from '../components/items/ItemForm';
import { ItemListTable } from '../components/items/ItemListTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type FilterKey = 'low-stock' | 'expiring-soon' | 'needs-action';

const FILTER_LABELS: Record<FilterKey, string> = {
  'low-stock': 'Low stock',
  'expiring-soon': 'Expiring soon',
  'needs-action': 'Needs action',
};

export function ItemsPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data: items, isLoading, error } = useItems({ includeArchived });
  const { data: overview } = useDashboardOverview();
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = searchParams.get('filter') as FilterKey | null;

  const filterIds = useMemo(() => {
    if (!filter || !overview) return null;
    if (filter === 'low-stock') return new Set(overview.filterItemIds.lowStock);
    if (filter === 'expiring-soon') return new Set(overview.filterItemIds.expiringSoon);
    if (filter === 'needs-action') return new Set(overview.filterItemIds.needsAction);
    return null;
  }, [filter, overview]);

  const displayedItems = filterIds ? items?.filter((item) => filterIds.has(item.id)) : items;

  function clearFilter() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('filter');
      return next;
    });
  }

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

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Switch id="include-archived" checked={includeArchived} onCheckedChange={setIncludeArchived} />
          <Label htmlFor="include-archived" className="text-muted-foreground font-normal">
            Show archived items
          </Label>
        </div>

        {filter && (
          <Badge variant="secondary" className="gap-1.5 py-1 pr-1 pl-2.5">
            Filtered by: {FILTER_LABELS[filter]}
            <button
              type="button"
              onClick={clearFilter}
              aria-label="Clear filter"
              className="hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X className="size-3" />
            </button>
          </Badge>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      )}
      {error && <p className="text-destructive text-sm">Could not load items.</p>}
      {displayedItems && filter && displayedItems.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border px-5 py-10 text-center text-sm">
          No items match this filter.{' '}
          <Button variant="link" className="h-auto p-0 text-sm" onClick={clearFilter}>
            Clear it
          </Button>{' '}
          to see everything.
        </div>
      ) : (
        displayedItems && <ItemListTable items={displayedItems} />
      )}
    </div>
  );
}
