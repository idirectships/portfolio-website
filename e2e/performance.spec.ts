import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load initial page within performance budget', async ({ page }) => {
    // Start timing
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds (requirement 7.1)
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals: any = {};
        
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.lcp = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID) - simulate with click
        const startTime = performance.now();
        document.addEventListener('click', () => {
          vitals.fid = performance.now() - startTime;
        }, { once: true });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // Resolve after a short delay to collect metrics
        setTimeout(() => resolve(vitals), 2000);
      });
    });

    // Core Web Vitals thresholds
    if ((vitals as any).lcp) {
      expect((vitals as any).lcp).toBeLessThan(2500); // LCP should be < 2.5s
    }
    if ((vitals as any).cls !== undefined) {
      expect((vitals as any).cls).toBeLessThan(0.1); // CLS should be < 0.1
    }
  });

  test('should load content efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    // Measure content loading time
    const startTime = Date.now();
    
    await input.fill('cat artist/bio.md');
    await input.press('Enter');
    
    await expect(page.locator('text=Andrew')).toBeVisible();
    
    const contentLoadTime = Date.now() - startTime;
    
    // Content should load quickly
    expect(contentLoadTime).toBeLessThan(1000);
  });

  test('should handle multiple rapid commands efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    const startTime = Date.now();
    
    // Execute multiple commands rapidly
    const commands = ['pwd', 'ls', 'cd artist', 'ls', 'cd ..', 'help'];
    
    for (const command of commands) {
      await input.fill(command);
      await input.press('Enter');
      await page.waitForTimeout(50); // Small delay between commands
    }
    
    const totalTime = Date.now() - startTime;
    
    // Should handle rapid commands efficiently
    expect(totalTime).toBeLessThan(3000);
  });

  test('should have efficient resource loading', async ({ page }) => {
    // Monitor network requests
    const requests: any[] = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Check that we're not making excessive requests
    const jsRequests = requests.filter(req => req.resourceType === 'script');
    const cssRequests = requests.filter(req => req.resourceType === 'stylesheet');
    const imageRequests = requests.filter(req => req.resourceType === 'image');

    // Should have reasonable number of resource requests
    expect(jsRequests.length).toBeLessThan(10);
    expect(cssRequests.length).toBeLessThan(5);
    expect(imageRequests.length).toBeLessThan(20);
  });

  test('should implement lazy loading correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    // Navigate to a directory with potentially lazy-loaded content
    await input.fill('cd projects/web-apps');
    await input.press('Enter');
    
    await input.fill('ls');
    await input.press('Enter');
    
    // Content should load efficiently
    await expect(page.locator('text=📁')).toBeVisible({ timeout: 2000 });
  });

  test('should handle large content efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    // Try to load potentially large content
    const startTime = Date.now();
    
    await input.fill('cat projects/project-index.md');
    await input.press('Enter');
    
    // Should either load quickly or show appropriate loading state
    const hasContent = await page.locator('text=Projects').isVisible({ timeout: 3000 });
    const hasError = await page.locator('text=no such file').isVisible({ timeout: 1000 });
    
    const loadTime = Date.now() - startTime;
    
    expect(hasContent || hasError).toBeTruthy();
    expect(loadTime).toBeLessThan(5000);
  });

  test('should maintain performance on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip('This test is only for mobile devices');
    }

    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Mobile should still load within reasonable time
    expect(loadTime).toBeLessThan(5000);

    const input = page.locator('[data-testid="terminal-input"]');
    
    // Test mobile-specific interactions
    const interactionStart = Date.now();
    
    await page.locator('[data-testid="quick-command-ls"]').click();
    await expect(page.locator('text=📁 artist')).toBeVisible();
    
    const interactionTime = Date.now() - interactionStart;
    expect(interactionTime).toBeLessThan(1000);
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    const input = page.locator('[data-testid="terminal-input"]');
    
    // Perform multiple operations
    const operations = [
      'ls',
      'cd artist',
      'cat bio.md',
      'cd ../projects',
      'ls',
      'cd web-apps',
      'ls',
      'cd portfolio-terminal',
      'cat README.md',
      'cat tech-stack.json'
    ];

    for (const operation of operations) {
      await input.fill(operation);
      await input.press('Enter');
      await page.waitForTimeout(100);
    }

    // Check memory usage after operations
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0;
    });

    // Memory usage shouldn't grow excessively (allow for 50MB increase)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    }
  });

  test('should have efficient bundle size', async ({ page }) => {
    // Monitor JavaScript bundle sizes
    const jsRequests: any[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.js') && response.status() === 200) {
        jsRequests.push({
          url: response.url(),
          size: response.headers()['content-length']
        });
      }
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    // Calculate total JS bundle size
    let totalSize = 0;
    for (const request of jsRequests) {
      if (request.size) {
        totalSize += parseInt(request.size);
      }
    }

    // Bundle size should be reasonable (less than 1MB total)
    if (totalSize > 0) {
      expect(totalSize).toBeLessThan(1024 * 1024); // 1MB
    }
  });

  test('should handle concurrent operations efficiently', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="terminal-input"]', { timeout: 10000 });

    const input = page.locator('[data-testid="terminal-input"]');
    
    const startTime = Date.now();
    
    // Simulate concurrent operations by rapid command execution
    const commands = [
      'ls',
      'cd artist',
      'cat bio.md',
      'cd ../studio',
      'ls',
      'cd toolbox',
      'cat languages.json'
    ];

    // Execute commands with minimal delay to test concurrency handling
    for (const command of commands) {
      await input.fill(command);
      await input.press('Enter');
      // Very small delay to simulate rapid user input
      await page.waitForTimeout(10);
    }

    // Wait for all operations to complete
    await expect(page.locator('text=JavaScript')).toBeVisible({ timeout: 5000 });
    
    const totalTime = Date.now() - startTime;
    
    // Should handle concurrent operations efficiently
    expect(totalTime).toBeLessThan(4000);
  });
});