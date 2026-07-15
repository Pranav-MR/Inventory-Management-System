import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useDeleteItem } from '../../api/items';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { roundQty } from '@/lib/format';
import type { Item } from '../../types/item';

function ItemRow({ item }: { item: Item }) {
  const deleteItem = useDeleteItem();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleDelete() {
    await deleteItem.mutateAsync(item.id);
    setConfirmOpen(false);
  }

  return (
    <TableRow>
      <TableCell>
        <Link
          to={`/items/${item.id}`}
          className="inline-block w-fit font-bold transition-transform hover:scale-[1.05]"
        >
          {item.name}
        </Link>
        {item.isArchived && (
          <Badge variant="secondary" className="ml-2">
            Archived
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
      <TableCell className="text-muted-foreground font-mono">{item.batches.length}</TableCell>
      <TableCell className="text-muted-foreground">
        {item.consumptionRate ? (
          <span className="font-mono">
            {roundQty(item.consumptionRate.ratePerPeriod)} / {item.consumptionRate.periodUnit.toLowerCase()}
          </span>
        ) : (
          <Badge variant="warning">Not set</Badge>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {item.recurringSupplySchedule
          ? `${roundQty(item.recurringSupplySchedule.quantityPerDelivery)} every ${item.recurringSupplySchedule.intervalValue} ${item.recurringSupplySchedule.intervalUnit.toLowerCase()}(s)`
          : '—'}
      </TableCell>
      <TableCell>
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive size-7"
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete item</DialogTitle>
              <DialogDescription>
                This permanently deletes <strong className="font-semibold">{item.name}</strong> along with all of
                its batches, consumption rate, and recurring supply schedule. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteItem.isPending}>
                {deleteItem.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TableCell>
    </TableRow>
  );
}

export function ItemListTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <Card className="text-muted-foreground px-5 py-10 text-center text-sm">
        No items yet. Add your first one above.
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Batches</TableHead>
            <TableHead>Consumption rate</TableHead>
            <TableHead>Recurring supply</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
