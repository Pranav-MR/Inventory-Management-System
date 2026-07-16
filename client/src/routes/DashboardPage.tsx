import { DashboardSummaryCards } from '../components/items/DashboardSummaryCards';

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardSummaryCards />
      {/* Room for future dashboard widgets (recent activity, trends, etc.) */}
    </div>
  );
}
