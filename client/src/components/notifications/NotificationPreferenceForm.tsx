import { useEffect, useState } from 'react';
import { useNotificationPreferences, useUpsertNotificationPreferences } from '../../api/notifications';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { NotificationEventType, NotificationPreference } from '../../types/notification';

const EVENT_TYPES: { type: NotificationEventType; label: string }[] = [
  { type: 'LOW_STOCK', label: 'Low stock alert' },
  { type: 'STOCK_OUT_IMMINENT', label: 'Stock-out imminent' },
  { type: 'EXPIRY_WASTE_WARNING', label: 'Expiry waste warning' },
  { type: 'REQUEST_NEWER_BATCH', label: 'Request newer-expiry batch' },
  { type: 'CANDIDATE_BATCH_WASTE_WARNING', label: 'Incoming delivery would cause waste' },
  { type: 'UPCOMING_DELIVERY_REMINDER', label: 'Upcoming delivery reminder' },
];

function defaultPrefs(): NotificationPreference[] {
  return EVENT_TYPES.map(({ type }) => ({ eventType: type, channel: 'EMAIL', isEnabled: true, leadTimeDays: 7 }));
}

export function NotificationPreferenceForm() {
  const { data: existing, isLoading } = useNotificationPreferences();
  const upsert = useUpsertNotificationPreferences();
  const [prefs, setPrefs] = useState<NotificationPreference[]>(defaultPrefs());

  useEffect(() => {
    if (!existing) return;
    setPrefs(
      EVENT_TYPES.map(
        ({ type }) =>
          existing.find((p) => p.eventType === type && p.channel === 'EMAIL') ?? {
            eventType: type,
            channel: 'EMAIL',
            isEnabled: true,
            leadTimeDays: 7,
          },
      ),
    );
  }, [existing]);

  function updatePref(type: NotificationEventType, patch: Partial<NotificationPreference>) {
    setPrefs((prev) => prev.map((p) => (p.eventType === type ? { ...p, ...patch } : p)));
  }

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="flex flex-col gap-4">
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Lead time (days)</TableHead>
              <TableHead>Enabled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {EVENT_TYPES.map(({ type, label }) => {
              const pref = prefs.find((p) => p.eventType === type)!;
              return (
                <TableRow key={type}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell className="text-muted-foreground">Email</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={pref.leadTimeDays}
                      onChange={(e) => updatePref(type, { leadTimeDays: Number(e.target.value) })}
                      className="h-8 w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={pref.isEnabled}
                      onCheckedChange={(checked) => updatePref(type, { isEnabled: checked })}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <Button onClick={() => upsert.mutate(prefs)} disabled={upsert.isPending} className="w-fit">
        Save preferences
      </Button>
    </div>
  );
}
