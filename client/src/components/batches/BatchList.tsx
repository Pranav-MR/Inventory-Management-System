import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Trash2, X } from 'lucide-react';
import { useDeleteBatch, useUpdateBatch } from '../../api/batches';
import { EditBatchDialog } from './EditBatchDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';
import { roundQty } from '@/lib/format';
import type { Batch, BatchStatus } from '../../types/item';

const STATUS_VARIANT: Record<BatchStatus, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  DEPLETED: 'secondary',
  EXPIRED: 'destructive',
  DISCARDED: 'secondary',
};

function BatchRow({ itemId, batch }: { itemId: string; batch: Batch }) {
  const updateBatch = useUpdateBatch(itemId);
  const deleteBatch = useDeleteBatch(itemId);
  const [editing, setEditing] = useState(false);
  const [quantity, setQuantity] = useState(String(batch.quantityRemaining));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isExpired = new Date(batch.expiryDate) < new Date();

  async function saveQuantity() {
    const value = Number(quantity);
    if (!Number.isFinite(value) || value < 0) return;
    await updateBatch.mutateAsync({ batchId: batch.id, input: { quantityRemaining: roundQty(value) } });
    setEditing(false);
  }

  async function handleDelete() {
    await deleteBatch.mutateAsync(batch.id);
    setConfirmOpen(false);
  }

  return (
    <TableRow>
      <TableCell className="font-semibold">{batch.batchLabel ?? '—'}</TableCell>
      <TableCell className="text-muted-foreground">{format(parseISO(batch.receivedDate), 'MMM d, yyyy')}</TableCell>
      <TableCell className={cn(isExpired ? 'text-destructive font-bold' : 'text-muted-foreground')}>
        {format(parseISO(batch.expiryDate), 'MMM d, yyyy')}
      </TableCell>
      <TableCell className="text-muted-foreground font-mono">{roundQty(batch.quantityReceived)}</TableCell>
      <TableCell>
        {editing ? (
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-7 w-20"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="size-7" onClick={saveQuantity}>
              <Check className="size-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="size-7" onClick={() => setEditing(false)}>
              <X className="size-3.5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="hover:decoration-muted-foreground font-mono underline decoration-dotted underline-offset-4"
          >
            {roundQty(batch.quantityRemaining)}
          </button>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[batch.status]}>{batch.status}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <EditBatchDialog itemId={itemId} batch={batch} />
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive size-7 border border-transparent"
                aria-label={`Delete ${batch.batchLabel ?? 'batch'}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete batch</DialogTitle>
                <DialogDescription>
                  This permanently deletes this batch
                  {batch.batchLabel ? (
                    <>
                      {' '}
                      (<strong className="font-semibold">{batch.batchLabel}</strong>)
                    </>
                  ) : null}{' '}
                  and its stock history. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteBatch.isPending}>
                  {deleteBatch.isPending ? 'Deleting…' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function BatchList({ itemId, batches }: { itemId: string; batches: Batch[] }) {
  if (batches.length === 0) {
    return (
      <Card className="text-muted-foreground px-5 py-8 text-center text-sm">No batches yet.</Card>
    );
  }

  const sorted = [...batches].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  return (
    <Card className="overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Received</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Received qty</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Status</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((batch) => (
            <BatchRow key={batch.id} itemId={itemId} batch={batch} />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
