import { test, expect } from '@playwright/test';

test.describe('User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
  });

  test('Complete portfolio exploration journey', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // 1. Start with help to understand available commands
    await input.fill('help');
    await input.press('Enter');
    await expect(page.locator('text=Available commands:')).toBeVisible();
    
    // 2. Explore the root directory
    await input.fill('ls');
    await input.press('Enter');
    await expect(page.locator('text=📁 artist')).toBeVisible();
    await expect(page.locator('text=📁 projects')).toBeVisible();
    await expect(page.locator('text=📁 studio')).toBeVisible();
    
    // 3. Learn about the person
    await input.fill('cd artist');
    await input.press('Enter');
    await input.fill('cat bio.md');
    await input.press('Enter');
    await expect(page.locator('text=Andrew')).toBeVisible();
    
    // 4. Explore projects
    await input.fill('cd ../projects');
    await input.press('Enter');
    await input.fill('ls');
    await input.press('Enter');
    await expect(page.locator('text=📁 web-apps')).toBeVisible();
    
    // 5. Look at a specific project
    await input.fill('cd web-apps/portfolio-terminal');
    await input.press('Enter');
    await input.fill('cat README.md');
    await input.press('Enter');
    
    // 6. Check tech stack
    await input.fill('cat tech-stack.json');
    await input.press('Enter');
    await expect(page.locator('text=Next.js')).toBeVisible();
    
    // 7. Try to open live demo
    await input.fill('cat launch.link');
    await input.press('Enter');
    await expect(page.locator('text=Open →')).toBeVisible();
  });

  test('Recruiter evaluation journey', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // 1. Quick overview of who this person is
    await input.fill('whoami');
    await input.press('Enter');
    await expect(page.locator('text=Andrew "Dru" Garman')).toBeVisible();
    
    // 2. Check professional background
    await input.fill('cd artist');
    await input.press('Enter');
    await input.fill('cat bio.md');
    await input.press('Enter');
    
    // 3. Review technical skills
    await input.fill('cd ../studio/toolbox');
    await input.press('Enter');
    await input.fill('cat languages.json');
    await input.press('Enter');
    await expect(page.locator('text=JavaScript')).toBeVisible();
    
    // 4. Examine recent projects
    await input.fill('cd ../../projects/web-apps');
    await input.press('Enter');
    await input.fill('ls');
    await input.press('Enter');
    
    // 5. Deep dive into a significant project
    await input.fill('cd ai-recruiter-assistant');
    await input.press('Enter');
    await input.fill('cat README.md');
    await input.press('Enter');
    
    // 6. Check if there's a live demo
    await input.fill('cat launch.link');
    await input.press('Enter');
  });

  test('Technical assessment journey', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // 1. Explore technical projects
    await input.fill('cd projects');
    await input.press('Enter');
    await input.fill('tree');
    await input.press('Enter');
    
    // 2. Look at experimental work
    await input.fill('cd experiments');
    await input.press('Enter');
    await input.fill('ls');
    await input.press('Enter');
    
    // 3. Examine a technical experiment
    await input.fill('cd voice-to-code');
    await input.press('Enter');
    await input.fill('cat README.md');
    await input.press('Enter');
    
    // 4. Check the technical implementation
    await input.fill('cat tech-stack.json');
    await input.press('Enter');
    
    // 5. Look at development process
    await input.fill('cd ../../behind-the-scenes');
    await input.press('Enter');
    await input.fill('ls');
    await input.press('Enter');
  });

  test('Client consultation journey', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // 1. Review client work
    await input.fill('cd projects/client-sites');
    await input.press('Enter');
    await input.fill('ls');
    await input.press('Enter');
    
    // 2. Examine a client project
    await input.fill('cd techcorp-landing');
    await input.press('Enter');
    await input.fill('cat README.md');
    await input.press('Enter');
    
    // 3. See the live result
    await input.fill('cat launch.link');
    await input.press('Enter');
    
    // 4. Check capabilities and services
    await input.fill('cd ../../../studio');
    await input.press('Enter');
    await input.fill('ls');
    await input.press('Enter');
    
    // 5. Review toolbox and capabilities
    await input.fill('cd toolbox');
    await input.press('Enter');
    await input.fill('cat languages.json');
    await input.press('Enter');
  });

  test('Mobile user journey', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    const input = page.locator('[data-testid="terminal-input"]');
    
    // 1. Use mobile navigation
    await page.locator('[data-testid="mobile-nav-toggle"]').click();
    await expect(page.locator('[data-testid="mobile-nav-panel"]')).toBeVisible();
    
    // 2. Navigate via mobile menu
    await page.locator('text=artist/').click();
    await expect(page.locator('text=dru@portfolio:~/artist$')).toBeVisible();
    
    // 3. Use quick commands
    await page.locator('[data-testid="quick-command-ls"]').click();
    await expect(page.locator('text=📄 bio.md')).toBeVisible();
    
    // 4. View content on mobile
    await input.fill('cat bio.md');
    await input.press('Enter');
    await expect(page.locator('text=Andrew')).toBeVisible();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
  });

  test('should handle invalid commands gracefully', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('invalidcommand');
    await input.press('Enter');
    
    await expect(page.locator('text=Command not found:')).toBeVisible();
    
    // Terminal should still be functional
    await input.fill('help');
    await input.press('Enter');
    await expect(page.locator('text=Available commands:')).toBeVisible();
  });

  test('should handle invalid paths gracefully', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('cd nonexistent-directory');
    await input.press('Enter');
    
    await expect(page.locator('text=no such file or directory')).toBeVisible();
    
    // Should remain in current directory
    await input.fill('pwd');
    await input.press('Enter');
    await expect(page.locator('pre:has-text("~")')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network issues by going offline
    await page.context().setOffline(true);
    
    const input = page.locator('[data-testid="terminal-input"]');
    
    await input.fill('cat artist/bio.md');
    await input.press('Enter');
    
    // Should show appropriate error message or cached content
    const hasError = await page.locator('text=Failed to load').isVisible();
    const hasContent = await page.locator('text=Andrew').isVisible();
    
    expect(hasError || hasContent).toBeTruthy();
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('should handle rapid command execution', async ({ page }) => {
    const input = page.locator('[data-testid="terminal-input"]');
    
    // Execute multiple commands rapidly
    const commands = ['pwd', 'ls', 'help', 'whoami', 'clear'];
    
    for (const command of commands) {
      await input.fill(command);
      await input.press('Enter');
      // Small delay to allow processing
      await page.waitForTimeout(100);
    }
    
    // Terminal should still be responsive
    await input.fill('help');
    await input.press('Enter');
    await expect(page.locator('text=Available commands:')).toBeVisible();
  });
});

test.describe('Performance and Loading', () => {
  test('should load initial page quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle multiple file loads efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    const startTime = Date.now();
    
    // Load multiple files in sequence
    const files = [
      'artist/bio.md',
      'studio/toolbox/languages.json',
      'projects/project-index.md'
    ];
    
    for (const file of files) {
      await input.fill(`cat ${file}`);
      await input.press('Enter');
      await page.waitForTimeout(500); // Wait for content to load
    }
    
    const totalTime = Date.now() - startTime;
    
    // Should complete within reasonable time
    expect(totalTime).toBeLessThan(10000);
  });
});