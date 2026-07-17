import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function ItemSearchInput({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search items by name…"
        aria-label="Search items"
        className="bg-popover border-border/80 focus-visible:border-primary/60 pr-9 pl-9 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:shadow-[0_2px_16px_rgba(0,0,0,0.4)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="text-muted-foreground hover:text-foreground hover:bg-accent absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
