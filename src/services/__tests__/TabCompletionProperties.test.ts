import fc from 'fast-check';
import { commandProcessor, type TerminalContext } from '../CommandProcessor';
import { fileSystemService } from '../FileSystemService';

// **Feature: personal-brand-website, Property 4: Tab completion accuracy**
// **Validates: Requirements 1.5**

describe('Tab Completion Property Tests', () => {
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

  it('Property 4: Tab completion accuracy - For any directory state and partial command input, tab completion should suggest only valid completions that exist in the current context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Test command completions
          fc.record({
            type: fc.constant('command'),
            partial: fc.oneof(
              fc.constant('h'),
              fc.constant('he'),
              fc.constant('l'),
              fc.constant('ls'),
              fc.constant('c'),
              fc.constant('cd'),
              fc.constant('ca'),
              fc.constant('cat'),
              fc.constant('p'),
              fc.constant('pw'),
              fc.constant('pwd'),
              fc.constant('v'),
              fc.constant('vi'),
              fc.constant('view'),
              fc.constant('cl'),
              fc.constant('cle'),
              fc.constant('clear'),
              fc.constant('w'),
              fc.constant('wh'),
              fc.constant('who'),
              fc.constant('whoami'),
              fc.constant('t'),
              fc.constant('tr'),
              fc.constant('tree')
            ),
          }),
          // Test file/directory completions
          fc.record({
            type: fc.constant('file'),
            command: fc.oneof(
              fc.constant('cd'),
              fc.constant('cat'),
              fc.constant('view'),
              fc.constant('ls')
            ),
            partial: fc.oneof(
              fc.constant('a'),
              fc.constant('ar'),
              fc.constant('art'),
              fc.constant('artist'),
              fc.constant('s'),
              fc.constant('st'),
              fc.constant('stu'),
              fc.constant('studio'),
              fc.constant('p'),
              fc.constant('pr'),
              fc.constant('pro'),
              fc.constant('proj'),
              fc.constant('projects'),
              fc.constant('g'),
              fc.constant('ga'),
              fc.constant('gal'),
              fc.constant('gallery'),
              fc.constant('c'),
              fc.constant('co'),
              fc.constant('com'),
              fc.constant('comm'),
              fc.constant('commissions')
            ),
          })
        ),
        async (testCase) => {
          let input: string;

          if (testCase.type === 'command') {
            input = testCase.partial;
          } else {
            input = `${testCase.command} ${testCase.partial}`;
          }

          // Get completions
          const completions = await commandProcessor.getCompletions(
            input,
            mockContext.currentDirectory
          );

          // Property 1: All completions should start with the partial input
          if (testCase.type === 'command') {
            completions.forEach((completion) => {
              expect(completion.toLowerCase()).toMatch(
                new RegExp(`^${testCase.partial.toLowerCase()}`)
              );
            });

            // Property 2: All completions should be valid commands
            const availableCommands = commandProcessor.getAvailableCommands();
            completions.forEach((completion) => {
              expect(availableCommands).toContain(completion);
            });
          } else {
            // For file completions, verify they exist in the current directory
            const currentContents =
              await fileSystemService.getCurrentDirectoryContents();
            const availableNames = currentContents.map((item) =>
              item.type === 'directory' ? `${item.name}/` : item.name
            );

            completions.forEach((completion) => {
              // Extract just the filename/dirname from the completion
              const completionName = completion.split(' ').pop() || '';

              if (completionName) {
                expect(completionName.toLowerCase()).toMatch(
                  new RegExp(`^${testCase.partial.toLowerCase()}`)
                );

                // Check if the completion exists in available names
                const matchesAvailable = availableNames.some((name) =>
                  name.toLowerCase().startsWith(testCase.partial.toLowerCase())
                );

                if (matchesAvailable) {
                  expect(
                    availableNames.some(
                      (name) =>
                        name.toLowerCase() === completionName.toLowerCase()
                    )
                  ).toBe(true);
                }
              }
            });
          }

          // Property 3: Completions should be unique
          const uniqueCompletions = [...new Set(completions)];
          expect(completions).toEqual(uniqueCompletions);

          // Property 4: Completions should be sorted
          const sortedCompletions = [...completions].sort();
          expect(completions).toEqual(sortedCompletions);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 4b: Tab completion should handle empty input correctly', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(''), async (emptyInput) => {
        // Get completions for empty input
        const completions = await commandProcessor.getCompletions(
          emptyInput,
          mockContext.currentDirectory
        );

        // Property: Empty input should return all available commands, sorted
        const availableCommands = commandProcessor
          .getAvailableCommands()
          .sort();
        expect(completions).toEqual(availableCommands);
      }),
      { numRuns: 10 }
    );
  });

  it('Property 4c: Tab completion should handle invalid partial inputs gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('xyz'),
          fc.constant('invalid'),
          fc.constant('notacommand'),
          fc.constant('fakefile'),
          fc.constant('cd nonexistent'),
          fc.constant('cat missing.txt')
        ),
        async (invalidInput) => {
          // Get completions for invalid input
          const completions = await commandProcessor.getCompletions(
            invalidInput,
            mockContext.currentDirectory
          );

          // Property: Invalid input should return empty array or valid alternatives
          expect(Array.isArray(completions)).toBe(true);

          // If completions are returned, they should be valid
          if (completions.length > 0) {
            const words = invalidInput.trim().split(' ');
            if (words.length === 1) {
              // Command completion - should be valid commands
              const availableCommands = commandProcessor.getAvailableCommands();
              completions.forEach((completion) => {
                expect(availableCommands).toContain(completion);
              });
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
