import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Should have a main heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Terminal input should have proper labeling
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Should have aria-label or associated label
    const hasAriaLabel = await input.getAttribute('aria-label');
    const hasAriaLabelledBy = await input.getAttribute('aria-labelledby');
    const inputId = await input.getAttribute('id');
    const hasLabel = inputId ? await page.locator(`label[for="${inputId}"]`).count() > 0 : false;

    expect(hasAriaLabel || hasAriaLabelledBy || hasLabel).toBeTruthy();
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Terminal input should be focusable
    const input = page.locator('[data-testid="terminal-input"]');
    await input.focus();
    await expect(input).toBeFocused();

    // Should have visible focus indicators
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Should be able to navigate with Tab key
    await page.keyboard.press('Tab');
    
    // Some element should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Should be able to use terminal with keyboard only
    const input = page.locator('[data-testid="terminal-input"]');
    await input.focus();
    await input.type('help');
    await input.press('Enter');

    await expect(page.locator('text=Available commands:')).toBeVisible();
  });

  test('should have proper ARIA live regions', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Should have ARIA live regions for dynamic content
    const liveRegions = page.locator('[aria-live]');
    await expect(liveRegions).toHaveCount(1, { timeout: 5000 });

    // Test that live region announces changes
    const input = page.locator('[data-testid="terminal-input"]');
    await input.fill('help');
    await input.press('Enter');

    // Content should be announced to screen readers
    await expect(page.locator('text=Available commands:')).toBeVisible();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Run axe with color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    );

    expect(colorContrastViolations).toEqual([]);
  });

  test('should work with screen reader simulation', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Check for screen reader friendly content
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Should have accessible name
    const accessibleName = await input.getAttribute('aria-label') || 
                          await input.getAttribute('aria-labelledby') ||
                          await input.getAttribute('placeholder');
    
    expect(accessibleName).toBeTruthy();

    // Should announce state changes
    await input.fill('ls');
    await input.press('Enter');

    // Check that content is properly structured for screen readers
    await expect(page.locator('text=📁 artist')).toBeVisible();
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Content should still be visible and functional
    const input = page.locator('[data-testid="terminal-input"]');
    await expect(input).toBeVisible();

    await input.fill('help');
    await input.press('Enter');

    await expect(page.locator('text=Available commands:')).toBeVisible();
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Animations should be reduced or disabled
    // Terminal should still be functional
    const input = page.locator('[data-testid="terminal-input"]');
    await input.fill('help');
    await input.press('Enter');

    await expect(page.locator('text=Available commands:')).toBeVisible();
  });

  test('should have proper semantic HTML structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Should use semantic HTML elements
    await expect(page.locator('main')).toBeVisible();
    
    // Should have proper landmarks
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').count();
    expect(landmarks).toBeGreaterThan(0);
  });

  test('should handle mobile accessibility', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Mobile navigation should be accessible
    const navToggle = page.locator('[data-testid="mobile-nav-toggle"]');
    await expect(navToggle).toBeVisible();
    
    // Should have proper ARIA attributes
    const hasAriaLabel = await navToggle.getAttribute('aria-label');
    const hasAriaExpanded = await navToggle.getAttribute('aria-expanded');
    
    expect(hasAriaLabel || hasAriaExpanded).toBeTruthy();

    // Should be keyboard accessible
    await navToggle.focus();
    await expect(navToggle).toBeFocused();
  });
});