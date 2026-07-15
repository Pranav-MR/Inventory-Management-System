import { Link, useNavigate, useParams } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { useArchiveItem, useItem } from '../api/items';
import { useProjection, useProjectionSummary } from '../api/projections';
import { ConsumptionRateForm } from '../components/items/ConsumptionRateForm';
import { RecurringSupplyForm } from '../components/items/RecurringSupplyForm';
import { BatchList } from '../components/batches/BatchList';
import { AcceptBatchDialog } from '../components/batches/AcceptBatchDialog';
import { ProjectionChart } from '../components/projection/ProjectionChart';
import { ExpiryWarningBanner } from '../components/projection/ExpiryWarningBanner';
import { NextDeliveryRecommendationCallout } from '../components/projection/NextDeliveryRecommendationCallout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useItem(itemId!);
  const archiveItem = useArchiveItem();

  const { data: summary } = useProjectionSummary(itemId!);
  const { data: projection } = useProjection(itemId!, 365);

  if (isLoading || !item) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  async function handleArchive() {
    await archiveItem.mutateAsync(item!.id);
    navigate('/items');
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <Link
            to="/items"
            className="text-muted-foreground inline-block text-[13px] transition-transform hover:scale-[1.06]"
          >
            ← Items
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{item.name}</h1>
          <p className="text-muted-foreground mt-0.5 text-[13px]">
            {item.unit}
            {item.category ? ` · ${item.category}` : ''}
          </p>
        </div>
        <Button variant="destructive" onClick={handleArchive}>
          <Archive className="size-4" />
          Archive item
        </Button>
      </div>

      {summary && (
        <div className="flex flex-col gap-3">
          <ExpiryWarningBanner summary={summary} />
          <NextDeliveryRecommendationCallout
            atRiskExpiryDate={summary.atRiskExpiryDate}
            nextDeliveryRecommendedQuantity={summary.nextDeliveryRecommendedQuantity}
            quantityPerDelivery={item.recurringSupplySchedule?.quantityPerDelivery ?? null}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Consumption rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ConsumptionRateForm itemId={item.id} current={item.consumptionRate} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recurring supply</CardTitle>
        </CardHeader>
        <CardContent>
          <RecurringSupplyForm itemId={item.id} current={item.recurringSupplySchedule} />
        </CardContent>
      </Card>

      {projection && (
        <Card>
          <CardHeader>
            <CardTitle>Projected stock</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectionChart result={projection} />
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Batches</h2>
          <AcceptBatchDialog
            itemId={item.id}
            hasConsumptionRate={Boolean(item.consumptionRate)}
            quantityPerDelivery={item.recurringSupplySchedule?.quantityPerDelivery ?? null}
          />
        </div>
        <BatchList itemId={item.id} batches={item.batches} />
      </div>
    </div>
  );
}
