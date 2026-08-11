import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('reorder recommendation -> purchase order creation -> approval', async ({ page }) => {
  await login(page)

  await page.goto('/app/procurement/recommendations')

  const acceptButton = page.locator('button', { hasText: /order/i }).first()
  await expect(acceptButton).toBeVisible()
  await acceptButton.click()

  await page.waitForURL('**/procurement/purchase-orders/new**')
  await page.getByRole('button', { name: 'Submit for Approval' }).click()

  await page.waitForURL('**/procurement/purchase-orders/*')
  await expect(page.getByText('Pending Approval').first()).toBeVisible()

  await page.getByRole('button', { name: 'Approve' }).click()
  await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible()
})
