import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useConsumptionEntries, useDeleteConsumptionEntry, type ConsumptionEntry } from '../../api/consumption';
import { ConsumptionEntryDialog } from './ConsumptionEntryDialog';
import { ActualConsumptionChart } from './ActualConsumptionChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { roundQty } from '@/lib/format';

function ConsumptionEntryRow({ itemId, entry }: { itemId: string; entry: ConsumptionEntry }) {
  const deleteEntry = useDeleteConsumptionEntry(itemId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    await deleteEntry.mutateAsync(entry.id);
    setConfirmOpen(false);
  }

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{format(parseISO(entry.date), 'MMM d, yyyy')}</TableCell>
      <TableCell className="font-mono font-semibold">{roundQty(entry.quantity)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <ConsumptionEntryDialog
            itemId={itemId}
            entry={entry}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary size-7 border border-transparent"
                aria-label="Edit consumption entry"
              >
                <Pencil className="size-3.5" />
              </Button>
            }
          />
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive size-7 border border-transparent"
                aria-label="Delete consumption entry"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete consumption entry</DialogTitle>
                <DialogDescription>
                  This removes this logged entry and restores the {roundQty(entry.quantity)} units it deducted back
                  to stock. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteEntry.isPending}>
                  {deleteEntry.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ConsumptionLogSection({ itemId }: { itemId: string }) {
  const { data: entries, isLoading } = useConsumptionEntries(itemId);

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-2 px-5 pt-5">
        <h2 className="font-heading text-sm font-bold tracking-tight">Consumption Log</h2>
        <ConsumptionEntryDialog
          itemId={itemId}
          trigger={
            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs">
              <Plus className="size-3.5" />
              Add
            </Button>
          }
        />
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2 px-5 pb-5">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="px-5">
          <ActualConsumptionChart entries={entries} compact />
        </div>
      )}

      {entries && entries.length === 0 && (
        <p className="text-muted-foreground flex-1 px-5 pb-5 text-sm">No consumption logged yet.</p>
      )}

      {entries && entries.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <ConsumptionEntryRow key={entry.id} itemId={itemId} entry={entry} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
