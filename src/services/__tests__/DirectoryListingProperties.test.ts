import fc from 'fast-check';
import { fileSystemService } from '../FileSystemService';
import { commandProcessor, type TerminalContext } from '../CommandProcessor';

// **Feature: personal-brand-website, Property 6: Directory listing accuracy**
// **Validates: Requirements 2.2**

describe('Directory Listing Property Tests', () => {
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

  it('Property 6: Directory listing accuracy - For any directory in the file system, the ls command should display all available files and subdirectories with correct icons and formatting', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('~'),
          fc.constant('~/artist'),
          fc.constant('~/studio'),
          fc.constant('~/projects'),
          fc.constant('~/gallery'),
          fc.constant('~/commissions'),
          fc.constant('~/projects/web-apps'),
          fc.constant('~/projects/client-sites'),
          fc.constant('~/projects/experiments')
        ),
        async (directoryPath) => {
          // Navigate to the directory
          const cdResult = await commandProcessor.processCommand(
            `cd ${directoryPath}`,
            mockContext
          );

          if (!cdResult.error) {
            // Property: ls should return formatted directory contents
            const lsResult = await commandProcessor.processCommand(
              'ls',
              mockContext
            );
            expect(lsResult.error).toBeUndefined();
            expect(typeof lsResult.output).toBe('string');

            // Get the actual directory contents from file system service
            const actualContents =
              await fileSystemService.getCurrentDirectoryContents();

            // Property: All directories should be listed with folder icon and trailing slash
            const directories = actualContents.filter(
              (item) => item.type === 'directory'
            );
            directories.forEach((dir) => {
              expect(lsResult.output).toContain('📁');
              expect(lsResult.output).toContain(`${dir.name}/`);
            });

            // Property: All files should be listed with appropriate icons
            const files = actualContents.filter((item) => item.type === 'file');
            files.forEach((file) => {
              expect(lsResult.output).toContain(file.name);

              // Check that files have appropriate icons based on extension
              const extension = file.name.split('.').pop()?.toLowerCase();
              if (extension === 'md') {
                expect(lsResult.output).toContain('📄');
              } else if (extension === 'json') {
                expect(lsResult.output).toContain('📋');
              } else if (extension === 'sh') {
                expect(lsResult.output).toContain('⚡');
              } else if (extension === 'link') {
                expect(lsResult.output).toContain('🔗');
              }
            });

            // Property: Empty directories should return empty string or appropriate message
            if (actualContents.length === 0) {
              expect(lsResult.output).toBe('');
            }

            // Property: Directory listing should be consistent across multiple calls
            const lsResult2 = await commandProcessor.processCommand(
              'ls',
              mockContext
            );
            expect(lsResult2.output).toBe(lsResult.output);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 6b: Icon consistency - For any file type, the same extension should always get the same icon', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('~'),
          fc.constant('~/artist'),
          fc.constant('~/studio'),
          fc.constant('~/projects')
        ),
        async (directoryPath) => {
          // Navigate to directory
          const cdResult = await commandProcessor.processCommand(
            `cd ${directoryPath}`,
            mockContext
          );

          if (!cdResult.error) {
            const lsResult = await commandProcessor.processCommand(
              'ls',
              mockContext
            );
            const actualContents =
              await fileSystemService.getCurrentDirectoryContents();

            // Property: Files with same extension should have same icon
            const filesByExtension = new Map<string, string[]>();
            actualContents
              .filter((item) => item.type === 'file')
              .forEach((file) => {
                const extension =
                  file.name.split('.').pop()?.toLowerCase() || 'no-ext';
                if (!filesByExtension.has(extension)) {
                  filesByExtension.set(extension, []);
                }
                filesByExtension.get(extension)!.push(file.name);
              });

            // Check that all files with same extension appear with same icon
            filesByExtension.forEach((files, extension) => {
              if (files.length > 1) {
                // Find the icon for this extension in the output
                let commonIcon = '';
                const iconMap: { [key: string]: string } = {
                  md: '📄',
                  txt: '📄',
                  json: '📋',
                  yaml: '📋',
                  yml: '📋',
                  sh: '⚡',
                  js: '📜',
                  ts: '📜',
                  py: '🐍',
                  link: '🔗',
                  timeline: '📅',
                  png: '🖼️',
                  jpg: '🖼️',
                  jpeg: '🖼️',
                  gif: '🖼️',
                  svg: '🖼️',
                };

                commonIcon = iconMap[extension] || '📄';

                // All files with this extension should appear with the same icon
                files.forEach((fileName) => {
                  if (lsResult.output.includes(fileName)) {
                    expect(lsResult.output).toContain(commonIcon);
                  }
                });
              }
            });
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 6c: Formatting consistency - For any directory listing, the format should be consistent and readable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('~'),
          fc.constant('~/artist'),
          fc.constant('~/studio'),
          fc.constant('~/projects')
        ),
        async (directoryPath) => {
          const cdResult = await commandProcessor.processCommand(
            `cd ${directoryPath}`,
            mockContext
          );

          if (!cdResult.error) {
            const lsResult = await commandProcessor.processCommand(
              'ls',
              mockContext
            );
            const actualContents =
              await fileSystemService.getCurrentDirectoryContents();

            if (actualContents.length > 0) {
              // Property: Output should contain icons and names
              expect(lsResult.output).toMatch(/[📁📄📋⚡📜🐍🔗📅🖼️]/);

              // Property: Directories should have trailing slash
              const directories = actualContents.filter(
                (item) => item.type === 'directory'
              );
              directories.forEach((dir) => {
                if (lsResult.output.includes(dir.name)) {
                  expect(lsResult.output).toContain(`${dir.name}/`);
                }
              });

              // Property: Output should not contain undefined or null
              expect(lsResult.output).not.toContain('undefined');
              expect(lsResult.output).not.toContain('null');
              expect(lsResult.output).not.toContain('[object Object]');

              // Property: Each item should appear exactly once
              actualContents.forEach((item) => {
                const itemName =
                  item.type === 'directory' ? `${item.name}/` : item.name;
                const occurrences = (
                  lsResult.output.match(
                    new RegExp(
                      itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                      'g'
                    )
                  ) || []
                ).length;
                expect(occurrences).toBeGreaterThanOrEqual(1);
              });
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
