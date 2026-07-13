import { useTranslations } from 'next-intl'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export default function HomePage() {
  const t = useTranslations('HomePage')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('welcomeCard.title')}</CardTitle>
            <CardDescription>{t('welcomeCard.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('welcomeCard.body')}
            </p>
            <Button className="w-full">{t('welcomeCard.cta')}</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
