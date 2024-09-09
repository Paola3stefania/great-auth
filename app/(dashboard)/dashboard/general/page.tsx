'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateUser, useSession } from '@/lib/auth/client';
import { Suspense } from 'react';

type AccountFormProps = {
  nameValue?: string;
  emailValue?: string;
  onNameChange?: (name: string) => void;
};

function AccountForm({
  nameValue = '',
  emailValue = '',
  onNameChange
}: AccountFormProps) {
  return (
    <>
      <div>
        <Label htmlFor="name" className="mb-2">
          Name
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          defaultValue={nameValue}
          onChange={(e) => onNameChange?.(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="email" className="mb-2">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          defaultValue={emailValue}
          disabled
          className="bg-gray-50 cursor-not-allowed"
        />
        <p className="text-sm text-gray-500 mt-1">
          Email cannot be changed. Contact support if you need to update your email.
        </p>
      </div>
    </>
  );
}

function AccountFormWithData({ onNameChange }: { onNameChange?: (name: string) => void }) {
  const { data: session } = useSession();
  const user = session?.user;
  
  return (
    <AccountForm
      nameValue={user?.name ?? ''}
      emailValue={user?.email ?? ''}
      onNameChange={onNameChange}
    />
  );
}

export default function GeneralPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const formName = formData.get('name') as string;

    try {
      const result = await updateUser({
        name: formName || undefined,
      });

      if (result.error) {
        setError(result.error.message || 'Failed to update account');
      } else {
        setSuccess('Account updated successfully');
        // Refresh the page to show updated data
        window.location.reload();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        General Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Suspense fallback={<AccountForm />}>
              <AccountFormWithData onNameChange={setName} />
            </Suspense>
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            {success && (
              <p className="text-green-500 text-sm">{success}</p>
            )}
            <Button
              type="submit"
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: '#397A4A' }}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
