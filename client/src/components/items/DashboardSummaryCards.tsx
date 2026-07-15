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
  iconGradient,
  iconGlow,
  criticalWhenPositive,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  iconGradient: string;
  iconGlow: string;
  criticalWhenPositive?: boolean;
}) {
  const active = criticalWhenPositive && value > 0;

  return (
    <Card
      className={cn(
        active &&
          'border-destructive/30 shadow-[0_8px_32px_rgba(249,115,22,0.15),0_0_26px_rgba(249,115,22,0.2)]',
      )}
    >
      <CardContent className="px-5 py-4">
        <div
          className="mb-3.5 flex size-[42px] shrink-0 items-center justify-center rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]"
          style={{ background: iconGradient, boxShadow: `${iconGlow}, inset 0 1px 1px rgba(255,255,255,0.35)` }}
        >
          <Icon className="size-5 text-white" />
        </div>
        <div className="font-mono text-[30px] leading-none font-bold tabular-nums">{value}</div>
        <div className="text-muted-foreground mt-1.5 text-[13px]">{label}</div>
      </CardContent>
    </Card>
  );
}

const GRADIENTS: Record<string, { bg: string; glow: string }> = {
  greenCyan: { bg: 'linear-gradient(135deg,#4ade80,#22d3ee)', glow: '0 6px 18px rgba(34,211,238,0.45)' },
  purple: { bg: 'linear-gradient(135deg,#a855f7,#7c3aed)', glow: '0 6px 18px rgba(168,85,247,0.5)' },
  orangeGreen: { bg: 'linear-gradient(135deg,#f97316,#4ade80)', glow: '0 6px 18px rgba(249,115,22,0.5)' },
  amber: { bg: 'linear-gradient(135deg,#fbbf24,#f59e0b)', glow: '0 6px 18px rgba(251,191,36,0.4)' },
};

export function DashboardSummaryCards() {
  const { data: summary, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[124px]" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
      <Stat
        label="Total items"
        value={summary.totalItems}
        icon={Boxes}
        iconGradient={GRADIENTS.greenCyan.bg}
        iconGlow={GRADIENTS.greenCyan.glow}
      />
      <Stat
        label="Low stock"
        value={summary.lowStockCount}
        icon={PackageSearch}
        iconGradient={GRADIENTS.purple.bg}
        iconGlow={GRADIENTS.purple.glow}
      />
      <Stat
        label="Expiring soon"
        value={summary.expiringSoonCount}
        icon={CalendarClock}
        iconGradient={GRADIENTS.amber.bg}
        iconGlow={GRADIENTS.amber.glow}
      />
      <Stat
        label="Needs action"
        value={summary.actionNeededCount}
        icon={AlertTriangle}
        iconGradient={GRADIENTS.orangeGreen.bg}
        iconGlow={GRADIENTS.orangeGreen.glow}
        criticalWhenPositive
      />
    </div>
  );
}

