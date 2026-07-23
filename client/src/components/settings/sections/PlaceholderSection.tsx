import type { ComponentType } from 'react';

export function PlaceholderSection({
  icon: Icon,
  title,
  message,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-6" />
      </div>
      <div>
        <h3 className="font-heading text-sm font-bold">{title}</h3>
        <p className="text-muted-foreground mt-1 max-w-xs text-sm">{message}</p>
      </div>
    </div>
  );
}
