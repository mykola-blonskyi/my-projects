import { DefaultSession, DefaultJWT } from 'next-auth';
import type { UserRole, UserLocale, UserTheme } from '../../../drizzle/schema';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      locale: UserLocale;
      theme: UserTheme;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId?: string;
    role?: UserRole;
    locale?: UserLocale;
    theme?: UserTheme;
  }
}
