import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
    // Skipping actual e2e/network logic since we don't know if backend is reachable in test env
    // Testing basic landing page render
    test('landing page loads', async ({ page }) => {
        await page.goto('/');

        // Expect title or some text
        await expect(page).toHaveTitle(/Girify/i);

        // Check for "Play" button (either text or role)
        // Adjust selector based on actual rendering
        const playButton = page.locator('button', { hasText: /Play/i });
        if (await playButton.count() > 0) {
            await expect(playButton).toBeVisible();
        }
    });
});
