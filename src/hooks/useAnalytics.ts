import { useEffect, useCallback, useState } from 'react';
import {
  analyticsService,
  AnalyticsEvent,
  EngagementMetrics,
  ConversionEvent,
} from '../services/AnalyticsService';

export interface AnalyticsState {
  isEnabled: boolean;
  hasConsent: boolean;
  sessionMetrics: EngagementMetrics;
  isLoading: boolean;
}

export interface AnalyticsActions {
  enableAnalytics: () => void;
  disableAnalytics: () => void;
  trackCommand: (command: string, args?: string[], success?: boolean) => void;
  trackNavigation: (
    fromPath: string,
    toPath: string,
    method?: 'command' | 'click'
  ) => void;
  trackFileView: (
    filePath: string,
    fileType: string,
    viewDuration?: number
  ) => void;
  trackExternalLink: (url: string, source: string, projectId?: string) => void;
  trackConversion: (event: ConversionEvent) => void;
  getSummary: () => any;
  exportData: () => any;
  clearData: () => void;
}

/**
 * React hook for analytics integration
 */
export function useAnalytics(): AnalyticsState & AnalyticsActions {
  const [state, setState] = useState<AnalyticsState>({
    isEnabled: false,
    hasConsent: false,
    sessionMetrics: {
      sessionDuration: 0,
      commandsExecuted: 0,
      filesViewed: 0,
      directoriesExplored: 0,
      externalLinksClicked: 0,
      uniqueCommands: [],
      navigationDepth: 0,
      returnVisitor: false,
    },
    isLoading: true,
  });

  // Update metrics periodically
  const updateMetrics = useCallback(() => {
    const metrics = analyticsService.getSessionMetrics();
    setState((prev) => ({
      ...prev,
      sessionMetrics: metrics,
      hasConsent: analyticsService.hasConsent(),
      isLoading: false,
    }));
  }, []);

  // Initialize analytics
  useEffect(() => {
    const hasConsent = analyticsService.hasConsent();
    setState((prev) => ({
      ...prev,
      isEnabled: hasConsent,
      hasConsent,
      isLoading: false,
    }));

    // Update metrics initially and then periodically
    updateMetrics();
    const interval = setInterval(updateMetrics, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [updateMetrics]);

  // Actions
  const enableAnalytics = useCallback(() => {
    analyticsService.enable();
    analyticsService.initialize(true);
    setState((prev) => ({
      ...prev,
      isEnabled: true,
      hasConsent: true,
    }));
    updateMetrics();
  }, [updateMetrics]);

  const disableAnalytics = useCallback(() => {
    analyticsService.disable();
    setState((prev) => ({
      ...prev,
      isEnabled: false,
      hasConsent: false,
    }));
  }, []);

  const trackCommand = useCallback(
    (command: string, args: string[] = [], success: boolean = true) => {
      analyticsService.trackCommand(command, args, success);
      updateMetrics();
    },
    [updateMetrics]
  );

  const trackNavigation = useCallback(
    (
      fromPath: string,
      toPath: string,
      method: 'command' | 'click' = 'command'
    ) => {
      analyticsService.trackNavigation(fromPath, toPath, method);
      updateMetrics();
    },
    [updateMetrics]
  );

  const trackFileView = useCallback(
    (filePath: string, fileType: string, viewDuration?: number) => {
      analyticsService.trackFileView(filePath, fileType, viewDuration);
      updateMetrics();
    },
    [updateMetrics]
  );

  const trackExternalLink = useCallback(
    (url: string, source: string, projectId?: string) => {
      analyticsService.trackExternalLink(url, source, projectId);
      updateMetrics();
    },
    [updateMetrics]
  );

  const trackConversion = useCallback(
    (event: ConversionEvent) => {
      analyticsService.trackConversion(event);
      updateMetrics();
    },
    [updateMetrics]
  );

  const getSummary = useCallback(() => {
    return analyticsService.getAnalyticsSummary();
  }, []);

  const exportData = useCallback(() => {
    return analyticsService.exportData();
  }, []);

  const clearData = useCallback(() => {
    analyticsService.clearData();
    updateMetrics();
  }, [updateMetrics]);

  return {
    ...state,
    enableAnalytics,
    disableAnalytics,
    trackCommand,
    trackNavigation,
    trackFileView,
    trackExternalLink,
    trackConversion,
    getSummary,
    exportData,
    clearData,
  };
}

/**
 * Hook for tracking specific command usage patterns
 */
export function useCommandTracking() {
  const { trackCommand } = useAnalytics();

  const trackCommandWithContext = useCallback(
    (
      command: string,
      args: string[] = [],
      context: {
        currentPath?: string;
        success?: boolean;
        executionTime?: number;
        errorMessage?: string;
      } = {}
    ) => {
      trackCommand(command, args, context.success !== false);

      // Track additional context if analytics is enabled
      if (analyticsService.hasConsent()) {
        if (context.executionTime) {
          analyticsService.trackEngagement({
            sessionDuration: context.executionTime,
          });
        }
      }
    },
    [trackCommand]
  );

  return { trackCommandWithContext };
}

/**
 * Hook for tracking file interaction patterns
 */
export function useFileTracking() {
  const { trackFileView } = useAnalytics();
  const [viewStartTimes, setViewStartTimes] = useState<Map<string, number>>(
    new Map()
  );

  const startFileView = useCallback((filePath: string) => {
    setViewStartTimes((prev) => new Map(prev.set(filePath, Date.now())));
  }, []);

  const endFileView = useCallback(
    (filePath: string, fileType: string) => {
      const startTime = viewStartTimes.get(filePath);
      if (startTime) {
        const duration = Date.now() - startTime;
        trackFileView(filePath, fileType, duration);
        setViewStartTimes((prev) => {
          const newMap = new Map(prev);
          newMap.delete(filePath);
          return newMap;
        });
      }
    },
    [viewStartTimes, trackFileView]
  );

  return { startFileView, endFileView };
}

/**
 * Hook for tracking navigation patterns
 */
export function useNavigationTracking() {
  const { trackNavigation } = useAnalytics();
  const [currentPath, setCurrentPath] = useState<string>('~');

  const trackNavigationChange = useCallback(
    (newPath: string, method: 'command' | 'click' = 'command') => {
      if (newPath !== currentPath) {
        trackNavigation(currentPath, newPath, method);
        setCurrentPath(newPath);
      }
    },
    [currentPath, trackNavigation]
  );

  return { trackNavigationChange, currentPath };
}

/**
 * Hook for tracking conversion events
 */
export function useConversionTracking() {
  const { trackConversion, trackExternalLink } = useAnalytics();

  const trackProjectDemo = useCallback(
    (projectId: string, url: string) => {
      trackExternalLink(url, 'project_demo', projectId);
      trackConversion({
        type: 'project_demo_clicked',
        projectId,
        source: 'portfolio_terminal',
        timestamp: new Date(),
      });
    },
    [trackExternalLink, trackConversion]
  );

  const trackGitHubVisit = useCallback(
    (projectId: string, url: string) => {
      trackExternalLink(url, 'github_link', projectId);
      trackConversion({
        type: 'github_visited',
        projectId,
        source: 'portfolio_terminal',
        timestamp: new Date(),
      });
    },
    [trackExternalLink, trackConversion]
  );

  const trackContactView = useCallback(() => {
    trackConversion({
      type: 'contact_viewed',
      source: 'portfolio_terminal',
      timestamp: new Date(),
    });
  }, [trackConversion]);

  const trackCommissionInquiry = useCallback(
    (source: string = 'portfolio_terminal') => {
      trackConversion({
        type: 'commission_inquiry',
        source,
        timestamp: new Date(),
      });
    },
    [trackConversion]
  );

  return {
    trackProjectDemo,
    trackGitHubVisit,
    trackContactView,
    trackCommissionInquiry,
  };
}
