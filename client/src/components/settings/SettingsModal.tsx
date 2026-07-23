import { useState, type ComponentType } from 'react';
import { BarChart3, Bell, Database, Info, Package, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AccountSection } from './sections/AccountSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { DataSection } from './sections/DataSection';
import { AboutSection } from './sections/AboutSection';
import { PlaceholderSection } from './sections/PlaceholderSection';

type SectionId = 'account' | 'notifications' | 'inventory' | 'reports' | 'data' | 'about';

const SECTIONS: { id: SectionId; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'about', label: 'About', icon: Info },
];

export function SettingsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const active = SECTIONS.find((s) => s.id === activeSection)!;

  function handleOpenChange(next: boolean) {
    if (next) setActiveSection('account');
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[34rem] max-h-[85vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <nav className="border-border flex shrink-0 gap-1 overflow-x-auto border-b p-2 sm:w-44 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:p-3">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors',
                  section.id === activeSection
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <section.icon className="size-4 shrink-0" />
                {section.label}
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            <DialogHeader className="mb-5">
              <DialogTitle>{active.label}</DialogTitle>
            </DialogHeader>

            {activeSection === 'account' && <AccountSection />}
            {activeSection === 'notifications' && <NotificationsSection onNavigate={() => onOpenChange(false)} />}
            {activeSection === 'inventory' && (
              <PlaceholderSection
                icon={Package}
                title="Inventory settings"
                message="Inventory preferences will be available in a future update."
              />
            )}
            {activeSection === 'reports' && (
              <PlaceholderSection
                icon={BarChart3}
                title="Report settings"
                message="Report settings will be available in a future update."
              />
            )}
            {activeSection === 'data' && <DataSection />}
            {activeSection === 'about' && <AboutSection />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
