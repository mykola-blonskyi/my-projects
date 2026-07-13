import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  role: text('role').default('user').notNull(),
  locale: text('locale').default('en').notNull(),
  theme: text('theme').default('light').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
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
