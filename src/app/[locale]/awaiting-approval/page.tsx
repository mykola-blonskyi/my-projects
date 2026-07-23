import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { logout } from '@/features/auth/actions/logout';

export default async function AwaitingApprovalPage() {
  const t = await getTranslations('AwaitingApprovalPage');
  const tCommon = await getTranslations('Nav');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t('title')}</CardTitle>
            <CardDescription>{t('message')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={logout}>
              <Button type="submit" variant="outline" className="w-full">
                {tCommon('signOut')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
