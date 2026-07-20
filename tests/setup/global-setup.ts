import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

const DATABASE_URL = 'postgres://hub_test:hub_test@localhost:5434/hub_test'

export default async function globalSetup() {
  const sql = postgres(DATABASE_URL, { max: 1 })
  const db = drizzle(sql)

  await migrate(db, { migrationsFolder: './drizzle/migrations' })

  await sql.end()
}
