import type { ComponentType, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SummaryCardShell({
  icon: Icon,
  title,
  onClick,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="flex h-[224px] flex-col cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_10px_36px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_10px_36px_rgba(0,0,0,0.45)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-3">{children}</CardContent>
      </Card>
    </button>
  );
}
