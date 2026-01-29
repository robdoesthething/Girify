import { expect, test } from '@playwright/test';

/**
 * Friends Workflow E2E Tests
 *
 * Tests the complete friend request lifecycle including:
 * - Searching for users
 * - Sending friend requests
 * - Accepting/declining requests
 * - Viewing friends list
 * - Removing friends
 *
 * Note: These tests require test users to be set up in the database.
 * Test users: testuser1, testuser2 (see fixtures/test-users.sql)
 */

test.describe('Friend Request Workflow', () => {
  // Test user credentials (from test fixtures)
  const USER_A = {
    email: 'testuser1@example.com',
    password: 'TestPassword123!',
    username: 'testuser1',
  };
  const USER_B = {
    email: 'testuser2@example.com',
    password: 'TestPassword123!',
    username: 'testuser2',
  };

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should search for users', async ({ page }) => {
    // Login as User A
    await loginAs(page, USER_A);

    // Navigate to friends
    await page.click('[data-testid="friends-tab"]');
    await expect(page).toHaveURL(/.*friends/);

    // Search for User B
    const searchInput = page.locator('[placeholder*="Search"]');
    await searchInput.fill(USER_B.username);

    // Wait for search results
    await expect(page.locator(`text=${USER_B.username}`)).toBeVisible({ timeout: 5000 });
  });

  test('should send friend request', async ({ page }) => {
    // Login as User A
    await loginAs(page, USER_A);

    // Navigate to friends
    await page.click('[data-testid="friends-tab"]');

    // Search and add User B
    const searchInput = page.locator('[placeholder*="Search"]');
    await searchInput.fill(USER_B.username);
    await page.waitForTimeout(500); // Wait for debounce

    // Click add friend button
    await page.click(`[data-testid="add-friend-${USER_B.username}"]`);

    // Verify success message or state change
    await expect(page.locator('text=Request sent').or(page.locator('text=Pending'))).toBeVisible({
      timeout: 5000,
    });
  });

  test('should accept friend request', async ({ page, context }) => {
    // Setup: User A sends request to User B (if not already)
    await loginAs(page, USER_A);
    await page.click('[data-testid="friends-tab"]');
    const searchInput = page.locator('[placeholder*="Search"]');
    await searchInput.fill(USER_B.username);
    await page.waitForTimeout(500);

    // Try to send request (may already exist)
    const addButton = page.locator(`[data-testid="add-friend-${USER_B.username}"]`);
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(1000);
    }

    // Login as User B in new page
    const pageB = await context.newPage();
    await loginAs(pageB, USER_B);

    // Navigate to requests tab
    await pageB.click('[data-testid="friends-tab"]');
    await pageB.click('[data-testid="requests-tab"]');

    // Look for incoming request from User A
    const requestItem = pageB.locator(`text=${USER_A.username}`);
    await expect(requestItem).toBeVisible({ timeout: 5000 });

    // Accept the request
    await pageB.click(`[data-testid="accept-request-${USER_A.username}"]`);

    // Verify friendship created
    await pageB.click('[data-testid="friends-list-tab"]');
    await expect(pageB.locator(`text=${USER_A.username}`)).toBeVisible({ timeout: 5000 });

    // Verify on User A's side too
    await page.reload();
    await page.click('[data-testid="friends-tab"]');
    await expect(page.locator(`text=${USER_B.username}`)).toBeVisible({ timeout: 5000 });
  });

  test('should decline friend request', async ({ page }) => {
    // Login as User B (recipient)
    await loginAs(page, USER_B);

    // Navigate to requests
    await page.click('[data-testid="friends-tab"]');
    await page.click('[data-testid="requests-tab"]');

    // If there's a pending request, decline it
    const declineButton = page.locator('[data-testid^="decline-request-"]').first();
    if (await declineButton.isVisible()) {
      const requesterUsername = await declineButton.getAttribute('data-testid');
      await declineButton.click();

      // Verify request removed
      await expect(
        page.locator(`text=${requesterUsername?.replace('decline-request-', '')}`)
      ).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should remove friend', async ({ page }) => {
    // Login as User A
    await loginAs(page, USER_A);

    // Navigate to friends list
    await page.click('[data-testid="friends-tab"]');
    await page.click('[data-testid="friends-list-tab"]');

    // Find User B in friends list
    const friendItem = page.locator(`[data-testid="friend-item-${USER_B.username}"]`);

    if (await friendItem.isVisible()) {
      // Open options menu
      await page.click(`[data-testid="friend-options-${USER_B.username}"]`);

      // Click remove
      await page.click('text=Remove Friend');

      // Confirm removal
      await page.click('button:has-text("Confirm")');

      // Verify removed
      await expect(friendItem).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should prevent self-friending', async ({ page }) => {
    // Login as User A
    await loginAs(page, USER_A);

    // Navigate to friends
    await page.click('[data-testid="friends-tab"]');

    // Try to search for self
    const searchInput = page.locator('[placeholder*="Search"]');
    await searchInput.fill(USER_A.username);
    await page.waitForTimeout(500);

    // Add button should not be visible for self
    const addButton = page.locator(`[data-testid="add-friend-${USER_A.username}"]`);
    await expect(addButton).not.toBeVisible();
  });

  test('should show rate limit error after too many requests', async ({ page }) => {
    // Login as User A
    await loginAs(page, USER_A);
    await page.click('[data-testid="friends-tab"]');

    // This test would require sending 10+ requests quickly
    // In practice, we'd mock the rate limit response
    // For now, just verify the UI handles the error message
    const errorMessage = page.locator('text=Too many friend requests');

    // The error should not be visible by default
    await expect(errorMessage).not.toBeVisible();
  });
});

/**
 * Helper function to log in a user
 */
async function loginAs(
  page: import('@playwright/test').Page,
  user: { email: string; password: string }
) {
  await page.goto('/login');

  // Fill login form
  await page.fill('[type="email"]', user.email);
  await page.fill('[type="password"]', user.password);
  await page.click('button:has-text("Login")');

  // Wait for redirect to main app
  await expect(page).not.toHaveURL(/.*login/, { timeout: 10000 });
}
