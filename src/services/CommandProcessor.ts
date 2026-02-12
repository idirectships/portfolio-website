import { fileSystemService } from './FileSystemService';
import { contentService } from './ContentService';
import { FileSystemNode } from '../types/portfolio';

interface Command {
  name: string;
  description: string;
  execute: (args: string[], context: TerminalContext) => Promise<CommandResult>;
}

interface CommandResult {
  output: string | JSX.Element;
  newDirectory?: string;
  error?: string;
}

interface TerminalContext {
  currentDirectory: string;
  setCurrentDirectory: (dir: string) => void;
  clearOutput: () => void;
}

export class CommandProcessor {
  private commands: Map<string, Command> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor() {
    this.registerDefaultCommands();
    this.registerDefaultAliases();
  }

  private registerDefaultCommands(): void {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Show available commands',
      execute: async () => {
        const commandHelp = `Available commands:
  help     - Show this help message
  ls       - List directory contents
  cd       - Change directory
  pwd      - Show current directory
  cat      - Display file contents (plain text)
  view     - Display file contents with enhanced formatting
  clear    - Clear terminal output
  reset    - Reset terminal session (clear history and return home)
  whoami   - Display user information
  tree     - Show directory tree

Common aliases:
  ll, la, dir → ls    c, cls → clear    ?, h → help
  .., home → cd       type → cat        more, less → view
  
Use tab completion for file and directory names.
Use ↑/↓ arrow keys to navigate command history.`;

        return { output: commandHelp };
      },
    });

    // PWD command
    this.registerCommand({
      name: 'pwd',
      description: 'Show current directory',
      execute: async () => ({
        output: fileSystemService.getCurrentPath(),
      }),
    });

    // Whoami command
    this.registerCommand({
      name: 'whoami',
      description: 'Display user information',
      execute: async () => ({
        output: 'Andrew "Dru" Garman - AI Implementation Specialist',
      }),
    });

    // Clear command
    this.registerCommand({
      name: 'clear',
      description: 'Clear terminal output',
      execute: async (_, context) => {
        context.clearOutput();
        return { output: '' };
      },
    });

    // Reset command to clear session
    this.registerCommand({
      name: 'reset',
      description: 'Reset terminal session (clear history and return to home)',
      execute: async (_, context) => {
        // Clear localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('terminal-command-history');
            localStorage.removeItem('terminal-current-directory');
          } catch {
            // Ignore localStorage errors
          }
        }

        // Reset to home directory
        context.setCurrentDirectory('~');
        context.clearOutput();

        return {
          output:
            'Terminal session reset. History cleared and returned to home directory.',
          newDirectory: '~',
        };
      },
    });

    // LS command
    this.registerCommand({
      name: 'ls',
      description: 'List directory contents',
      execute: async (args) => {
        const path = args[0];
        const output = await fileSystemService.listDirectory(path);
        return { output };
      },
    });

    // CD command
    this.registerCommand({
      name: 'cd',
      description: 'Change directory',
      execute: async (args, context) => {
        const targetDir = args[0] || '~';
        const result = await fileSystemService.navigateToDirectory(targetDir);

        if (result.success && result.newPath) {
          context.setCurrentDirectory(result.newPath);
          return { output: '', newDirectory: result.newPath };
        } else {
          return {
            output: result.error || `cd: failed to navigate to ${targetDir}`,
            error: result.error,
          };
        }
      },
    });

    // CAT command
    this.registerCommand({
      name: 'cat',
      description: 'Display file contents',
      execute: async (args) => {
        if (args.length === 0) {
          return {
            output: 'cat: missing file operand\nUsage: cat <filename>',
            error: 'Missing file argument',
          };
        }

        const filename = args[0];
        let filePath: string;

        // Handle different path formats
        if (filename.startsWith('~/')) {
          filePath = filename;
        } else if (filename.startsWith('/')) {
          filePath = '~' + filename;
        } else {
          // Relative to current directory
          const currentPath = fileSystemService.getCurrentPath();
          filePath =
            currentPath === '~'
              ? `~/${filename}`
              : `${currentPath}/${filename}`;
        }

        // Check if it's a .link file and handle specially
        if (filename.endsWith('.link')) {
          const content = await fileSystemService.getFileContent(filePath);
          if (content === null) {
            return {
              output: `cat: ${filename}: No such file or directory`,
              error: `File not found: ${filename}`,
            };
          }

          const url = content.trim();
          // Open the link in a new tab
          if (typeof window !== 'undefined') {
            window.open(url, '_blank', 'noopener,noreferrer');
          }

          return {
            output: `Opening ${url} in new tab...`,
          };
        }

        const content = await fileSystemService.getFileContent(filePath);

        if (content === null) {
          return {
            output: `cat: ${filename}: No such file or directory`,
            error: `File not found: ${filename}`,
          };
        }

        return { output: content };
      },
    });

    // VIEW command (enhanced content rendering)
    this.registerCommand({
      name: 'view',
      description: 'Display file contents with enhanced formatting',
      execute: async (args) => {
        if (args.length === 0) {
          return {
            output: 'view: missing file operand\nUsage: view <filename>',
            error: 'Missing file argument',
          };
        }

        const filename = args[0];
        let filePath: string;

        // Handle different path formats
        if (filename.startsWith('~/')) {
          filePath = filename;
        } else if (filename.startsWith('/')) {
          filePath = '~' + filename;
        } else {
          // Relative to current directory
          const currentPath = fileSystemService.getCurrentPath();
          filePath =
            currentPath === '~'
              ? `~/${filename}`
              : `${currentPath}/${filename}`;
        }

        // Get file node for ContentRenderer
        const fileNode = await fileSystemService.getFileNode(filePath);
        if (!fileNode) {
          return {
            output: `view: ${filename}: No such file or directory`,
            error: `File not found: ${filename}`,
          };
        }

        const content = await fileSystemService.getFileContent(filePath);
        if (content === null) {
          return {
            output: `view: ${filename}: No such file or directory`,
            error: `File not found: ${filename}`,
          };
        }

        // Return a special marker that the TerminalInterface will recognize
        return {
          output: `__RENDER_CONTENT__${JSON.stringify({ file: fileNode, content })}__END_RENDER__`,
        };
      },
    });

    // TREE command
    this.registerCommand({
      name: 'tree',
      description: 'Show directory tree',
      execute: async () => {
        const tree = fileSystemService.getFileSystemTree();
        if (!tree) {
          return { output: 'File system not initialized' };
        }

        const formatTree = (
          node: FileSystemNode,
          prefix = '',
          isLast = true
        ): string => {
          const connector = isLast ? '└── ' : '├── ';
          const icon = node.type === 'directory' ? '📁' : '📄';
          let result = `${prefix}${connector}${icon} ${node.name}\n`;

          if (node.children && node.children.length > 0) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            node.children.forEach((child: FileSystemNode, index: number) => {
              const childIsLast = index === (node.children?.length ?? 0) - 1;
              result += formatTree(child, newPrefix, childIsLast);
            });
          }

          return result;
        };

        return { output: formatTree(tree).trim() };
      },
    });
  }

  private registerDefaultAliases(): void {
    // Common Unix-like aliases
    this.aliases.set('ll', 'ls');
    this.aliases.set('la', 'ls');
    this.aliases.set('dir', 'ls');
    this.aliases.set('cls', 'clear');
    this.aliases.set('exit', 'clear');
    this.aliases.set('quit', 'clear');

    // Convenience aliases
    this.aliases.set('?', 'help');
    this.aliases.set('h', 'help');
    this.aliases.set('c', 'clear');
    this.aliases.set('l', 'ls');

    // Navigation shortcuts
    this.aliases.set('..', 'cd ..');
    this.aliases.set('~', 'cd ~');
    this.aliases.set('home', 'cd ~');

    // File viewing shortcuts
    this.aliases.set('type', 'cat');
    this.aliases.set('more', 'view');
    this.aliases.set('less', 'view');
  }

  registerCommand(command: Command): void {
    this.commands.set(command.name.toLowerCase(), command);
  }

  processCommand(
    input: string,
    context: TerminalContext
  ): Promise<CommandResult> {
    const trimmedInput = input.trim();

    // Handle empty input
    if (!trimmedInput) {
      return Promise.resolve({ output: '' });
    }

    const [commandName, ...args] = trimmedInput.split(' ');

    // Check for aliases first
    const resolvedCommandName =
      this.aliases.get(commandName.toLowerCase()) || commandName;

    // If alias resolves to a command with arguments, parse it
    let finalCommandName = resolvedCommandName;
    let finalArgs = args;

    if (resolvedCommandName.includes(' ')) {
      const aliasedParts = resolvedCommandName.split(' ');
      finalCommandName = aliasedParts[0];
      finalArgs = [...aliasedParts.slice(1), ...args];
    }

    const command = this.commands.get(finalCommandName.toLowerCase());

    if (!command) {
      return Promise.resolve(this.handleUnknownCommand(commandName));
    }

    try {
      return command.execute(finalArgs, context);
    } catch (error) {
      return Promise.resolve({
        output: 'An error occurred while executing the command.',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private handleUnknownCommand(commandName: string): CommandResult {
    const suggestions = Array.from(this.commands.keys());
    const similar = suggestions.find((cmd) =>
      cmd.startsWith(commandName.charAt(0))
    );
    const suggestion = similar ? `\nDid you mean: ${similar}?` : '';

    return {
      output: `Command not found: ${commandName}${suggestion}\nType "help" for available commands.`,
      error: `Unknown command: ${commandName}`,
    };
  }

  getAvailableCommands(): string[] {
    return Array.from(this.commands.keys());
  }

  getAvailableAliases(): Map<string, string> {
    return new Map(this.aliases);
  }

  registerAlias(alias: string, command: string): void {
    this.aliases.set(alias.toLowerCase(), command);
  }

  getCommandDescription(commandName: string): string | undefined {
    const command = this.commands.get(commandName.toLowerCase());
    return command?.description;
  }

  // Tab completion support
  async getCompletions(
    partial: string,
    currentPath?: string
  ): Promise<string[]> {
    const trimmedPartial = partial.trim();

    // If no input, return all commands sorted
    if (!trimmedPartial) {
      return this.getAvailableCommands().sort();
    }

    // Split input to determine what we're completing
    const words = trimmedPartial.split(' ');

    if (words.length === 1) {
      // Completing command name
      const commandPartial = words[0].toLowerCase();
      return this.getAvailableCommands()
        .filter((cmd) => cmd.startsWith(commandPartial))
        .sort();
    } else {
      // Completing file/directory path for commands that take file arguments
      const commandName = words[0].toLowerCase();
      const pathPartial = words[words.length - 1];

      // Commands that accept file/directory arguments
      const fileCommands = ['cd', 'cat', 'view', 'ls'];

      if (fileCommands.includes(commandName)) {
        const pathCompletions = await fileSystemService.getPathCompletions(
          pathPartial,
          currentPath
        );
        return pathCompletions.sort();
      }

      // For other commands, no completions
      return [];
    }
  }
}

// Export singleton instance
export const commandProcessor = new CommandProcessor();
export type { Command, CommandResult, TerminalContext };
export { fileSystemService, contentService };
