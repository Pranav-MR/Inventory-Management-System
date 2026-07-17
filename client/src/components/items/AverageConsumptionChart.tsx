import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { roundQty } from '@/lib/format';
import type { ConsumptionRateHistoryEntry } from '../../api/consumption';
import type { PeriodUnit } from '../../types/item';

const APPROX_DAYS_IN_PERIOD: Record<PeriodUnit, number> = {
  DAY: 1,
  WEEK: 7,
  MONTH: 30.44,
  YEAR: 365.25,
};

function ratePerDay(entry: ConsumptionRateHistoryEntry): number {
  return entry.ratePerPeriod / APPROX_DAYS_IN_PERIOD[entry.periodUnit];
}

interface ChartPoint {
  date: string;
  ratePerDay: number;
  label: string;
}

function TooltipContent({ active, payload, label }: { active?: boolean; payload?: { payload: ChartPoint }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <div className="text-muted-foreground">{format(parseISO(label), 'MMM d, yyyy')}</div>
      <div className="font-medium">{payload[0].payload.label}</div>
    </div>
  );
}

export function AverageConsumptionChart({ history }: { history: ConsumptionRateHistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">No consumption rate configured yet.</p>
    );
  }

  const data: ChartPoint[] = history.map((h) => ({
    date: h.effectiveFrom,
    ratePerDay: Math.round(ratePerDay(h) * 100) / 100,
    label: `${roundQty(h.ratePerPeriod)} / ${h.periodUnit.toLowerCase()}`,
  }));
  // Extend the step line to today so the chart shows the current rate is still in effect.
  const last = data[data.length - 1];
  const today = new Date().toISOString();
  if (last && today > last.date) {
    data.push({ date: today, ratePerDay: last.ratePerDay, label: last.label });
  }

  return (
    <div className="chart-glow">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => format(parseISO(v), 'MMM d, yyyy')}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            stroke="var(--color-border)"
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            stroke="var(--color-border)"
            width={40}
            label={{ value: 'per day', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--color-muted-foreground)' } }}
          />
          <Tooltip content={<TooltipContent />} />
          <Line
            type="stepAfter"
            dataKey="ratePerDay"
            stroke="var(--color-chart-2)"
            strokeWidth={3}
            dot={{ r: 3, fill: 'var(--color-chart-2)' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
