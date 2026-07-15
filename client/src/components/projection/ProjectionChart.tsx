import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { SimulationResult } from '../../types/projection';

interface ChartPoint {
  date: string;
  totalRemaining: number;
}

function TooltipContent({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <div className="text-muted-foreground">{format(parseISO(label), 'MMM d, yyyy')}</div>
      <div className="font-medium">{payload[0].value.toFixed(1)} remaining</div>
    </div>
  );
}

export function ProjectionChart({ result }: { result: SimulationResult }) {
  // Sample down to keep the SVG light for long horizons: one point every N days plus the last.
  const step = Math.max(1, Math.floor(result.days.length / 180));
  const data: ChartPoint[] = result.days
    .filter((_, i) => i % step === 0 || i === result.days.length - 1)
    .map((d) => ({ date: d.date, totalRemaining: Math.round(d.totalRemaining * 100) / 100 }));

  return (
    <div className="chart-glow">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-chart-1)" />
              <stop offset="100%" stopColor="var(--color-chart-2)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => format(parseISO(v), 'MMM yyyy')}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            stroke="var(--color-border)"
            minTickGap={40}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            stroke="var(--color-border)"
            width={40}
          />
          <Tooltip content={<TooltipContent />} />
          <Area
            type="monotone"
            dataKey="totalRemaining"
            stroke="url(#strokeGrad)"
            strokeWidth={3}
            fill="url(#stockFill)"
            isAnimationActive={false}
          />
          {result.stockOutDate && (
            <ReferenceLine x={result.stockOutDate} stroke="var(--color-destructive)" strokeDasharray="4 4" />
          )}
          {result.expiryWasteEvents.slice(0, 5).map((e) => (
            <ReferenceLine
              key={`${e.batchId}-${e.date}`}
              x={e.date}
              stroke="var(--color-warning)"
              strokeDasharray="4 4"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <div className="text-muted-foreground mt-2 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-chart-1 inline-block size-2 rounded-full" />
          Stock remaining
        </span>
        {result.stockOutDate && (
          <span className="flex items-center gap-1.5">
            <span className="bg-destructive inline-block size-2 rounded-full" />
            Stock-out
          </span>
        )}
        {result.expiryWasteEvents.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="bg-warning inline-block size-2 rounded-full" />
            Expiry waste
          </span>
        )}
      </div>
    </div>
  );
}
