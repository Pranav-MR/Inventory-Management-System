import { useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, isSameDay, parseISO } from 'date-fns';
import { Activity, Archive, PackageMinus, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { DashboardListModal } from './DashboardListModal';
import { SummaryCardShell } from './SummaryCardShell';
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
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">No activity yet.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {entries.map((entry) => (
        <ActivityRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

export function RecentActivitySection({ entries }: { entries: ActivityEntry[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  const todayCount = entries.filter((e) => isSameDay(parseISO(e.createdAt), new Date())).length;
  const latest = entries[0];
  const LatestIcon = latest ? ACTIVITY_ICON[latest.type] : null;

  return (
    <>
      <SummaryCardShell icon={Activity} title="Recent activity" onClick={() => setModalOpen(true)}>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-3xl leading-none font-bold tabular-nums">{todayCount}</span>
          <span className="text-muted-foreground text-sm">{todayCount === 1 ? 'activity today' : 'activities today'}</span>
        </div>
        <div className="border-t pt-3">
          {latest && LatestIcon ? (
            <>
              <div className="text-muted-foreground mb-1 text-xs">Latest</div>
              <div className="flex items-center gap-2">
                <LatestIcon className="text-muted-foreground size-3.5 shrink-0" />
                <span className="flex-1 truncate font-semibold">{latest.message}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {formatDistanceToNow(parseISO(latest.createdAt), { addSuffix: true })}
                </span>
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">No activity yet.</div>
          )}
        </div>
      </SummaryCardShell>

      <DashboardListModal open={modalOpen} onOpenChange={setModalOpen} title="Recent Activity">
        <ActivityList entries={entries} />
      </DashboardListModal>
    </>
  );
}
