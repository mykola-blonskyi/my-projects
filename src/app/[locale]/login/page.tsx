import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { signIn } from '@/features/auth/lib/auth';

export default async function LoginPage() {
  const t = await getTranslations('LoginPage');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">blonskyi.dev</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t('title')}</CardTitle>
            <CardDescription>{t('subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async () => {
                'use server';
                await signIn('google');
              }}
            >
              <Button type="submit" className="w-full">
                {t('googleButton')}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center">{t('terms')}</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
