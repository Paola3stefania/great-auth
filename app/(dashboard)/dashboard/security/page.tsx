'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Loader2 } from 'lucide-react';
import { changePassword, useSession } from '@/lib/auth/client';
import { useHasPassword } from '@/lib/hooks/use-has-password';
import Link from 'next/link';

export default function SecurityPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || '';
  const { hasPassword, isLoading: isChecking, mutate: mutateHasPassword } = useHasPassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordPending, setIsPasswordPending] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordPending(true);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setIsPasswordPending(false);
      return;
    }

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      if (result.error) {
        setPasswordError(result.error.message || 'Failed to update password');
      } else {
        setPasswordSuccess('Password updated successfully');
        // Refresh cache to ensure data is up to date
        await mutateHasPassword();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError('An unexpected error occurred');
    } finally {
      setIsPasswordPending(false);
    }
  };

  if (isChecking) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
          Security Settings
        </h1>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
        Security Settings
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasPassword ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                You signed in with Google SSO. Password management is not available for accounts that only use social authentication.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                If you want to add password authentication to your account, you can sign up with email and password using the same email address. This will link both authentication methods to your account.
              </p>
              <Link href={`/?signup=true&email=${encodeURIComponent(userEmail)}`}>
                <Button
                  type="button"
                  className="w-full text-white hover:opacity-90"
                  style={{ backgroundColor: '#397A4A' }}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Create Password
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <Label htmlFor="current-password" className="mb-2">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="mb-2">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="mb-2">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                maxLength={100}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-green-500 text-sm">{passwordSuccess}</p>
            )}
            <Button
              type="submit"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: '#397A4A' }}
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Account deletion is not available in this demo. This feature requires server-side implementation with Better Auth.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
