import { useNavigate, useParams } from 'react-router-dom';
import { Archive } from 'lucide-react';
import { useArchiveItem, useItem } from '../api/items';
import { useProjection, useProjectionSummary } from '../api/projections';
import { ConsumptionRateForm } from '../components/items/ConsumptionRateForm';
import { RecurringSupplyForm } from '../components/items/RecurringSupplyForm';
import { BatchList } from '../components/batches/BatchList';
import { AcceptBatchDialog } from '../components/batches/AcceptBatchDialog';
import { ProjectionChart } from '../components/projection/ProjectionChart';
import { ExpiryWarningBanner } from '../components/projection/ExpiryWarningBanner';
import { RequestNewerBatchCallout } from '../components/projection/RequestNewerBatchCallout';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{item.name}</h1>
          <p className="text-muted-foreground text-sm">
            {item.unit}
            {item.category ? ` · ${item.category}` : ''}
          </p>
        </div>
        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleArchive}>
          <Archive className="size-4" />
          Archive item
        </Button>
      </div>

      {summary && (
        <div className="flex flex-col gap-3">
          <ExpiryWarningBanner summary={summary} />
          <RequestNewerBatchCallout requestNewerExpiryFromDate={summary.requestNewerExpiryFromDate} />
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
          <h2 className="text-lg font-semibold tracking-tight">Batches</h2>
          <AcceptBatchDialog itemId={item.id} hasConsumptionRate={Boolean(item.consumptionRate)} />
        </div>
        <BatchList itemId={item.id} batches={item.batches} />
      </div>
    </div>
  );
}
