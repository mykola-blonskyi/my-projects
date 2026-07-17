import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db } from '@/shared/lib/db';
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from '../../../../drizzle/schema';

const originalFetch = global.fetch;
global.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.toString();
  if (url.includes('googleapis.com') || url.includes('accounts.google.com')) {
    console.log('[DEBUG_FETCH_REQUEST]', {
      url,
      method: init?.method,
      body: init?.body?.toString(),
      headers: init?.headers,
    });
    const res = await originalFetch(input, init);
    const clone = res.clone();
    const text = await clone.text();
    console.log('[DEBUG_FETCH_RESPONSE]', { status: res.status, body: text });
    return res;
  }
  return originalFetch(input, init);
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  debug: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain:
          process.env.NODE_ENV === 'production' ? '.blonskyi.dev' : undefined,
      },
    },
  },
  callbacks: {
    async signIn({ user }) {
      if (user.email && user.email === process.env.OWNER_EMAIL) {
        await db
          .update(users)
          .set({ role: 'owner' })
          .where(eq(users.email, user.email));
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role =
          user.email === process.env.OWNER_EMAIL ? 'owner' : 'user';

        // Read saved preferences so post-login redirect and SSR theme are correct
        const [dbUser] = await db
          .select({ locale: users.locale, theme: users.theme })
          .from(users)
          .where(eq(users.id, user.id!))
          .limit(1);

        token.locale = dbUser?.locale ?? 'en';
        token.theme = dbUser?.theme ?? 'light';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.locale = token.locale as string;
        session.user.theme = token.theme as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After sign-in, go through post-login handler which reads locale from DB
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/api/auth/post-login`;
      }
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/api/auth/post-login`;
    },
  },
});
