import { format, parseISO } from 'date-fns';
import { useNotificationLogs } from '../api/notifications';
import { NotificationPreferenceForm } from '../components/notifications/NotificationPreferenceForm';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<string, 'success' | 'destructive' | 'secondary'> = {
  SENT: 'success',
  FAILED: 'destructive',
  PENDING: 'secondary',
};

export function NotificationSettingsPage() {
  const { data: logs } = useNotificationLogs();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Email is the only channel available for now — SMS and WhatsApp are coming soon.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Preferences</h2>
        <NotificationPreferenceForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Recent notifications</h2>
        {!logs || logs.length === 0 ? (
          <Card className="text-muted-foreground px-5 py-8 text-center text-sm">No notifications sent yet.</Card>
        ) : (
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(log.createdAt), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{log.subject}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[log.status] ?? 'secondary'}>{log.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  );
}
