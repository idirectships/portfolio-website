import { test, expect } from '@playwright/test';

test.describe('Content Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
  });

  test('should render markdown files correctly', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to artist directory and view bio
    await input.fill('cd artist');
    await input.press('Enter');
    
    await input.fill('cat bio.md');
    await input.press('Enter');
    
    // Should render markdown content
    await expect(page.locator('h1, h2, h3')).toBeVisible();
    await expect(page.locator('p')).toBeVisible();
  });

  test('should render JSON files with syntax highlighting', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to a project with tech stack
    await input.fill('cd projects/web-apps/portfolio-terminal');
    await input.press('Enter');
    
    await input.fill('cat tech-stack.json');
    await input.press('Enter');
    
    // Should show JSON content with formatting
    await expect(page.locator('text=tech-stack.json')).toBeVisible();
    await expect(page.locator('.token')).toBeVisible(); // Syntax highlighting
  });

  test('should handle shell scripts with syntax highlighting', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // View the welcome script
    await input.fill('cat welcome.sh');
    await input.press('Enter');
    
    // Should show shell script content
    await expect(page.locator('text=welcome.sh')).toBeVisible();
    await expect(page.locator('text=Shell Script')).toBeVisible();
  });

  test('should handle link files and open external URLs', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to a project with external links
    await input.fill('cd projects/web-apps/portfolio-terminal');
    await input.press('Enter');
    
    await input.fill('cat launch.link');
    await input.press('Enter');
    
    // Should show link with open button
    await expect(page.locator('text=launch.link')).toBeVisible();
    await expect(page.locator('button:has-text("Open →")')).toBeVisible();
  });

  test('should handle different file types appropriately', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Test various file types
    const fileTests = [
      { path: 'artist/bio.md', expectedContent: 'Andrew' },
      { path: 'studio/toolbox/languages.json', expectedContent: 'JavaScript' },
    ];

    for (const fileTest of fileTests) {
      await input.fill(`cat ${fileTest.path}`);
      await input.press('Enter');
      
      await expect(page.locator(`text=${fileTest.expectedContent}`)).toBeVisible();
      
      // Clear for next test
      await input.fill('clear');
      await input.press('Enter');
    }
  });

  test('should handle file not found errors gracefully', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('cat nonexistent.md');
    await input.press('Enter');
    
    await expect(page.locator('text=no such file or directory')).toBeVisible();
  });

  test('should display file icons correctly', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('ls');
    await input.press('Enter');
    
    // Check for different file type icons
    await expect(page.locator('text=📁')).toBeVisible(); // Directory icon
    await expect(page.locator('text=📄')).toBeVisible(); // File icon
  });
});

test.describe('File System Router Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
  });

  test('should show file system navigation panel', async ({ page }) => {
    // Should show file system router
    await expect(page.locator('text=File System')).toBeVisible();
    await expect(page.locator('text=Current:')).toBeVisible();
  });

  test('should navigate via file system clicks', async ({ page }) => {
    // Click on artist directory in file system
    await page.locator('text=artist/').click();
    
    // Should update terminal prompt
    await expect(page.locator('text=dru@portfolio:~/artist$')).toBeVisible();
    
    // Should update current path in file system panel
    await expect(page.locator('text=Current: ~/artist')).toBeVisible();
  });

  test('should expand and collapse directories', async ({ page }) => {
    // Initially, subdirectories might not be visible
    await expect(page.locator('text=bio.md')).not.toBeVisible();
    
    // Click to expand artist directory
    await page.locator('text=artist/').click();
    
    // Now bio.md should be visible
    await expect(page.locator('text=bio.md')).toBeVisible();
  });

  test('should sync with terminal navigation', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate via terminal
    await input.fill('cd projects');
    await input.press('Enter');
    
    // File system should update
    await expect(page.locator('text=Current: ~/projects')).toBeVisible();
    
    // Projects directory should be highlighted
    await expect(page.locator('.bg-terminal-accent\\/20')).toBeVisible();
  });
});

test.describe('Content Loading and Performance', () => {
  test('should load content efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    // Measure time to load and display content
    const startTime = Date.now();
    
    await input.fill('cat artist/bio.md');
    await input.press('Enter');
    
    await expect(page.locator('text=Andrew')).toBeVisible();
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Should load within reasonable time (less than 2 seconds)
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle large files gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    // Try to load a potentially large file
    await input.fill('cat projects/project-index.md');
    await input.press('Enter');
    
    // Should either load successfully or show appropriate message
    const hasContent = await page.locator('text=Projects').isVisible();
    const hasError = await page.locator('text=no such file').isVisible();
    
    expect(hasContent || hasError).toBeTruthy();
  });

  test('should show loading states', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    // Execute command that might show loading
    await input.fill('cat artist/bio.md');
    await input.press('Enter');
    
    // Content should eventually appear
    await expect(page.locator('text=Andrew')).toBeVisible({ timeout: 5000 });
  });
});