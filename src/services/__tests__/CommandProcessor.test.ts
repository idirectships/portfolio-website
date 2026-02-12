import fc from 'fast-check';
import { CommandProcessor, type TerminalContext } from '../CommandProcessor';

// **Feature: personal-brand-website, Property 3: Error handling completeness**
// **Validates: Requirements 1.4**

describe('CommandProcessor Property Tests', () => {
  let processor: CommandProcessor;
  let mockContext: TerminalContext;

  beforeEach(() => {
    processor = new CommandProcessor();
    mockContext = {
      currentDirectory: '~',
      setCurrentDirectory: jest.fn(),
      clearOutput: jest.fn(),
    };
  });

  it('Property 3: Error handling completeness - For any invalid command input, the system should provide helpful error messages rather than crashing or displaying cryptic errors', () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 100 })
          .filter(
            (s) =>
              !['help', 'pwd', 'whoami', 'clear', 'ls', 'cd'].includes(
                s.toLowerCase().split(' ')[0]
              )
          ),
        (invalidCommand) => {
          const result = processor.processCommand(invalidCommand, mockContext);

          // Property: All invalid commands should return helpful error messages
          expect(result.output).toContain('Command not found:');
          expect(result.output).toContain('Type "help" for available commands');
          expect(result.error).toBeDefined();

          // Property: Error messages should be user-friendly (not cryptic)
          expect(result.output).not.toContain('undefined');
          expect(result.output).not.toContain('null');
          expect(result.output).not.toContain('[object Object]');
          expect(result.output).not.toMatch(/Error:/);
          expect(result.output).not.toMatch(/Exception:/);

          // Property: System should not crash (result should be well-formed)
          expect(typeof result.output).toBe('string');
          expect(result.output.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 3b: Valid command consistency - For any valid command, the system should execute without errors', () => {
    const validCommands = [
      'help',
      'pwd',
      'whoami',
      'clear',
      'ls',
      'cd',
      'cd ~',
      'cd artist',
      'cd studio',
      'cd projects',
      'cd ..',
    ];

    validCommands.forEach((command) => {
      const result = processor.processCommand(command, mockContext);

      // Property: Valid commands should not produce error messages
      expect(result.output).not.toContain('Command not found:');
      expect(result.output).not.toContain('An error occurred');

      // Property: Result should be well-formed
      expect(typeof result.output).toBe('string');

      // Property: System should not crash
      expect(result).toBeDefined();
      expect(result.output).toBeDefined();
    });
  });

  it('Property 3c: Command input sanitization - For any string input, the processor should handle it safely', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string({ minLength: 0, maxLength: 1000 }),
          fc.constant(''),
          fc.constant('   '),
          fc.constant('\n\t\r'),
          fc.string().map((s) => s + '\0'), // null bytes
          fc.string().map((s) => s.repeat(100)) // very long strings
        ),
        (input) => {
          // Property: No input should cause the processor to throw exceptions
          expect(() => {
            const result = processor.processCommand(input, mockContext);
            expect(result).toBeDefined();
            expect(typeof result.output).toBe('string');
          }).not.toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property 3d: Tab completion consistency - For any partial command input, completions should be valid', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 10 }), (partial) => {
        const completions = processor.getCompletions(partial);

        // Property: All completions should be valid command names
        const validCommands = processor.getAvailableCommands();
        completions.forEach((completion) => {
          expect(validCommands).toContain(completion);
        });

        // Property: All completions should start with the partial input
        if (partial.trim().length > 0) {
          completions.forEach((completion) => {
            expect(completion.toLowerCase()).toMatch(
              new RegExp(`^${partial.toLowerCase()}`)
            );
          });
        }

        // Property: Completions should be unique
        const uniqueCompletions = [...new Set(completions)];
        expect(completions).toEqual(uniqueCompletions);
      }),
      { numRuns: 50 }
    );
  });
});

describe('CommandProcessor Unit Tests', () => {
  let processor: CommandProcessor;
  let mockContext: TerminalContext;

  beforeEach(() => {
    processor = new CommandProcessor();
    mockContext = {
      currentDirectory: '~',
      setCurrentDirectory: jest.fn(),
      clearOutput: jest.fn(),
    };
  });

  it('should handle help command', () => {
    const result = processor.processCommand('help', mockContext);
    expect(result.output).toContain('Available commands:');
    expect(result.error).toBeUndefined();
  });

  it('should handle pwd command', () => {
    const result = processor.processCommand('pwd', mockContext);
    expect(result.output).toBe('~');
    expect(result.error).toBeUndefined();
  });

  it('should handle whoami command', () => {
    const result = processor.processCommand('whoami', mockContext);
    expect(result.output).toContain('Andrew "Dru" Garman');
    expect(result.error).toBeUndefined();
  });

  it('should handle clear command', () => {
    const result = processor.processCommand('clear', mockContext);
    expect(mockContext.clearOutput).toHaveBeenCalled();
    expect(result.output).toBe('');
  });

  it('should handle ls command', () => {
    const result = processor.processCommand('ls', mockContext);
    expect(result.output).toContain('📁 artist/');
    expect(result.error).toBeUndefined();
  });

  it('should handle cd command with valid directory', () => {
    const result = processor.processCommand('cd artist', mockContext);
    expect(result.newDirectory).toBe('~/artist');
    expect(result.error).toBeUndefined();
  });

  it('should handle cd command with invalid directory', () => {
    const result = processor.processCommand('cd invalid', mockContext);
    expect(result.output).toContain('no such file or directory');
    expect(result.error).toBeDefined();
  });

  it('should provide tab completions', () => {
    const completions = processor.getCompletions('he');
    expect(completions).toContain('help');
  });

  it('should handle empty input', () => {
    const result = processor.processCommand('', mockContext);
    expect(result.output).toBe('');
    expect(result.error).toBeUndefined();
  });

  it('should handle whitespace-only input', () => {
    const result = processor.processCommand('   ', mockContext);
    expect(result.output).toBe('');
    expect(result.error).toBeUndefined();
  });
});
