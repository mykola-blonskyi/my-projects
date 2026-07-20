import { afterAll, afterEach } from 'vitest'
import { resetDb, closeDb } from './db'

afterEach(async () => {
  await resetDb()
})

afterAll(async () => {
  await closeDb()
})
