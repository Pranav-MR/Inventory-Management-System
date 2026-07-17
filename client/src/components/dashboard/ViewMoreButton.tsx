import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ViewMoreButton({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-muted-foreground hover:text-foreground mt-2 w-full shrink-0 justify-center gap-1.5 border-t border-dashed pt-2.5"
    >
      View more ({remaining})
      <ChevronDown className="size-3.5" />
    </Button>
  );
}
