import { cn } from '@/lib/utils';

const TONE_CLASSES = {
  destructive: 'bg-destructive/10 text-destructive border-destructive/30',
  warning: 'bg-warning/10 text-warning border-warning/30',
  secondary: 'bg-secondary text-secondary-foreground border-border',
  default: 'bg-muted text-foreground border-border',
} as const;

export function StatChip({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: number;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2.5 text-center',
        TONE_CLASSES[tone],
      )}
    >
      <span className="font-mono text-xl leading-none font-bold tabular-nums">{value}</span>
      <span className="text-[11px] leading-tight font-medium">{label}</span>
    </div>
  );
}
