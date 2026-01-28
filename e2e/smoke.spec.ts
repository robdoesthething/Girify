import { expect, test } from '@playwright/test';

test.describe('Smoke Test', () => {
  test('landing page loads critical elements', async ({ page }) => {
    // 1. Visit Home
    await page.goto('/');

    // 2. Verify Title
    await expect(page).toHaveTitle(/Girify/i);

    // 3. Verify Landing Elements
    // The map might be loading or behind an overlay, so just check attached
    const map = page.locator('.leaflet-container');
    await expect(map).toBeAttached();

    // 4. Verify Call to Action (Sing in / Play)
    // Should see a button to start or sign in
    const cta = page.getByRole('button', { name: /Sign in|Play|Join/i }).first();
    await expect(cta).toBeVisible();

    // 4. Verify Navbar/Header exists (TopBar)
    // Assuming TopBar has a nav or specific role, or text
    // Just checking for "Girify" logo/text often found in header
    // Or looking for a generic header
    const header = page.locator('header');
    if ((await header.count()) > 0) {
      await expect(header).toBeVisible();
    } else {
      // Fallback: Check for logo text if header tag isn't used
      await expect(page.getByText('Girify').first()).toBeVisible();
    }
  });
});
