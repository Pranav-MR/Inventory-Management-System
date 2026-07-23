import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AccountSection() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const wantsPasswordChange = newPassword.length > 0 || confirmPassword.length > 0;
  const isDirty = name.trim() !== (user?.name ?? '') || wantsPasswordChange;

  const passwordsMismatch = wantsPasswordChange && newPassword !== confirmPassword;
  const passwordTooShort = wantsPasswordChange && newPassword.length > 0 && newPassword.length < 8;
  const missingCurrentPassword = wantsPasswordChange && currentPassword.length === 0;
  const canSave = isDirty && !passwordsMismatch && !passwordTooShort && !missingCurrentPassword && name.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setError(null);
    setStatus(null);
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        ...(wantsPasswordChange ? { currentPassword, newPassword } : {}),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus('Changes saved.');
    } catch {
      setError('Could not save changes. Check your current password and try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-username">Username</Label>
        <Input id="account-username" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-email" className="text-muted-foreground">
          Email
        </Label>
        <Input id="account-email" value={user?.email ?? ''} disabled className="text-muted-foreground" />
      </div>

      <div className="border-border flex flex-col gap-4 border-t pt-4">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Change password</h3>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="account-current-password">Current password</Label>
          <Input
            id="account-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-new-password">New password</Label>
            <Input
              id="account-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-confirm-password">Confirm new password</Label>
            <Input
              id="account-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        {passwordTooShort && <p className="text-destructive text-xs">Password must be at least 8 characters.</p>}
        {passwordsMismatch && !passwordTooShort && <p className="text-destructive text-xs">Passwords do not match.</p>}
        {missingCurrentPassword && (
          <p className="text-destructive text-xs">Enter your current password to set a new one.</p>
        )}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {status && <p className="text-muted-foreground text-sm">{status}</p>}

      <div>
        <Button type="submit" disabled={!canSave || isSaving}>
          {isSaving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
