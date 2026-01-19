import { expect, test } from '@playwright/test';

test.describe('Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('landing page loads and allows navigation to game', async ({ page }) => {
    // 1. Verify Title
    await expect(page).toHaveTitle(/Girify/i);

    // 2. Find and Click Play Button
    // Strategy: Look for the main CTA button. Based on LandingPage.tsx, it likely text "Play Daily Challenge" or similar
    const playButton = page.getByRole('button', { name: /Play|Start/i }).first();
    await expect(playButton).toBeVisible();
    await playButton.click();

    // 3. Verify Navigation to Game Screen
    // URL should contain /game OR logic should mount GameScreen (which might be at root / if logged in/guest)
    // If the app stays on /, we check for GameScreen specific elements

    // Wait for potential lazy loading
    await page.waitForLoadState('networkidle');

    // Check for Game UI elements
    const mapContainer = page.locator('.leaflet-container');
    // const _questionPanel = page.locator('text=Which street is this?'); // Hypothetical text

    // At least the map should be visible
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
  });
});
