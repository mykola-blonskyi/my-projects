import { asc } from 'drizzle-orm'
import { db } from '@/shared/lib/db'
import { projects } from '../../../../drizzle/schema'

export type Project = typeof projects.$inferSelect

export async function getAllProjects(): Promise<Project[]> {
  return db.select().from(projects).orderBy(asc(projects.order))
}
