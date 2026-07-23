import { pgTable, pgEnum, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { locales } from '../src/shared/lib/i18n/config';

// ─── Users ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['user', 'owner']);
export const userStatusEnum = pgEnum('user_status', ['pending', 'approved', 'blocked']);
// locales is the i18n config's own source of truth (drives next-intl's routing too);
// reused here rather than duplicated so the two can't drift apart.
export const userLocaleEnum = pgEnum('user_locale', locales);
// No pre-existing shared constant for themes - this enum is the source of truth,
// consumed by ThemeToggle/layout/setTheme instead of each duplicating its own list.
export const userThemeEnum = pgEnum('user_theme', ['light', 'dark', 'theme-rose']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  role: userRoleEnum('role').default('user').notNull(),
  status: userStatusEnum('status').default('pending').notNull(),
  locale: userLocaleEnum('locale').default('en').notNull(),
  theme: userThemeEnum('theme').default('light').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type UserLocale = (typeof userLocaleEnum.enumValues)[number];
export type UserTheme = (typeof userThemeEnum.enumValues)[number];
export type UserStatus = (typeof userStatusEnum.enumValues)[number];

// ─── Projects ────────────────────────────────────────────────────────────────

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  url: text('url'),
  description: text('description'),
  icon: text('icon'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Project Access ───────────────────────────────────────────────────────────

export const projectAccess = pgTable(
  'project_access',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    grantedAt: timestamp('granted_at').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.projectId] })],
);

// ─── Auth.js — Accounts ───────────────────────────────────────────────────────
// Column property names use snake_case to match @auth/drizzle-adapter type expectations.

export const accounts = pgTable('accounts', {
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

// ─── Auth.js — Sessions ───────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// ─── Auth.js — Verification Tokens ───────────────────────────────────────────

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);
