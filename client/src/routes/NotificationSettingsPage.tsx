import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useReportSettings, useSaveReportSettings, useSendTestEmail } from '../api/reportSettings';
import type { ReportFrequency } from '../types/reportSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let nextRowId = 0;
function makeRowId() {
  nextRowId += 1;
  return `row-${nextRowId}`;
}

interface RecipientRow {
  id: string;
  value: string;
}

function toRows(emails: string[]): RecipientRow[] {
  return emails.length > 0 ? emails.map((value) => ({ id: makeRowId(), value })) : [{ id: makeRowId(), value: '' }];
}

function validateRows(rows: RecipientRow[]): Map<string, string> {
  const errors = new Map<string, string>();
  const seenLower = new Set<string>();
  for (const row of rows) {
    const trimmed = row.value.trim();
    if (trimmed === '') continue;
    if (!EMAIL_PATTERN.test(trimmed)) {
      errors.set(row.id, 'Enter a valid email address.');
      continue;
    }
    const lower = trimmed.toLowerCase();
    if (seenLower.has(lower)) {
      errors.set(row.id, 'Duplicate email address.');
    } else {
      seenLower.add(lower);
    }
  }
  return errors;
}

export function NotificationSettingsPage() {
  const { data: settings, isLoading } = useReportSettings();
  const saveSettings = useSaveReportSettings();
  const sendTestEmail = useSendTestEmail();

  const [isEnabled, setIsEnabled] = useState(false);
  const [recipients, setRecipients] = useState<RecipientRow[]>([{ id: makeRowId(), value: '' }]);
  const [frequency, setFrequency] = useState<ReportFrequency>('WEEKLY');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;
    setIsEnabled(settings.isEnabled);
    setRecipients(toRows(settings.recipientEmails));
    setFrequency(settings.frequency);
  }, [settings]);

  const errors = validateRows(recipients);
  const validEmails = recipients.map((r) => r.value.trim()).filter(Boolean);
  const canSubmit = errors.size === 0 && validEmails.length > 0;

  function addRecipient() {
    setRecipients((prev) => [...prev, { id: makeRowId(), value: '' }]);
  }

  function removeRecipient(id: string) {
    setRecipients((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function updateRecipient(id: string, value: string) {
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, value } : r)));
  }

  async function handleSave() {
    setSaveStatus(null);
    try {
      await saveSettings.mutateAsync({ isEnabled, recipientEmails: validEmails, frequency });
      setSaveStatus('Settings saved.');
    } catch {
      setSaveStatus('Could not save settings. Please try again.');
    }
  }

  async function handleTestEmail() {
    setTestStatus(null);
    try {
      const result = await sendTestEmail.mutateAsync({ recipientEmails: validEmails, frequency });
      if (result.failed === 0) {
        setTestStatus(`Test email sent successfully to ${result.sent} recipient(s).`);
      } else {
        setTestStatus(
          `${result.sent} sent, ${result.failed} failed (${result.failedAddresses.join(', ')}).`,
        );
      }
    } catch {
      setTestStatus('Could not send test email. Please try again.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Get a periodic inventory summary emailed to you, with a PDF attached.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Switch id="report-enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
                <Label htmlFor="report-enabled" className="cursor-pointer">
                  Enable email notifications
                </Label>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs">Recipient email addresses</Label>
                {recipients.map((row, index) => {
                  const error = errors.get(row.id);
                  return (
                    <div key={row.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="email"
                          required
                          value={row.value}
                          onChange={(e) => updateRecipient(row.id, e.target.value)}
                          placeholder="you@example.com"
                          className="max-w-sm"
                          aria-label={`Recipient email ${index + 1}`}
                          aria-invalid={Boolean(error)}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeRecipient(row.id)}
                          disabled={recipients.length === 1}
                          className="text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive size-8 border border-transparent disabled:opacity-30"
                          aria-label="Remove recipient"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        {index === recipients.length - 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={addRecipient}
                            className="text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary size-8 border border-transparent"
                            aria-label="Add another recipient"
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      {error && <p className="text-destructive text-xs">{error}</p>}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-muted-foreground text-xs">Report frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as ReportFrequency)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={handleSave} disabled={saveSettings.isPending || !canSubmit}>
                  {saveSettings.isPending ? 'Saving…' : 'Save Settings'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestEmail}
                  disabled={sendTestEmail.isPending || !canSubmit}
                >
                  {sendTestEmail.isPending ? 'Sending…' : 'Test Email'}
                </Button>
              </div>

              {saveStatus && <p className="text-muted-foreground text-sm">{saveStatus}</p>}
              {testStatus && <p className="text-muted-foreground text-sm">{testStatus}</p>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
