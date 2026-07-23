import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DataSection() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        Backup and restore your inventory data. These actions will be available in a future update.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button type="button" variant="secondary" disabled>
          <Download className="size-4" />
          Export Inventory
        </Button>
        <Button type="button" variant="secondary" disabled>
          <Upload className="size-4" />
          Import Inventory
        </Button>
      </div>
    </div>
  );
}
