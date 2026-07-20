import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../../drizzle/schema'

const sql = postgres(process.env.DATABASE_URL!)

export const testDb = drizzle(sql, { schema })

export async function resetDb() {
  await sql`TRUNCATE TABLE
    project_access, projects, sessions, accounts, verification_tokens, users
    RESTART IDENTITY CASCADE`
}

export async function closeDb() {
  await sql.end()
}
