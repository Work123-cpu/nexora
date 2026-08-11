import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('setup wizard can be completed end-to-end', async ({ page }) => {
  await login(page)
  await page.goto('/setup')

  // Steps advance through varying button labels ("Get Started" -> "Continue" x N -> "Finish Setup")
  // until the completion screen renders, which has no such button.
  for (let i = 0; i < 15; i++) {
    if (await page.getByText("You're all set!").isVisible().catch(() => false)) break

    const nextButton = page.getByRole('button', { name: /^(Get Started|Continue|Finish Setup)$/ })
    await expect(nextButton).toBeVisible({ timeout: 5000 })
    await nextButton.click()
  }

  await expect(page.getByText("You're all set!")).toBeVisible()
  await page.getByRole('button', { name: 'Go to Command Center' }).click()
  await page.waitForURL('**/app')
  await expect(page.getByText('NEXORA COMMAND CENTER')).toBeVisible()
})
