import type { ComponentType } from 'react';
import { AlertTriangle, CalendarClock, PackageSearch, Boxes } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDashboardSummary } from '../../api/dashboard';

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: 'default' | 'warning' | 'critical';
}) {
  const iconWrapClass = cn(
    'flex size-9 shrink-0 items-center justify-center rounded-lg',
    tone === 'critical' && value > 0 && 'bg-destructive/10 text-destructive',
    tone === 'warning' && value > 0 && 'bg-warning/20 text-warning',
    (tone === 'default' || value === 0) && 'bg-primary/10 text-primary',
  );

  return (
    <Card>
      <CardContent className="flex items-center gap-3 px-5 py-4">
        <div className={iconWrapClass}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          <div className="text-muted-foreground text-xs">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSummaryCards() {
  const { data: summary, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[68px]" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Total items" value={summary.totalItems} icon={Boxes} tone="default" />
      <Stat label="Low stock" value={summary.lowStockCount} icon={PackageSearch} tone="warning" />
      <Stat label="Expiring soon" value={summary.expiringSoonCount} icon={CalendarClock} tone="warning" />
      <Stat label="Needs action" value={summary.actionNeededCount} icon={AlertTriangle} tone="critical" />
    </div>
  );
}
