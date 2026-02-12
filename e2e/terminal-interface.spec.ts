import { test, expect } from '@playwright/test';

test.describe('Terminal Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the terminal to be ready
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
  });

  test('should display welcome message', async ({ page }) => {
    await expect(page.locator('text=Welcome to Andrew Garman\'s Portfolio Terminal')).toBeVisible();
  });

  test('should execute help command', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('help');
    await input.press('Enter');
    
    await expect(page.locator('text=Available commands:')).toBeVisible();
    await expect(page.locator('text=ls')).toBeVisible();
    await expect(page.locator('text=cd')).toBeVisible();
    await expect(page.locator('text=cat')).toBeVisible();
  });

  test('should execute ls command', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('ls');
    await input.press('Enter');
    
    // Should show directory contents
    await expect(page.locator('text=📁 artist')).toBeVisible();
    await expect(page.locator('text=📁 projects')).toBeVisible();
    await expect(page.locator('text=📁 studio')).toBeVisible();
  });

  test('should navigate directories with cd command', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to artist directory
    await input.fill('cd artist');
    await input.press('Enter');
    
    // Check that prompt shows new directory
    await expect(page.locator('text=dru@portfolio:~/artist$')).toBeVisible();
    
    // List contents of artist directory
    await input.fill('ls');
    await input.press('Enter');
    
    await expect(page.locator('text=📄 bio.md')).toBeVisible();
  });

  test('should display current directory with pwd', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('pwd');
    await input.press('Enter');
    
    await expect(page.locator('pre:has-text("~")')).toBeVisible();
  });

  test('should clear terminal with clear command', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Execute some commands first
    await input.fill('help');
    await input.press('Enter');
    
    await expect(page.locator('text=Available commands:')).toBeVisible();
    
    // Clear the terminal
    await input.fill('clear');
    await input.press('Enter');
    
    // Help text should no longer be visible
    await expect(page.locator('text=Available commands:')).not.toBeVisible();
  });

  test('should handle invalid commands', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('invalidcommand');
    await input.press('Enter');
    
    await expect(page.locator('text=Command not found:')).toBeVisible();
  });

  test('should support command history with arrow keys', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Execute a command
    await input.fill('help');
    await input.press('Enter');
    
    // Use arrow up to recall command
    await input.press('ArrowUp');
    
    await expect(input).toHaveValue('help');
  });

  test('should support tab completion', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Type partial command
    await input.fill('he');
    await input.press('Tab');
    
    // Should complete to 'help'
    await expect(input).toHaveValue('help ');
  });
});

test.describe('File System Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
  });

  test('should navigate through project directories', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to projects
    await input.fill('cd projects');
    await input.press('Enter');
    
    await input.fill('ls');
    await input.press('Enter');
    
    await expect(page.locator('text=📁 web-apps')).toBeVisible();
    await expect(page.locator('text=📁 client-sites')).toBeVisible();
    await expect(page.locator('text=📁 experiments')).toBeVisible();
    
    // Navigate deeper
    await input.fill('cd web-apps');
    await input.press('Enter');
    
    await input.fill('ls');
    await input.press('Enter');
    
    await expect(page.locator('text=📁 portfolio-terminal')).toBeVisible();
  });

  test('should navigate back with cd ..', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to a subdirectory
    await input.fill('cd projects/web-apps');
    await input.press('Enter');
    
    // Navigate back
    await input.fill('cd ..');
    await input.press('Enter');
    
    await expect(page.locator('text=dru@portfolio:~/projects$')).toBeVisible();
  });

  test('should handle file viewing with cat command', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to artist directory and view bio
    await input.fill('cd artist');
    await input.press('Enter');
    
    await input.fill('cat bio.md');
    await input.press('Enter');
    
    // Should display file content
    await expect(page.locator('text=Andrew "Dru" Garman')).toBeVisible();
  });
});

test.describe('Project Showcase', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
  });

  test('should display project information', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to a project
    await input.fill('cd projects/web-apps/portfolio-terminal');
    await input.press('Enter');
    
    await input.fill('ls');
    await input.press('Enter');
    
    // Should show project files
    await expect(page.locator('text=📄 README.md')).toBeVisible();
    await expect(page.locator('text=📋 tech-stack.json')).toBeVisible();
    await expect(page.locator('text=🔗 launch.link')).toBeVisible();
  });

  test('should open external links', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to a project with external links
    await input.fill('cd projects/web-apps/portfolio-terminal');
    await input.press('Enter');
    
    await input.fill('cat launch.link');
    await input.press('Enter');
    
    // Should show link with open button
    await expect(page.locator('text=Open →')).toBeVisible();
    
    // Test clicking the link (in a new context to avoid navigation)
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.locator('text=Open →').click()
    ]);
    
    // Verify new page opened
    expect(newPage.url()).toContain('http');
  });

  test('should display tech stack information', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to a project
    await input.fill('cd projects/web-apps/portfolio-terminal');
    await input.press('Enter');
    
    await input.fill('cat tech-stack.json');
    await input.press('Enter');
    
    // Should display formatted JSON
    await expect(page.locator('text=Next.js')).toBeVisible();
    await expect(page.locator('text=TypeScript')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should work on mobile devices', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Should show mobile navigation toggle
    await expect(page.locator('[data-testid="mobile-nav-toggle"]')).toBeVisible();

    // Should show mobile-friendly terminal
    const input = page.locator('[data-testid="terminal-input"]');
    await expect(input).toBeVisible();

    // Test basic command execution on mobile
    await input.fill('help');
    await input.press('Enter');

    await expect(page.locator('text=Available commands:')).toBeVisible();
  });

  test('should show quick command buttons on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Should show quick command buttons
    await expect(page.locator('[data-testid="quick-command-ls"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-command-help"]')).toBeVisible();

    // Test quick command execution
    await page.locator('[data-testid="quick-command-ls"]').click();

    await expect(page.locator('text=📁 artist')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Terminal input should be focusable
    const input = page.locator('[data-testid="terminal-input"]');
    await input.focus();
    await expect(input).toBeFocused();

    // Should be able to navigate with keyboard
    await input.fill('help');
    await input.press('Enter');

    await expect(page.locator('text=Available commands:')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Check for ARIA labels on interactive elements
    const input = page.locator('[data-testid="terminal-input"]');
    await expect(input).toHaveAttribute('aria-label');

    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should announce state changes to screen readers', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Check for ARIA live regions
    await expect(page.locator('[aria-live]')).toBeVisible();
  });
});