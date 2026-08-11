import { test, expect } from '@playwright/test'
import { login } from './helpers'

test('forecast report loads and shows per-product model badges', async ({ page }) => {
  await login(page)
  await page.goto('/app/reports/forecast')

  await expect(page.getByRole('heading', { name: 'Forecast Report' })).toBeVisible()

  // Mock/naive/real-ML mode all render one of these model labels once data resolves.
  await expect(page.getByText(/XGBoost|Random Forest|Naive Projection/).first()).toBeVisible({ timeout: 10000 })

  // Granularity switch re-fetches without erroring.
  await page.locator('select').first().selectOption({ label: 'Monthly' })
  await expect(page.getByText('Product-Level Demand Projection')).toBeVisible()
})
