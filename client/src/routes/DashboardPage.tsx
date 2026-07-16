import { DashboardSummaryCards } from '../components/dashboard/DashboardSummaryCards';
import { ExpiringSoonSection } from '../components/dashboard/ExpiringSoonSection';
import { LowStockSection } from '../components/dashboard/LowStockSection';
import { UpcomingRecurringSection } from '../components/dashboard/UpcomingRecurringSection';
import { RecentActivitySection } from '../components/dashboard/RecentActivitySection';
import { InventoryOverviewSection } from '../components/dashboard/InventoryOverviewSection';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardOverview } from '../api/dashboard';

export function DashboardPage() {
  const { data: overview, isLoading } = useDashboardOverview();

  return (
    <div className="flex flex-col gap-6">
      <DashboardSummaryCards />

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      )}

      {overview && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ExpiringSoonSection entries={overview.expiringSoon} />
            <LowStockSection entries={overview.lowStock} />
            <UpcomingRecurringSection entries={overview.upcomingRecurring} />
            <RecentActivitySection entries={overview.recentActivity} />
          </div>

          <InventoryOverviewSection overview={overview.overview} />
        </>
      )}
    </div>
  );
}
