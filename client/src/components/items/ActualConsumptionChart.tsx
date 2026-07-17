import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { roundQty } from '@/lib/format';
import type { ConsumptionEntry } from '../../api/consumption';

interface ChartPoint {
  date: string;
  quantity: number;
}

function TooltipContent({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <div className="text-muted-foreground">{format(parseISO(label), 'MMM d, yyyy')}</div>
      <div className="font-medium">{roundQty(payload[0].value)} consumed</div>
    </div>
  );
}

export function ActualConsumptionChart({ entries, compact = false }: { entries: ConsumptionEntry[]; compact?: boolean }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">No consumption logged yet.</p>;
  }

  const byDate = new Map<string, number>();
  for (const entry of entries) {
    const day = entry.date.slice(0, 10);
    byDate.set(day, (byDate.get(day) ?? 0) + entry.quantity);
  }
  const data: ChartPoint[] = [...byDate.entries()]
    .map(([date, quantity]) => ({ date, quantity: roundQty(quantity) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="chart-glow">
      <ResponsiveContainer width="100%" height={compact ? 130 : 220}>
        <BarChart data={data} margin={{ top: 8, right: compact ? 4 : 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => format(parseISO(v), compact ? 'MMM d' : 'MMM d, yyyy')}
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            stroke="var(--color-border)"
            minTickGap={compact ? 20 : 40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
            stroke="var(--color-border)"
            width={compact ? 28 : 40}
            allowDecimals={false}
            tickFormatter={(v: number) => String(roundQty(v))}
          />
          <Tooltip content={<TooltipContent />} cursor={{ fill: 'var(--color-accent)' }} />
          <Bar dataKey="quantity" fill="var(--color-chart-3)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
