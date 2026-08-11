import type { Page } from '@playwright/test'

export async function login(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByPlaceholder('you@company.com').fill('demo@nexora.com')
  await page.getByPlaceholder('••••••••').fill('demo1234')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('**/app')
}
