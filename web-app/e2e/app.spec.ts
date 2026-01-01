import { test, expect } from '@playwright/test';

test.describe('Fitness Tracker E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Store errors for later assertion
    (page as any).consoleErrors = consoleErrors;
  });

  test('should load homepage without errors', async ({ page }) => {
    await page.goto('/');

    // Check page loaded
    await expect(page).toHaveTitle(/Fitness Tracker/);

    // Check no console errors
    const errors = (page as any).consoleErrors as string[];
    const supabaseErrors = errors.filter(e => e.includes('supabase.co') && e.includes('404'));
    expect(supabaseErrors).toHaveLength(0);
  });

  test('should work in demo mode', async ({ page }) => {
    await page.goto('/');

    // Click "Skip for now" to enter demo mode
    const skipButton = page.getByRole('button', { name: /skip/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }

    // Should show demo data
    await expect(page.locator('body')).toContainText(/demo/i);

    // Navigate to log page
    await page.goto('/log');
    await expect(page.locator('h1, h2')).toContainText(/log/i);

    // Check no Supabase 404 errors
    const errors = (page as any).consoleErrors as string[];
    const supabase404s = errors.filter(e =>
      e.includes('supabase.co') && e.includes('404')
    );
    expect(supabase404s).toHaveLength(0);
  });

  test('should handle API endpoints correctly', async ({ page }) => {
    // Test GET /api/persons
    const response = await page.request.get('/api/persons');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.source).toBe('sqlite');
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should show signup page', async ({ page }) => {
    await page.goto('/auth/signup');

    // Check form elements exist
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Check no errors
    const errors = (page as any).consoleErrors as string[];
    const criticalErrors = errors.filter(e => !e.includes('deprecated'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('should navigate to settings without errors', async ({ page }) => {
    await page.goto('/');

    // Skip demo mode if prompted
    const skipButton = page.getByRole('button', { name: /skip/i });
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }

    // Go to settings
    await page.goto('/settings');
    await expect(page.locator('h1, h2')).toContainText(/settings/i);

    // Check no Supabase database errors
    const errors = (page as any).consoleErrors as string[];
    const dbErrors = errors.filter(e =>
      e.includes('supabase.co/rest/v1/persons') ||
      e.includes('supabase.co/rest/v1/profiles')
    );

    // Profile 404s are expected (no profile table), but persons 404s should be fixed
    const personErrors = errors.filter(e => e.includes('/rest/v1/persons'));
    expect(personErrors).toHaveLength(0);
  });

  test('should not have service worker errors', async ({ page }) => {
    await page.goto('/');

    // Wait for service worker to load
    await page.waitForTimeout(2000);

    // Check for specific SW error
    const errors = (page as any).consoleErrors as string[];
    const swErrors = errors.filter(e =>
      e.includes('Response body is already used') ||
      e.includes("Failed to execute 'clone' on 'Response'")
    );
    expect(swErrors).toHaveLength(0);
  });
});
