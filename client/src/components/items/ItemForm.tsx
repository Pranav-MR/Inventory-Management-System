import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useCreateItem } from '../../api/items';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const COMMON_UNITS = ['tablet', 'bottle', 'packet', 'kg', 'litre', 'box', 'piece'];

export function ItemForm() {
  const createItem = useCreateItem();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createItem.mutateAsync({ name, unit, category: category || undefined });
    setName('');
    setUnit('');
    setCategory('');
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Medicine A"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-unit">Unit</Label>
            <Input
              id="item-unit"
              required
              list="unit-suggestions"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="tablet"
            />
            <datalist id="unit-suggestions">
              {COMMON_UNITS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="item-category">Category (optional)</Label>
            <Input
              id="item-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Medicine"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createItem.isPending}>
              {createItem.isPending ? 'Adding…' : 'Add item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
