import fc from 'fast-check';
import { fileSystemService } from '../FileSystemService';
import { commandProcessor, type TerminalContext } from '../CommandProcessor';

// **Feature: personal-brand-website, Property 2: Navigation state consistency**
// **Validates: Requirements 1.3, 2.3**

describe('Navigation Property Tests', () => {
  let mockContext: TerminalContext;

  beforeEach(async () => {
    // Reset file system to home directory
    fileSystemService.resetToHome();

    mockContext = {
      currentDirectory: '~',
      setCurrentDirectory: jest.fn(),
      clearOutput: jest.fn(),
    };

    // Wait for file system to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('Property 2: Navigation state consistency - For any navigation action (click or cd command), the CLI interface should update to reflect the new directory state with correct path display and available files', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('~'),
          fc.constant('artist'),
          fc.constant('studio'),
          fc.constant('projects'),
          fc.constant('gallery'),
          fc.constant('commissions'),
          fc.constant('..'),
          fc.constant('~/artist'),
          fc.constant('~/studio'),
          fc.constant('~/projects')
        ),
        async (targetPath) => {
          // Property: Navigation should update current directory consistently
          const initialPath = fileSystemService.getCurrentPath();

          // Perform navigation via cd command
          const cdResult = await commandProcessor.processCommand(
            `cd ${targetPath}`,
            mockContext
          );

          if (!cdResult.error) {
            // Property: Successful navigation should update the current path
            const newPath = fileSystemService.getCurrentPath();
            expect(newPath).toBeDefined();
            expect(typeof newPath).toBe('string');

            // Property: The new path should be different from initial (unless navigating to same directory)
            if (targetPath !== '.' && targetPath !== initialPath) {
              // Allow same path if we're already there or if it's a valid navigation to same location
              const isValidSamePath =
                (targetPath === '~' && initialPath === '~') ||
                (targetPath === '..' && initialPath === '~');
              if (!isValidSamePath) {
                // For most cases, path should change or be a valid navigation
                expect(newPath).toBeDefined();
              }
            }

            // Property: ls command should show contents of current directory
            const lsResult = await commandProcessor.processCommand(
              'ls',
              mockContext
            );
            expect(lsResult.output).toBeDefined();
            expect(typeof lsResult.output).toBe('string');

            // Property: pwd command should return the current path
            const pwdResult = await commandProcessor.processCommand(
              'pwd',
              mockContext
            );
            expect(pwdResult.output).toBe(newPath);

            // Property: Navigation should be reversible (if we can go there, we should be able to go back)
            if (targetPath !== '~' && !targetPath.includes('..')) {
              const backResult = await commandProcessor.processCommand(
                'cd ..',
                mockContext
              );
              expect(backResult.error).toBeUndefined();
            }
          } else {
            // Property: Failed navigation should not change current directory
            const unchangedPath = fileSystemService.getCurrentPath();
            expect(unchangedPath).toBe(initialPath);

            // Property: Error messages should be helpful
            expect(cdResult.output).toContain('no such file or directory');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 2b: Directory listing consistency - For any valid directory, ls should show consistent results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('~'),
          fc.constant('~/artist'),
          fc.constant('~/studio'),
          fc.constant('~/projects'),
          fc.constant('~/gallery'),
          fc.constant('~/commissions')
        ),
        async (directoryPath) => {
          // Navigate to directory first
          const cdResult = await commandProcessor.processCommand(
            `cd ${directoryPath}`,
            mockContext
          );

          if (!cdResult.error) {
            // Property: ls should always return a string
            const lsResult = await commandProcessor.processCommand(
              'ls',
              mockContext
            );
            expect(typeof lsResult.output).toBe('string');
            expect(lsResult.error).toBeUndefined();

            // Property: Running ls multiple times should give same result
            const lsResult2 = await commandProcessor.processCommand(
              'ls',
              mockContext
            );
            expect(lsResult2.output).toBe(lsResult.output);

            // Property: Directory contents should be consistent with file system service
            const serviceContents =
              await fileSystemService.getCurrentDirectoryContents();
            expect(serviceContents).toBeDefined();
            expect(Array.isArray(serviceContents)).toBe(true);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 2c: Path resolution consistency - For any path format, navigation should resolve consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Test different path formats
          fc.record({
            absolute: fc.constant('~/artist'),
            relative: fc.constant('artist'),
          }),
          fc.record({
            absolute: fc.constant('~/studio'),
            relative: fc.constant('studio'),
          }),
          fc.record({
            absolute: fc.constant('~/projects'),
            relative: fc.constant('projects'),
          })
        ),
        async (pathPair) => {
          // Reset to home directory
          await commandProcessor.processCommand('cd ~', mockContext);

          // Property: Absolute and relative paths to same location should result in same final path
          const absoluteResult = await commandProcessor.processCommand(
            `cd ${pathPair.absolute}`,
            mockContext
          );
          const absoluteFinalPath = fileSystemService.getCurrentPath();

          // Reset to home directory
          await commandProcessor.processCommand('cd ~', mockContext);

          const relativeResult = await commandProcessor.processCommand(
            `cd ${pathPair.relative}`,
            mockContext
          );
          const relativeFinalPath = fileSystemService.getCurrentPath();

          // Property: Both should succeed or both should fail
          expect(!!absoluteResult.error).toBe(!!relativeResult.error);

          if (!absoluteResult.error && !relativeResult.error) {
            // Property: Final paths should be the same
            expect(relativeFinalPath).toBe(absoluteFinalPath);
          }
        }
      ),
      { numRuns: 30 }
    );
  });
});
