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

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // After successful login, redirect to the user's locale home
      // Locale preference persistence is handled in ticket 9
      // For now redirect to default locale home
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/en/`;
    },
  },
});
