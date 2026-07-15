import { useState, type FormEvent } from 'react';
import { Plus, TriangleAlert } from 'lucide-react';
import { useCreateBatch, useEvaluateCandidateBatch } from '../../api/batches';
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

export function AcceptBatchDialog({
  itemId,
  hasConsumptionRate,
}: {
  itemId: string;
  hasConsumptionRate: boolean;
}) {
  const evaluateCandidate = useEvaluateCandidateBatch(itemId);
  const createBatch = useCreateBatch(itemId);

  const [open, setOpen] = useState(false);
  const [batchLabel, setBatchLabel] = useState('');
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [quantityReceived, setQuantityReceived] = useState('');
  const [wasteWarning, setWasteWarning] = useState<{ wastedQuantity: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setBatchLabel('');
    setQuantityReceived('');
    setExpiryDate('');
    setWasteWarning(null);
    setError(null);
  }

  async function submitBatch() {
    await createBatch.mutateAsync({
      batchLabel: batchLabel || undefined,
      receivedDate: new Date(receivedDate).toISOString(),
      expiryDate: new Date(expiryDate).toISOString(),
      quantityReceived: Number(quantityReceived),
    });
    resetForm();
    setOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const quantity = Number(quantityReceived);
    if (!quantity || !expiryDate) return;
    setError(null);

    try {
      // The waste-check needs a consumption rate to project against — skip it
      // entirely until one is set, rather than blocking batch entry on it.
      if (hasConsumptionRate) {
        const result = await evaluateCandidate.mutateAsync({
          quantity,
          expiryDate: new Date(expiryDate).toISOString(),
        });
        if (result.wouldCauseWaste) {
          setWasteWarning({ wastedQuantity: result.wastedQuantity });
          return;
        }
      }

      await submitBatch();
    } catch {
      setError('Could not add this batch. Please try again.');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add batch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add batch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="batch-label">Label (optional)</Label>
            <Input
              id="batch-label"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              placeholder="e.g. July batch"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="batch-received">Received</Label>
              <Input
                id="batch-received"
                type="date"
                required
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="batch-expiry">Expiry</Label>
              <Input
                id="batch-expiry"
                type="date"
                required
                value={expiryDate}
                onChange={(e) => {
                  setExpiryDate(e.target.value);
                  setWasteWarning(null);
                }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="batch-quantity">Quantity</Label>
            <Input
              id="batch-quantity"
              type="number"
              required
              min={0}
              step="any"
              value={quantityReceived}
              onChange={(e) => {
                setQuantityReceived(e.target.value);
                setWasteWarning(null);
              }}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          {wasteWarning && (
            <div className="bg-warning/10 border-warning/30 flex flex-col gap-2 rounded-md border p-3 text-sm">
              <div className="text-warning-foreground flex items-center gap-2 font-medium">
                <TriangleAlert className="text-warning size-4 shrink-0" />
                Projected to waste ~{wasteWarning.wastedQuantity.toFixed(1)} units before expiry
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setWasteWarning(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={submitBatch}>
                  Accept anyway
                </Button>
              </div>
            </div>
          )}

          {!wasteWarning && (
            <DialogFooter>
              <Button type="submit" disabled={evaluateCandidate.isPending || createBatch.isPending}>
                Add batch
              </Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
