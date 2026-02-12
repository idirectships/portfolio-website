'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface TerminalRouterState {
  currentDirectory: string;
  commandHistory: string[];
}

/**
 * Hook for managing terminal navigation with browser history integration
 * Syncs terminal state with URL parameters and browser history
 */
export function useTerminalRouter(initialDirectory: string = '~') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial state from URL or defaults
  const getInitialState = useCallback((): TerminalRouterState => {
    const urlDirectory = searchParams.get('dir');
    const urlHistory = searchParams.get('history');

    return {
      currentDirectory: urlDirectory || initialDirectory,
      commandHistory: urlHistory
        ? JSON.parse(decodeURIComponent(urlHistory))
        : [],
    };
  }, [searchParams, initialDirectory]);

  const [routerState, setRouterState] =
    useState<TerminalRouterState>(getInitialState);

  // Update URL when terminal state changes
  const updateURL = useCallback(
    (newState: Partial<TerminalRouterState>) => {
      const updatedState = { ...routerState, ...newState };

      const params = new URLSearchParams();

      // Only add directory to URL if it's not the default
      if (
        updatedState.currentDirectory &&
        updatedState.currentDirectory !== '~'
      ) {
        params.set('dir', updatedState.currentDirectory);
      }

      // Only add history if it exists and has items
      if (updatedState.commandHistory.length > 0) {
        // Limit history in URL to last 10 commands to prevent URL bloat
        const limitedHistory = updatedState.commandHistory.slice(-10);
        params.set(
          'history',
          encodeURIComponent(JSON.stringify(limitedHistory))
        );
      }

      const queryString = params.toString();
      const newURL = queryString ? `${pathname}?${queryString}` : pathname;

      // Use replace to avoid creating too many history entries
      router.replace(newURL, { scroll: false });

      setRouterState(updatedState);
    },
    [router, pathname, routerState]
  );

  // Navigate to a directory and update URL
  const navigateToDirectory = useCallback(
    (directory: string) => {
      updateURL({ currentDirectory: directory });
    },
    [updateURL]
  );

  // Add command to history and update URL
  const addCommandToHistory = useCallback(
    (command: string) => {
      const newHistory = [...routerState.commandHistory, command];
      updateURL({ commandHistory: newHistory });
    },
    [routerState.commandHistory, updateURL]
  );

  // Clear command history
  const clearHistory = useCallback(() => {
    updateURL({ commandHistory: [] });
  }, [updateURL]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newState = getInitialState();
      setRouterState(newState);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getInitialState]);

  // Sync with URL changes (e.g., when user manually changes URL)
  useEffect(() => {
    const newState = getInitialState();
    if (
      newState.currentDirectory !== routerState.currentDirectory ||
      JSON.stringify(newState.commandHistory) !==
        JSON.stringify(routerState.commandHistory)
    ) {
      setRouterState(newState);
    }
  }, [searchParams, getInitialState, routerState]);

  return {
    currentDirectory: routerState.currentDirectory,
    commandHistory: routerState.commandHistory,
    navigateToDirectory,
    addCommandToHistory,
    clearHistory,
    updateURL,
  };
}

/**
 * Hook for generating shareable URLs for specific terminal states
 */
export function useTerminalShareURL() {
  const pathname = usePathname();

  const generateShareURL = useCallback(
    (directory: string, commands?: string[]): string => {
      const params = new URLSearchParams();

      if (directory && directory !== '~') {
        params.set('dir', directory);
      }

      if (commands && commands.length > 0) {
        params.set('history', encodeURIComponent(JSON.stringify(commands)));
      }

      const queryString = params.toString();
      const baseURL =
        typeof window !== 'undefined' ? window.location.origin : '';

      return queryString
        ? `${baseURL}${pathname}?${queryString}`
        : `${baseURL}${pathname}`;
    },
    [pathname]
  );

  const copyShareURL = useCallback(
    async (directory: string, commands?: string[]): Promise<boolean> => {
      try {
        const url = generateShareURL(directory, commands);
        await navigator.clipboard.writeText(url);
        return true;
      } catch {
        return false;
      }
    },
    [generateShareURL]
  );

  return {
    generateShareURL,
    copyShareURL,
  };
}

/**
 * Hook for managing terminal session persistence
 */
export function useTerminalSession() {
  const [sessionId] = useState(() => {
    // Generate a unique session ID
    return `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  });

  const saveSession = useCallback(
    (state: TerminalRouterState) => {
      if (typeof window === 'undefined') return;

      try {
        const sessionData = {
          ...state,
          timestamp: Date.now(),
          sessionId,
        };

        localStorage.setItem('terminal-session', JSON.stringify(sessionData));
      } catch {
        // Ignore localStorage errors
      }
    },
    [sessionId]
  );

  const loadSession = useCallback((): TerminalRouterState | null => {
    if (typeof window === 'undefined') return null;

    try {
      const saved = localStorage.getItem('terminal-session');
      if (!saved) return null;

      const sessionData = JSON.parse(saved);

      // Check if session is less than 24 hours old
      const isRecent = Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000;

      if (
        isRecent &&
        sessionData.currentDirectory &&
        sessionData.commandHistory
      ) {
        return {
          currentDirectory: sessionData.currentDirectory,
          commandHistory: sessionData.commandHistory,
        };
      }
    } catch {
      // Ignore errors and return null
    }

    return null;
  }, []);

  const clearSession = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('terminal-session');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    sessionId,
    saveSession,
    loadSession,
    clearSession,
  };
}
