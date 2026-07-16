import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Info, Plus, TriangleAlert } from 'lucide-react';
import { useCreateBatch, useEvaluateCandidateBatch } from '../../api/batches';
import { projectionSummaryQueryOptions } from '../../api/projections';
import { ceilQty, roundQty } from '@/lib/format';
import { describeNextDeliveryRecommendation } from '../projection/NextDeliveryRecommendationCallout';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
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
  normalPurchaseQuantity,
}: {
  itemId: string;
  hasConsumptionRate: boolean;
  normalPurchaseQuantity: number | null;
}) {
  const queryClient = useQueryClient();
  const evaluateCandidate = useEvaluateCandidateBatch(itemId);
  const createBatch = useCreateBatch(itemId);

  const [open, setOpen] = useState(false);
  const [batchLabel, setBatchLabel] = useState('');
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expiryDate, setExpiryDate] = useState('');
  const [quantityReceived, setQuantityReceived] = useState('');
  const [wasteWarning, setWasteWarning] = useState<{ wastedQuantity: number } | null>(null);
  const [deliveryWarning, setDeliveryWarning] = useState<{
    atRiskExpiryDate: string | null;
    recommendedQuantity: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setBatchLabel('');
    setQuantityReceived('');
    setExpiryDate('');
    setWasteWarning(null);
    setDeliveryWarning(null);
    setError(null);
  }

  async function submitBatch() {
    await createBatch.mutateAsync({
      batchLabel: batchLabel || undefined,
      receivedDate: new Date(receivedDate).toISOString(),
      expiryDate: new Date(expiryDate).toISOString(),
      quantityReceived: roundQty(Number(quantityReceived)),
    });
    setWasteWarning(null);

    // Check whether the very next scheduled delivery at this item's current expiry
    // would already be unsafe to accept, and surface that immediately rather than
    // relying on the user to notice the passive banner on the item page.
    if (hasConsumptionRate) {
      try {
        const summary = await queryClient.fetchQuery(projectionSummaryQueryOptions(itemId));
        const recommendedQuantity = summary.nextDeliveryRecommendedQuantity;
        if (
          recommendedQuantity !== null &&
          normalPurchaseQuantity !== null &&
          recommendedQuantity < normalPurchaseQuantity
        ) {
          setDeliveryWarning({ atRiskExpiryDate: summary.atRiskExpiryDate, recommendedQuantity });
          return;
        }
      } catch {
        // Fail open — a projection-fetch hiccup shouldn't block a successful batch add.
      }
    }

    resetForm();
    setOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const quantity = roundQty(Number(quantityReceived));
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

        {deliveryWarning ? (
          <div className="flex flex-col gap-3">
            <div className="border-success/20 border-l-success bg-success/6 text-success flex items-start gap-3 rounded-xl border border-l-[3px] px-4 py-3.5 text-[13.5px]">
              <Info className="mt-0.5 size-[18px] shrink-0" />
              <span>
                Batch added. However:{' '}
                {describeNextDeliveryRecommendation(deliveryWarning.atRiskExpiryDate, deliveryWarning.recommendedQuantity)}
              </span>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Got it
              </Button>
            </DialogFooter>
          </div>
        ) : (
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
                <DatePicker id="batch-received" mode="full" value={receivedDate} onChange={setReceivedDate} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="batch-expiry">Expiry</Label>
                <DatePicker
                  id="batch-expiry"
                  mode="month"
                  value={expiryDate}
                  onChange={(next) => {
                    setExpiryDate(next);
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
                step="1"
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
                  Projected to waste ~{ceilQty(wasteWarning.wastedQuantity)} units before expiry
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
        )}
      </DialogContent>
    </Dialog>
  );
}
