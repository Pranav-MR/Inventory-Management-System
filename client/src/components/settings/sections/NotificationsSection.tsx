import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationsSection({ onNavigate }: { onNavigate: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Bell className="text-muted-foreground size-6" />
      </div>
      <p className="text-muted-foreground max-w-xs text-sm">
        Manage email notification preferences on the dedicated Notifications page.
      </p>
      <Button
        type="button"
        onClick={() => {
          onNavigate();
          navigate('/notifications');
        }}
      >
        Open Notification Settings
      </Button>
    </div>
  );
}
