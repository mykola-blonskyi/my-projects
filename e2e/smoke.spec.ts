import { test, expect } from '@playwright/test'

test('health endpoint responds ok — confirms the app booted and migrations ran', async ({
  request,
}) => {
  const res = await request.get('/api/health')
  expect(res.ok()).toBeTruthy()
  expect(await res.json()).toEqual({ status: 'ok' })
})

test('unauthenticated request to root redirects to the login page', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/en\/login$/)
})

test('login page renders with the Google sign-in button', async ({ page }) => {
  await page.goto('/en/login')
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
})

test('locale routing works for a non-default locale', async ({ page }) => {
  await page.goto('/uk/login')
  await expect(page).toHaveURL(/\/uk\/login$/)
  await expect(page.getByText('Вхід')).toBeVisible()
})
