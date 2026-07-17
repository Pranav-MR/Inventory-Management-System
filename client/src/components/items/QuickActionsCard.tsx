import { Download, Plus, Upload } from 'lucide-react';
import { AcceptBatchDialog } from '../batches/AcceptBatchDialog';
import { ConsumptionEntryDialog } from './ConsumptionEntryDialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatChip } from '@/components/dashboard/StatChip';
import { roundQty } from '@/lib/format';
import type { Item } from '../../types/item';

const ACTION_BUTTON_CLASS = 'h-10 w-full justify-center text-xs';

export function QuickActionsCard({
  item,
  normalPurchaseQuantity,
}: {
  item: Item;
  normalPurchaseQuantity: number | null;
}) {
  const activeBatchCount = item.batches.filter((b) => b.status === 'ACTIVE').length;
  const currentStock = item.batches
    .filter((b) => b.status === 'ACTIVE')
    .reduce((sum, b) => sum + b.quantityRemaining, 0);

  return (
    <Card className="flex h-full flex-col gap-4">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        <div className="flex gap-2">
          <StatChip label="Total stock" value={roundQty(currentStock)} />
          <StatChip label="Active batches" value={activeBatchCount} />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <AcceptBatchDialog
            itemId={item.id}
            hasConsumptionRate={Boolean(item.consumptionRate)}
            normalPurchaseQuantity={normalPurchaseQuantity}
            trigger={
              <Button size="sm" variant="secondary" className={ACTION_BUTTON_CLASS}>
                <Plus className="size-4" />
                Add Batch
              </Button>
            }
          />
          <ConsumptionEntryDialog
            itemId={item.id}
            trigger={
              <Button size="sm" variant="secondary" className={ACTION_BUTTON_CLASS}>
                <Plus className="size-4" />
                Add Consumption
              </Button>
            }
          />
          <Button
            size="sm"
            variant="secondary"
            className={ACTION_BUTTON_CLASS}
            onClick={() => console.log('TODO: Import Inventory')}
          >
            <Download className="size-4" />
            Import Inventory
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className={ACTION_BUTTON_CLASS}
            onClick={() => console.log('TODO: Export Inventory')}
          >
            <Upload className="size-4" />
            Export Inventory
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
