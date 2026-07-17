import { useState, type ComponentType, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Activity, Archive, PackageMinus, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardListModal } from './DashboardListModal';
import { ViewMoreButton } from './ViewMoreButton';
import type { ActivityEntry, ActivityType } from '../../api/dashboard';

const ACTIVITY_ICON: Record<ActivityType, ComponentType<{ className?: string }>> = {
  ITEM_ADDED: Plus,
  ITEM_EDITED: Pencil,
  ITEM_ARCHIVED: Archive,
  ITEM_DELETED: Trash2,
  BATCH_ADDED: PackagePlus,
  BATCH_EDITED: Pencil,
  BATCH_DELETED: PackageMinus,
  CONSUMPTION_RECORDED: PackageMinus,
};

const PREVIEW_COUNT = 5;

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const Icon = ACTIVITY_ICON[entry.type];
  const inner = (
    <>
      <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-3.5" />
      </div>
      <span className="flex-1 truncate">{entry.message}</span>
      <span className="text-muted-foreground shrink-0 text-xs">
        {formatDistanceToNow(parseISO(entry.createdAt), { addSuffix: true })}
      </span>
    </>
  );
  return entry.itemId ? (
    <Link
      to={`/items/${entry.itemId}`}
      className="hover:bg-accent flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
    >
      {inner}
    </Link>
  ) : (
    <div className="flex items-center gap-2.5 px-2.5 py-2 text-sm">{inner}</div>
  );
}

function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => (
        <ActivityRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{children}</div>;
}

export function RecentActivitySection({ entries }: { entries: ActivityEntry[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const preview = entries.slice(0, PREVIEW_COUNT);
  const remaining = entries.length - PREVIEW_COUNT;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="h-[280px] overflow-y-auto">
          {entries.length === 0 ? <EmptyState>No activity yet.</EmptyState> : <ActivityList entries={preview} />}
        </div>
        {remaining > 0 && <ViewMoreButton remaining={remaining} onClick={() => setModalOpen(true)} />}
      </CardContent>

      <DashboardListModal open={modalOpen} onOpenChange={setModalOpen} title="Recent Activity">
        <ActivityList entries={entries} />
      </DashboardListModal>
    </Card>
  );
}
