'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  useTerminalRouter,
  useTerminalSession,
} from '../hooks/useTerminalRouter';
import {
  commandProcessor,
  type TerminalContext,
} from '../services/CommandProcessor';
import {
  useCommandTracking,
  useNavigationTracking,
  useFileTracking,
} from '../hooks/useAnalytics';

// Dynamically import ContentRenderer to avoid SSR issues
const ContentRenderer = dynamic(() => import('./ContentRenderer'), {
  loading: () => <div className="text-terminal-fg/70">Loading...</div>,
  ssr: false,
});

// Dynamically import FileSystemRouter for mobile navigation
const FileSystemRouter = dynamic(() => import('./FileSystemRouter'), {
  loading: () => (
    <div className="text-terminal-fg/70">Loading navigation...</div>
  ),
  ssr: false,
});

// Dynamically import PrivacyConsent
const PrivacyConsent = dynamic(
  () =>
    import('./PrivacyConsent').then((mod) => ({ default: mod.PrivacyConsent })),
  {
    ssr: false,
  }
);

interface TerminalOutput {
  id: string;
  content: string | JSX.Element;
  type: 'command' | 'output' | 'error';
  timestamp: Date;
}

interface TerminalInterfaceProps {
  initialDirectory?: string;
  welcomeMessage?: string;
}

export default function TerminalInterface({
  initialDirectory = '~',
  welcomeMessage = "Welcome to Andrew Garman's Portfolio Terminal",
}: TerminalInterfaceProps) {
  // Analytics hooks
  const { trackCommandWithContext } = useCommandTracking();
  const { trackNavigationChange } = useNavigationTracking();
  const { startFileView, endFileView } = useFileTracking();

  // Terminal routing with browser history integration
  const {
    currentDirectory,
    commandHistory,
    navigateToDirectory,
    addCommandToHistory,
    clearHistory,
  } = useTerminalRouter(initialDirectory);

  // Session persistence
  const { saveSession, loadSession } = useTerminalSession();
  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  // Load persisted state from localStorage or URL
  const loadPersistedState = useCallback(() => {
    if (typeof window === 'undefined')
      return { history: [], directory: initialDirectory };

    // Try to load from session first, then fall back to URL state
    const sessionState = loadSession();
    if (sessionState) {
      return {
        history: sessionState.commandHistory,
        directory: sessionState.currentDirectory,
      };
    }

    // Fallback to URL state (handled by useTerminalRouter)
    return {
      history: commandHistory,
      directory: currentDirectory,
    };
  }, [initialDirectory, loadSession, commandHistory, currentDirectory]);

  const persistedState = loadPersistedState();

  const [localCommandHistory, setLocalCommandHistory] = useState<string[]>(
    persistedState.history
  );
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState('');
  const [output, setOutput] = useState<TerminalOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [tabCompletions, setTabCompletions] = useState<string[]>([]);
  const [showCompletions, setShowCompletions] = useState(false);
  const [completionIndex, setCompletionIndex] = useState(0);

  // Responsive detection and viewport handling
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setViewportHeight(window.innerHeight);

      // Auto-collapse navigation on mobile
      if (mobile && !isNavCollapsed) {
        setIsNavCollapsed(true);
      }
    };

    const handleResize = () => {
      checkMobile();

      // Detect virtual keyboard on mobile
      if (isMobile) {
        const heightDiff = viewportHeight - window.innerHeight;
        setIsKeyboardOpen(heightDiff > 150);
      }
    };

    checkMobile();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkMobile, 100);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, [isMobile, viewportHeight]);

  // Persist state to localStorage and URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Save to session storage
    saveSession({
      currentDirectory,
      commandHistory: localCommandHistory,
    });

    // Legacy localStorage support (for backward compatibility)
    try {
      localStorage.setItem(
        'terminal-command-history',
        JSON.stringify(localCommandHistory)
      );
      localStorage.setItem('terminal-current-directory', currentDirectory);
    } catch {
      // Ignore localStorage errors
    }
  }, [localCommandHistory, currentDirectory, saveSession]);

  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize with enhanced welcome animation
  useEffect(() => {
    const welcomeSequence = async () => {
      // Check if we're in a test environment
      const isTest = process.env.NODE_ENV === 'test';
      const delay = isTest ? 0 : 800;
      const typeDelay = isTest ? 0 : 50;

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Enhanced welcome sequence with typing animation
      const welcomeLines = [
        '╔══════════════════════════════════════════════════════════════╗',
        '║                                                              ║',
        '║    █████╗ ███╗   ██╗██████╗ ██████╗ ███████╗██╗    ██╗      ║',
        '║   ██╔══██╗████╗  ██║██╔══██╗██╔══██╗██╔════╝██║    ██║      ║',
        '║   ███████║██╔██╗ ██║██║  ██║██████╔╝█████╗  ██║ █╗ ██║      ║',
        '║   ██╔══██║██║╚██╗██║██║  ██║██╔══██╗██╔══╝  ██║███╗██║      ║',
        '║   ██║  ██║██║ ╚████║██████╔╝██║  ██║███████╗╚███╔███╔╝      ║',
        '║   ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚══╝╚══╝       ║',
        '║                                                              ║',
        '║              "DRU" GARMAN - AI IMPLEMENTATION SPECIALIST     ║',
        '║                                                              ║',
        '╚══════════════════════════════════════════════════════════════╝',
        '',
        '🚀 Initializing portfolio terminal...',
        '📁 Loading file system...',
        '⚡ Configuring command processor...',
        '🎯 Ready for exploration!',
        '',
        welcomeMessage,
        '',
        '💡 Quick tips:',
        '   • Type "help" to see available commands',
        '   • Use Tab for auto-completion',
        '   • Navigate with ↑/↓ arrow keys for command history',
        '   • Try "ls" to explore directories',
        '   • Use "tree" to see the full structure',
        '',
        '🎨 Explore: artist/ studio/ projects/ gallery/ commissions/',
        '',
      ];

      // Type out each line with animation
      for (let i = 0; i < welcomeLines.length; i++) {
        const line = welcomeLines[i];

        if (isTest) {
          // In tests, add lines immediately
          setOutput((prev) => [
            ...prev,
            {
              id: `welcome-${i}`,
              content: line,
              type: 'output',
              timestamp: new Date(),
            },
          ]);
        } else {
          // Animate typing for visual effect
          let typedContent = '';

          for (let j = 0; j <= line.length; j++) {
            typedContent = line.substring(0, j);

            setOutput((prev) => {
              const newOutput = [...prev];
              const existingIndex = newOutput.findIndex(
                (item) => item.id === `welcome-${i}`
              );

              if (existingIndex >= 0) {
                newOutput[existingIndex] = {
                  id: `welcome-${i}`,
                  content: typedContent + (j < line.length ? '█' : ''),
                  type: 'output',
                  timestamp: new Date(),
                };
              } else {
                newOutput.push({
                  id: `welcome-${i}`,
                  content: typedContent + (j < line.length ? '█' : ''),
                  type: 'output',
                  timestamp: new Date(),
                });
              }

              return newOutput;
            });

            if (j < line.length) {
              await new Promise((resolve) => setTimeout(resolve, typeDelay));
            }
          }
        }

        // Pause between lines
        await new Promise((resolve) => setTimeout(resolve, isTest ? 0 : 100));
      }

      setShowWelcome(false);
    };

    welcomeSequence();
  }, [welcomeMessage]);

  // Focus input on mount and keep it focused
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && !isLoading) {
        inputRef.current.focus();
      }
    };

    focusInput();

    // Refocus when clicking anywhere on the terminal
    const handleClick = () => focusInput();
    document.addEventListener('click', handleClick);

    // Keyboard navigation support
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Focus terminal input on any key press (accessibility)
      if (e.key.length === 1 || e.key === 'Backspace') {
        focusInput();
      }

      // Handle escape key to clear completions
      if (e.key === 'Escape' && showCompletions) {
        setShowCompletions(false);
        setTabCompletions([]);
        setCompletionIndex(0);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isLoading, showCompletions]);

  // Screen reader announcements
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announce = useCallback((message: string) => {
    setAnnouncements((prev) => [...prev, message]);
    // Clear announcement after screen reader has time to read it
    setTimeout(() => {
      setAnnouncements((prev) => prev.slice(1));
    }, 1000);
  }, []);

  // Announce state changes for screen readers
  useEffect(() => {
    if (currentDirectory) {
      announce(`Current directory changed to ${currentDirectory}`);
    }
  }, [currentDirectory, announce]);

  useEffect(() => {
    if (showCompletions && tabCompletions.length > 0) {
      announce(
        `${tabCompletions.length} tab completions available. Use arrow keys to navigate.`
      );
    }
  }, [showCompletions, tabCompletions.length, announce]);

  useEffect(() => {
    if (output.length > 0) {
      const lastOutput = output[output.length - 1];
      if (lastOutput.type === 'error') {
        announce('Command resulted in an error');
      } else if (
        lastOutput.type === 'output' &&
        typeof lastOutput.content === 'string'
      ) {
        // Announce brief summary of output for screen readers
        const contentPreview = lastOutput.content.slice(0, 100);
        announce(
          `Command output: ${contentPreview}${lastOutput.content.length > 100 ? '...' : ''}`
        );
      }
    }
  }, [output, announce]);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const getPrompt = useCallback(() => {
    return `dru@portfolio:${currentDirectory}$`;
  }, [currentDirectory]);

  const processCommand = useCallback(
    async (
      command: string
    ): Promise<{
      output: string | JSX.Element;
      error?: boolean;
      newDirectory?: string;
    }> => {
      const context: TerminalContext = {
        currentDirectory,
        setCurrentDirectory: navigateToDirectory,
        clearOutput: () => {
          setOutput([]);
          clearHistory();
        },
      };

      const result = await commandProcessor.processCommand(command, context);

      // Check if the output is a content rendering marker
      if (
        typeof result.output === 'string' &&
        result.output.startsWith('__RENDER_CONTENT__')
      ) {
        const contentMatch = result.output.match(
          /__RENDER_CONTENT__(.*?)__END_RENDER__/
        );
        if (contentMatch) {
          try {
            const { file, content } = JSON.parse(contentMatch[1]);
            return {
              output: (
                <ContentRenderer
                  file={file}
                  content={content}
                  renderMode="terminal"
                />
              ),
              error: !!result.error,
              newDirectory: result.newDirectory,
            };
          } catch (error) {
            console.error('Failed to parse content rendering data:', error);
            return {
              output: 'Error: Failed to render content',
              error: true,
            };
          }
        }
      }

      return {
        output:
          typeof result.output === 'string' ? result.output : result.output,
        error: !!result.error,
        newDirectory: result.newDirectory,
      };
    },
    [currentDirectory, navigateToDirectory, clearHistory]
  );

  const handleCommand = useCallback(
    async (command: string) => {
      if (!command.trim()) return;

      const commandStart = Date.now();
      const [cmd, ...args] = command.trim().split(' ');

      // Add command to history (both local and URL)
      setLocalCommandHistory((prev) => [...prev, command]);
      addCommandToHistory(command);
      setHistoryIndex(-1);

      // Add command to output
      const commandOutput: TerminalOutput = {
        id: `cmd-${Date.now()}`,
        content: `${getPrompt()} ${command}`,
        type: 'command',
        timestamp: new Date(),
      };

      setOutput((prev) => [...prev, commandOutput]);
      setCurrentCommand('');
      setIsLoading(true);

      // Simulate processing delay for realism
      const isTest = process.env.NODE_ENV === 'test';
      const delay = isTest ? 0 : Math.random() * 200 + 50;
      await new Promise((resolve) => setTimeout(resolve, delay));

      let success = true;
      let newDirectory: string | undefined;

      try {
        const result = await processCommand(command.trim());

        if (result.output) {
          const resultOutput: TerminalOutput = {
            id: `out-${Date.now()}`,
            content: result.output,
            type: result.error ? 'error' : 'output',
            timestamp: new Date(),
          };
          setOutput((prev) => [...prev, resultOutput]);
        }

        if (result.newDirectory) {
          const oldDirectory = currentDirectory;
          navigateToDirectory(result.newDirectory);
          newDirectory = result.newDirectory;

          // Track navigation change
          trackNavigationChange(newDirectory, 'command');
        }

        success = !result.error;
      } catch (error) {
        success = false;
        const errorOutput: TerminalOutput = {
          id: `err-${Date.now()}`,
          content: 'An unexpected error occurred.',
          type: 'error',
          timestamp: new Date(),
        };
        setOutput((prev) => [...prev, errorOutput]);
      } finally {
        setIsLoading(false);

        // Track command execution with analytics
        const executionTime = Date.now() - commandStart;
        trackCommandWithContext(cmd, args, {
          currentPath: currentDirectory,
          success,
          executionTime,
          errorMessage: success ? undefined : 'Command execution failed',
        });
      }
    },
    [
      getPrompt,
      processCommand,
      addCommandToHistory,
      navigateToDirectory,
      currentDirectory,
      trackCommandWithContext,
      trackNavigationChange,
    ]
  );

  const getTabCompletions = useCallback(
    async (input: string): Promise<string[]> => {
      const words = input.trim().split(' ');

      if (words.length === 1) {
        // Completing command name
        const partial = words[0].toLowerCase();
        const commands = commandProcessor.getAvailableCommands();
        return commands.filter((cmd) => cmd.startsWith(partial));
      } else {
        // Completing file/directory path
        // Get completions from the command processor
        const completions = await commandProcessor.getCompletions(
          input,
          currentDirectory
        );

        return completions;
      }
    },
    [currentDirectory]
  );

  const handleTabCompletion = useCallback(async () => {
    if (showCompletions && tabCompletions.length > 0) {
      // Apply the selected completion
      const selectedCompletion = tabCompletions[completionIndex];
      const words = currentCommand.split(' ');

      if (words.length === 1) {
        // Completing a command
        setCurrentCommand(selectedCompletion + ' ');
      } else {
        // Completing a file/directory path
        words[words.length - 1] = selectedCompletion;
        setCurrentCommand(
          words.join(' ') + (selectedCompletion.endsWith('/') ? '' : ' ')
        );
      }

      setShowCompletions(false);
      setTabCompletions([]);
      setCompletionIndex(0);
    } else {
      // Get new completions
      const completions = await getTabCompletions(currentCommand);

      if (completions.length === 0) {
        // No completions available
        return;
      } else if (completions.length === 1) {
        // Single completion - apply it directly
        const words = currentCommand.split(' ');

        if (words.length === 1) {
          // Completing a command
          setCurrentCommand(completions[0] + ' ');
        } else {
          // Completing a file/directory path
          words[words.length - 1] = completions[0];
          setCurrentCommand(
            words.join(' ') + (completions[0].endsWith('/') ? '' : ' ')
          );
        }
      } else {
        // Multiple completions - show completion menu
        setTabCompletions(completions);
        setShowCompletions(true);
        setCompletionIndex(0);
      }
    }
  }, [
    currentCommand,
    showCompletions,
    tabCompletions,
    completionIndex,
    getTabCompletions,
  ]);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        setShowCompletions(false);
        setTabCompletions([]);
        handleCommand(currentCommand);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (showCompletions && tabCompletions.length > 0) {
          // Navigate through completions
          setCompletionIndex((prev) =>
            prev > 0 ? prev - 1 : tabCompletions.length - 1
          );
        } else if (commandHistory.length > 0) {
          // Navigate through command history
          const newIndex =
            historyIndex === -1
              ? commandHistory.length - 1
              : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCurrentCommand(commandHistory[newIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (showCompletions && tabCompletions.length > 0) {
          // Navigate through completions
          setCompletionIndex((prev) =>
            prev < tabCompletions.length - 1 ? prev + 1 : 0
          );
        } else if (historyIndex !== -1) {
          // Navigate through command history
          const newIndex = historyIndex + 1;
          if (newIndex >= localCommandHistory.length) {
            setHistoryIndex(-1);
            setCurrentCommand('');
          } else {
            setHistoryIndex(newIndex);
            setCurrentCommand(localCommandHistory[newIndex]);
          }
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        await handleTabCompletion();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowCompletions(false);
        setTabCompletions([]);
        setCompletionIndex(0);
      } else {
        // Hide completions when typing
        if (showCompletions) {
          setShowCompletions(false);
          setTabCompletions([]);
          setCompletionIndex(0);
        }
      }
    },
    [
      currentCommand,
      localCommandHistory,
      historyIndex,
      handleCommand,
      showCompletions,
      tabCompletions,
      completionIndex,
      handleTabCompletion,
    ]
  );

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-terminal-bg text-terminal-fg font-mono transition-all duration-300 ${
        isMobile ? 'p-2' : 'p-4'
      } ${isKeyboardOpen ? 'keyboard-open' : ''}`}
      role="application"
      aria-label="Interactive terminal portfolio interface"
    >
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      <div className={`mx-auto ${isMobile ? 'max-w-full' : 'max-w-4xl'}`}>
        {/* Terminal Header */}
        <header
          className={`flex items-center justify-between mb-4 pb-2 border-b border-terminal-border terminal-header ${
            isMobile ? 'flex-col space-y-2' : ''
          }`}
        >
          <div className="flex items-center space-x-2 w-full">
            <div
              className="flex space-x-1"
              role="group"
              aria-label="Window controls"
            >
              <button
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-pointer window-controls"
                aria-label="Close window (decorative)"
                tabIndex={-1}
              ></button>
              <button
                className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-pointer window-controls"
                aria-label="Minimize window (decorative)"
                tabIndex={-1}
              ></button>
              <button
                className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-pointer window-controls"
                aria-label="Maximize window (decorative)"
                tabIndex={-1}
              ></button>
            </div>
            <h1
              className={`text-terminal-fg/70 ml-3 ${isMobile ? 'text-xs' : 'text-sm'}`}
            >
              Andrew Garman - Portfolio Terminal
            </h1>

            {/* Mobile Navigation Toggle */}
            {isMobile && (
              <button
                onClick={() => setIsNavCollapsed(!isNavCollapsed)}
                className="ml-auto p-2 text-terminal-accent hover:bg-terminal-bg/50 rounded touch-target mobile-nav-toggle"
                aria-label={
                  isNavCollapsed
                    ? 'Open navigation menu'
                    : 'Close navigation menu'
                }
                aria-expanded={!isNavCollapsed}
                aria-controls="mobile-navigation"
              >
                <span className="text-sm" aria-hidden="true">
                  {isNavCollapsed ? '📁' : '✕'}
                </span>
              </button>
            )}
          </div>

          {!isMobile && (
            <div
              className="text-xs text-terminal-fg/50 font-mono"
              aria-label="Current time"
            >
              <time dateTime={new Date().toISOString()}>
                {new Date().toLocaleString()}
              </time>
            </div>
          )}
        </header>

        {/* Mobile Navigation Panel */}
        {isMobile && !isNavCollapsed && (
          <nav
            id="mobile-navigation"
            className="mb-4 bg-terminal-bg/50 border border-terminal-border rounded-lg mobile-nav-panel"
            aria-label="File system navigation"
          >
            <div className="p-3 border-b border-terminal-border">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono text-terminal-accent font-medium">
                  Navigation
                </h2>
                <button
                  onClick={() => setIsNavCollapsed(true)}
                  className="text-terminal-fg/60 hover:text-terminal-fg touch-target"
                  aria-label="Close navigation menu"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              <FileSystemRouter
                currentPath={currentDirectory}
                onNavigate={(path) => {
                  navigateToDirectory(path);
                  setIsNavCollapsed(true); // Auto-collapse after navigation
                  announce(`Navigated to ${path}`);
                }}
                className="border-0 bg-transparent"
              />
            </div>
          </nav>
        )}

        {/* Desktop Layout with Side Navigation */}
        {!isMobile ? (
          <div className="flex gap-6">
            {/* Main Terminal Area */}
            <main
              className="flex-1"
              role="main"
              aria-label="Terminal interface"
            >
              <TerminalContent />
            </main>

            {/* Side Navigation */}
            <aside
              className="w-80 flex-shrink-0"
              role="complementary"
              aria-label="File system navigation"
            >
              <FileSystemRouter
                currentPath={currentDirectory}
                onNavigate={(path) => {
                  navigateToDirectory(path);
                  announce(`Navigated to ${path}`);
                }}
              />
            </aside>
          </div>
        ) : (
          /* Mobile Layout - Full Width Terminal */
          <main role="main" aria-label="Terminal interface">
            <TerminalContent />
          </main>
        )}

        {/* Footer */}
        <footer
          className={`mt-8 pt-4 border-t border-terminal-border text-terminal-fg/50 text-center font-mono ${
            isMobile ? 'text-xs' : 'text-xs'
          }`}
        >
          <p>Built with Next.js 14 • TypeScript • Tailwind CSS</p>
          {!isMobile && (
            <p className="mt-1">
              Use ↑/↓ for command history • Tab for completion • Type
              &quot;help&quot; for commands
            </p>
          )}
          {isMobile && (
            <p className="mt-1">
              Tap 📁 for navigation • Type &quot;help&quot; for commands
            </p>
          )}
        </footer>
      </div>

      {/* Privacy Consent Component */}
      <PrivacyConsent />
    </div>
  );

  // Terminal Content Component (extracted for reuse)
  function TerminalContent() {
    return (
      <>
        {/* Terminal Output */}
        <section
          ref={outputRef}
          className={`terminal-output mb-4 overflow-y-auto space-y-1 ${
            isMobile
              ? isKeyboardOpen
                ? 'max-h-[30vh]'
                : 'max-h-[60vh]'
              : 'max-h-[70vh]'
          }`}
          role="log"
          aria-label="Terminal output"
          aria-live="polite"
          aria-atomic="false"
        >
          {showWelcome && (
            <div className="text-terminal-fg/70 animate-pulse" role="status">
              <span>Initializing terminal...</span>
            </div>
          )}

          {output.map((item) => (
            <div
              key={item.id}
              className={`font-mono transition-opacity duration-200 ${
                item.type === 'command'
                  ? 'text-terminal-prompt font-medium'
                  : item.type === 'error'
                    ? 'text-terminal-error'
                    : 'text-terminal-fg'
              }`}
              role={item.type === 'error' ? 'alert' : undefined}
              aria-label={
                item.type === 'command'
                  ? `Command: ${typeof item.content === 'string' ? item.content : 'Complex output'}`
                  : item.type === 'error'
                    ? `Error: ${typeof item.content === 'string' ? item.content : 'Error occurred'}`
                    : undefined
              }
            >
              {typeof item.content === 'string' ? (
                <pre className="whitespace-pre-wrap break-words">
                  {item.content}
                </pre>
              ) : (
                <div className="rendered-content">{item.content}</div>
              )}
            </div>
          ))}

          {isLoading && (
            <div
              className="text-terminal-fg/70 flex items-center space-x-2"
              role="status"
              aria-label="Processing command"
            >
              <div className="flex space-x-1" aria-hidden="true">
                <div className="w-1 h-1 bg-terminal-cursor rounded-full animate-bounce"></div>
                <div
                  className="w-1 h-1 bg-terminal-cursor rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-1 h-1 bg-terminal-cursor rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
              <span>Processing...</span>
            </div>
          )}
        </section>

        {/* Terminal Input */}
        <div
          className="flex items-center group"
          role="group"
          aria-label="Command input"
        >
          <label
            htmlFor="terminal-input"
            className={`text-terminal-prompt mr-2 font-medium font-mono select-none ${
              isMobile ? 'mobile-prompt text-xs' : ''
            }`}
          >
            {isMobile
              ? `${currentDirectory.split('/').pop() || '~'}$`
              : getPrompt()}
          </label>
          <div className="flex-1 relative">
            <input
              id="terminal-input"
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => isMobile && setIsKeyboardOpen(true)}
              onBlur={() => isMobile && setIsKeyboardOpen(false)}
              className={`terminal-input w-full bg-transparent border-none outline-none text-terminal-fg font-mono touch-highlight ${
                isMobile ? 'text-base' : ''
              }`}
              placeholder={
                isLoading
                  ? 'Processing...'
                  : isMobile
                    ? 'Command...'
                    : 'Type a command...'
              }
              disabled={isLoading}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              inputMode="text"
              aria-label="Terminal command input"
              aria-describedby="terminal-help"
              aria-expanded={showCompletions}
              aria-autocomplete="list"
              role="combobox"
              aria-owns={showCompletions ? 'completion-list' : undefined}
              aria-activedescendant={
                showCompletions ? `completion-${completionIndex}` : undefined
              }
            />
            <span
              className={`absolute top-0 bg-terminal-cursor w-2 h-5 inline-block transition-opacity ${
                isLoading ? 'opacity-30' : 'animate-blink'
              }`}
              style={{
                left: `${currentCommand.length * (isMobile ? 0.5 : 0.6)}em`,
                transform: 'translateY(1px)',
              }}
              aria-hidden="true"
            ></span>

            {/* Tab Completion Suggestions */}
            {showCompletions && tabCompletions.length > 0 && (
              <div
                id="completion-list"
                className={`absolute top-full left-0 mt-1 bg-terminal-bg border border-terminal-border rounded-md shadow-lg z-10 ${
                  isMobile ? 'max-w-full' : 'max-w-md'
                }`}
                role="listbox"
                aria-label="Tab completion suggestions"
              >
                <div className="p-2">
                  <div
                    className="text-xs text-terminal-fg/70 mb-2 font-mono"
                    id="completion-help"
                  >
                    Tab completions ({tabCompletions.length}):
                  </div>
                  <div
                    className={`overflow-y-auto ${isMobile ? 'max-h-24' : 'max-h-32'}`}
                  >
                    {tabCompletions.map((completion, index) => (
                      <div
                        key={completion}
                        id={`completion-${index}`}
                        className={`px-2 py-1 text-sm font-mono cursor-pointer rounded transition-colors touch-target ${
                          index === completionIndex
                            ? 'bg-terminal-cursor/20 text-terminal-cursor'
                            : 'text-terminal-fg hover:bg-terminal-fg/10'
                        }`}
                        onClick={() => {
                          setCompletionIndex(index);
                          handleTabCompletion();
                        }}
                        role="option"
                        aria-selected={index === completionIndex}
                        tabIndex={-1}
                      >
                        {completion}
                      </div>
                    ))}
                  </div>
                  <div
                    className="text-xs text-terminal-fg/50 mt-2 font-mono"
                    id="completion-instructions"
                  >
                    {isMobile
                      ? 'Tap to select'
                      : 'Use ↑/↓ to navigate, Tab/Enter to select, Esc to cancel'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden help text for screen readers */}
        <div id="terminal-help" className="sr-only">
          Terminal command interface. Type commands like ls, cd, cat, help. Use
          arrow keys for command history, tab for completion.
        </div>

        {/* Mobile Quick Commands */}
        {isMobile && (
          <div
            className="mt-3 flex flex-wrap gap-2"
            role="group"
            aria-label="Quick commands"
          >
            {['ls', 'cd ~', 'help', 'clear'].map((cmd) => (
              <button
                key={cmd}
                onClick={() => {
                  setCurrentCommand(cmd);
                  handleCommand(cmd);
                }}
                className="px-3 py-1 text-xs bg-terminal-border text-terminal-fg rounded hover:bg-terminal-cursor/20 transition-colors touch-target"
                disabled={isLoading}
                aria-label={`Execute ${cmd} command`}
              >
                {cmd}
              </button>
            ))}
          </div>
        )}
      </>
    );
  }
}
