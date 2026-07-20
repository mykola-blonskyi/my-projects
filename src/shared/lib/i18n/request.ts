import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate that the incoming locale is valid; fall back to default if not
  if (!locale || !routing.locales.includes(locale as 'en' | 'ru' | 'uk' | 'es')) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../../../messages/${locale}.json`)).default,
  };
});
