import type { ComponentType } from 'react';
import { format, parseISO } from 'date-fns';
import { Boxes, CalendarClock, CalendarX, Gauge, Hourglass, Layers, Package, Repeat, Truck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { roundQty } from '@/lib/format';
import type { Item } from '../../types/item';
import type { ProjectionSummary } from '../../types/projection';

const TONE_CLASSES = {
  default: 'bg-muted/40 border-border text-foreground',
  success: 'bg-success/10 border-success/30 text-success',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  destructive: 'bg-destructive/10 border-destructive/30 text-destructive',
} as const;

function OverviewStat({
  icon: Icon,
  label,
  value,
  tone = 'default',
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-lg border px-3 py-2.5', TONE_CLASSES[tone])}>
      <Icon className="mt-0.5 size-4 shrink-0 opacity-70" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11px] leading-tight font-medium opacity-80">{label}</span>
        <span className="truncate font-mono text-sm leading-tight font-bold">{value}</span>
      </div>
    </div>
  );
}

function daysUntil(dateISO: string): number {
  return Math.round((parseISO(dateISO).getTime() - Date.now()) / 86_400_000);
}

export function ItemOverviewCard({ item, summary }: { item: Item; summary: ProjectionSummary | undefined }) {
  const activeBatches = item.batches.filter((b) => b.status === 'ACTIVE');
  const currentStock = activeBatches.reduce((sum, b) => sum + b.quantityRemaining, 0);

  const nearestBatch = [...item.batches]
    .filter((b) => b.quantityRemaining > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];

  const daysOfStock = summary?.daysOfStockRemaining ?? null;
  const stockOutTone = daysOfStock === null ? 'default' : daysOfStock <= 7 ? 'destructive' : daysOfStock <= 14 ? 'warning' : 'default';

  const expiryDays = nearestBatch ? daysUntil(nearestBatch.expiryDate) : null;
  const expiryTone = expiryDays === null ? 'default' : expiryDays <= 7 ? 'destructive' : expiryDays <= 30 ? 'warning' : 'default';

  const schedule = item.recurringSupplySchedule;

  return (
    <Card className="flex h-full flex-col gap-4">
      <CardHeader>
        <CardTitle>Item Overview</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <OverviewStat icon={Package} label="Current stock" value={`${roundQty(currentStock)} ${item.unit}`} />
        <OverviewStat icon={Layers} label="Active batches" value={String(activeBatches.length)} />
        <OverviewStat
          icon={Gauge}
          label="Average consumption"
          value={
            item.consumptionRate
              ? `${roundQty(item.consumptionRate.ratePerPeriod)} ${item.unit} / ${item.consumptionRate.periodUnit.toLowerCase()}`
              : 'Not set'
          }
        />
        <OverviewStat
          icon={Hourglass}
          label="Time until stock-out"
          value={daysOfStock === null ? '—' : `${daysOfStock} day(s)`}
          tone={stockOutTone}
        />
        <OverviewStat
          icon={CalendarX}
          label="Predicted stock-out date"
          value={summary?.stockOutDate ? format(parseISO(summary.stockOutDate), 'MMM d, yyyy') : '—'}
          tone={stockOutTone}
        />
        <OverviewStat
          icon={Repeat}
          label="Recurring supply"
          value={schedule?.isActive ? 'Active' : schedule ? 'Inactive' : 'Not configured'}
          tone={schedule?.isActive ? 'success' : 'default'}
        />
        {schedule?.isActive && (
          <OverviewStat
            icon={Truck}
            label="Next scheduled delivery"
            value={`${format(parseISO(schedule.nextExpectedDeliveryDate), 'MMM d, yyyy')} · ${roundQty(schedule.quantityPerDelivery)} ${item.unit}`}
          />
        )}
        <OverviewStat
          icon={CalendarClock}
          label="Nearest expiry"
          value={nearestBatch ? format(parseISO(nearestBatch.expiryDate), 'MMM d, yyyy') : '—'}
          tone={expiryTone}
        />
        <OverviewStat
          icon={Boxes}
          label="Qty in nearest expiring batch"
          value={nearestBatch ? `${roundQty(nearestBatch.quantityRemaining)} ${item.unit}` : '—'}
          tone={expiryTone}
        />
      </CardContent>
    </Card>
  );
}
