import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { projects } from './schema';

async function seed() {
  const sql = postgres(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Seeding projects...');

  await db
    .insert(projects)
    .values([
      {
        slug: 'db',
        name: 'SQL Panel',
        url: 'https://db.blonskyi.dev',
        icon: '🗄️',
      },
    ])
    .onConflictDoNothing();

  console.log('Seed complete.');
  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
