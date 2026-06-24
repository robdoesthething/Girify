import { expect, test } from '@playwright/test';

/**
 * Route protection and page-render smoke tests (no auth required).
 * Verifies:
 * - /admin requires auth → redirects to /
 * - /profile requires auth → redirects to /
 * - /news is accessible to guests
 * - /leaderboard is accessible to guests
 * - /shop is accessible to guests
 * - /u/:handle public profile route renders or redirects gracefully
 */

test.describe('Route protection and public pages', () => {
  test('/admin redirects unauthenticated users away from admin panel', async ({ page }) => {
    await page.goto('http://localhost:5173/admin');
    await page.waitForURL(url => !url.pathname.startsWith('/admin'), { timeout: 5000 });
    expect(page.url()).not.toContain('/admin');
  });

  test('/profile redirects unauthenticated users to home', async ({ page }) => {
    await page.goto('http://localhost:5173/profile');
    await page.waitForURL(url => !url.pathname.startsWith('/profile'), { timeout: 5000 });
    expect(page.url()).not.toContain('/profile');
  });

  test('/news page loads for guests', async ({ page }) => {
    await page.goto('http://localhost:5173/news');
    await page.waitForLoadState('networkidle');
    // Page should render something — not a blank 404
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });

  test('/leaderboard page loads for guests', async ({ page }) => {
    await page.goto('http://localhost:5173/leaderboard');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });

  test('/shop page loads for guests', async ({ page }) => {
    await page.goto('http://localhost:5173/shop');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });

  test('/u/:handle public profile route responds without crashing', async ({ page }) => {
    await page.goto('http://localhost:5173/u/testuser');
    await page.waitForLoadState('networkidle');
    // Should render a page (profile or redirect), not a hard crash / blank
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });

  test('/feedback page loads for guests', async ({ page }) => {
    await page.goto('http://localhost:5173/feedback');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(10);
  });
});
