import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Activity, Archive, PackageMinus, PackagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function RecentActivitySection({ entries }: { entries: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4" />
          Recent activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {entries.map((entry) => {
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
                  key={entry.id}
                  to={`/items/${entry.itemId}`}
                  className="hover:bg-accent flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors"
                >
                  {inner}
                </Link>
              ) : (
                <div key={entry.id} className="flex items-center gap-2.5 px-2.5 py-2 text-sm">
                  {inner}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
