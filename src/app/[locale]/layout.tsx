import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ThemeProvider } from '@/shared/ui/theme-provider';
import { locales, type Locale } from '@/shared/lib/i18n/config';
import { auth } from '@/features/auth/lib/auth';
import { userThemeEnum } from '../../../drizzle/schema';
import '../globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Hub — blonskyi.dev',
  description: 'Personal project hub',
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const [messages, session] = await Promise.all([getMessages(), auth()]);
  const savedTheme = session?.user?.theme ?? 'light';

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme={savedTheme}
          enableSystem={false}
          themes={[...userThemeEnum.enumValues]}
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
