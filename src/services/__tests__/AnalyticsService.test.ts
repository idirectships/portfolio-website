/**
 * Unit tests for AnalyticsService
 */

import { AnalyticsService } from '../AnalyticsService';

// Mock localStorage for testing
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage for testing
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);

    // Create new instance for each test
    analyticsService = new AnalyticsService();
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      expect(analyticsService.hasConsent()).toBe(false);

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.commandsExecuted).toBe(0);
      expect(metrics.filesViewed).toBe(0);
      expect(metrics.directoriesExplored).toBe(0);
      expect(metrics.externalLinksClicked).toBe(0);
      expect(metrics.uniqueCommands).toEqual([]);
      expect(metrics.navigationDepth).toBe(0);
    });

    it('should load existing consent from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'portfolio_analytics_consent') return 'true';
        return null;
      });

      const service = new AnalyticsService();
      expect(service.hasConsent()).toBe(true);
    });
  });

  describe('Consent Management', () => {
    it('should enable analytics when consent is given', () => {
      analyticsService.initialize(true);

      expect(analyticsService.hasConsent()).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'portfolio_analytics_consent',
        'true'
      );
    });

    it('should disable analytics when consent is revoked', () => {
      analyticsService.initialize(true);
      analyticsService.disable();

      expect(analyticsService.hasConsent()).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'portfolio_analytics_consent',
        'false'
      );
    });

    it('should not track events without consent', () => {
      analyticsService.trackCommand('ls', [], true);

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.commandsExecuted).toBe(0);
    });
  });

  describe('Command Tracking', () => {
    beforeEach(() => {
      analyticsService.initialize(true);
    });

    it('should track command execution', () => {
      analyticsService.trackCommand('ls', ['artist'], true);

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.commandsExecuted).toBe(1);
      expect(metrics.uniqueCommands).toContain('ls');
    });

    it('should track multiple different commands', () => {
      analyticsService.trackCommand('ls', [], true);
      analyticsService.trackCommand('cd', ['artist'], true);
      analyticsService.trackCommand('cat', ['bio.md'], true);

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.commandsExecuted).toBe(3);
      expect(metrics.uniqueCommands).toEqual(['ls', 'cd', 'cat']);
    });

    it('should track repeated commands correctly', () => {
      analyticsService.trackCommand('ls', [], true);
      analyticsService.trackCommand('ls', ['artist'], true);

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.commandsExecuted).toBe(2);
      expect(metrics.uniqueCommands).toEqual(['ls']);
    });
  });

  describe('Navigation Tracking', () => {
    beforeEach(() => {
      analyticsService.initialize(true);
    });

    it('should track navigation between directories', () => {
      analyticsService.trackNavigation('~', '~/artist', 'command');

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.directoriesExplored).toBe(1);
      expect(metrics.navigationDepth).toBe(1);
    });

    it('should track navigation depth correctly', () => {
      analyticsService.trackNavigation('~', '~/artist', 'command');
      analyticsService.trackNavigation(
        '~/artist',
        '~/artist/influences',
        'command'
      );

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.directoriesExplored).toBe(2);
      expect(metrics.navigationDepth).toBe(2);
    });
  });

  describe('File Tracking', () => {
    beforeEach(() => {
      analyticsService.initialize(true);
    });

    it('should track file views', () => {
      analyticsService.trackFileView('~/artist/bio.md', 'markdown', 5000);

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.filesViewed).toBe(1);
    });

    it('should track multiple file views', () => {
      analyticsService.trackFileView('~/artist/bio.md', 'markdown', 5000);
      analyticsService.trackFileView(
        '~/studio/toolbox/languages.json',
        'json',
        3000
      );

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.filesViewed).toBe(2);
    });
  });

  describe('External Link Tracking', () => {
    beforeEach(() => {
      analyticsService.initialize(true);
    });

    it('should track external link clicks', () => {
      analyticsService.trackExternalLink(
        'https://github.com/drugarman/portfolio',
        'project_demo',
        'portfolio-terminal'
      );

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.externalLinksClicked).toBe(1);
    });

    it('should track multiple external links', () => {
      analyticsService.trackExternalLink(
        'https://github.com/example1',
        'github',
        'project1'
      );
      analyticsService.trackExternalLink(
        'https://demo.example.com',
        'demo',
        'project2'
      );

      const metrics = analyticsService.getSessionMetrics();
      expect(metrics.externalLinksClicked).toBe(2);
    });
  });

  describe('Conversion Tracking', () => {
    beforeEach(() => {
      analyticsService.initialize(true);
    });

    it('should track conversion events', () => {
      analyticsService.trackConversion({
        type: 'project_demo_clicked',
        projectId: 'portfolio-terminal',
        source: 'terminal',
        timestamp: new Date(),
      });

      const summary = analyticsService.getAnalyticsSummary();
      expect(summary.conversionEvents).toBe(1);
    });
  });

  describe('Analytics Summary', () => {
    beforeEach(() => {
      analyticsService.initialize(true);
    });

    it('should provide comprehensive analytics summary', () => {
      // Generate some test data
      analyticsService.trackCommand('ls', [], true);
      analyticsService.trackCommand('cd', ['artist'], true);
      analyticsService.trackFileView('~/artist/bio.md', 'markdown', 5000);
      analyticsService.trackNavigation('~', '~/artist', 'command');
      analyticsService.trackExternalLink(
        'https://github.com/example',
        'github',
        'project'
      );
      analyticsService.trackConversion({
        type: 'github_visited',
        projectId: 'project',
        source: 'terminal',
        timestamp: new Date(),
      });

      const summary = analyticsService.getAnalyticsSummary();

      expect(summary.totalEvents).toBeGreaterThan(0);
      expect(summary.eventsByType.command_executed).toBe(2);
      expect(summary.eventsByType.file_viewed).toBe(1);
      expect(summary.eventsByType.navigation).toBe(1);
      expect(summary.eventsByType.external_link).toBe(1);
      expect(summary.eventsByType.conversion).toBe(1);
      expect(summary.conversionEvents).toBe(1);
      expect(summary.topCommands).toEqual([
        { command: 'ls', count: 1 },
        { command: 'cd', count: 1 },
      ]);
      expect(summary.sessionMetrics.commandsExecuted).toBe(2);
      expect(summary.sessionMetrics.filesViewed).toBe(1);
      expect(summary.sessionMetrics.directoriesExplored).toBe(1);
      expect(summary.sessionMetrics.externalLinksClicked).toBe(1);
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      analyticsService.initialize(true);
    });

    it('should export analytics data with privacy compliance', () => {
      analyticsService.trackCommand('ls', [], true);

      const exportData = analyticsService.exportData();

      expect(exportData.privacy.consentGiven).toBe(true);
      expect(exportData.privacy.personalDataCollected).toBe(false);
      expect(exportData.privacy.dataRetentionDays).toBe(30);
      expect(exportData.events.length).toBeGreaterThan(0);
      expect(exportData.summary).toBeDefined();
    });
  });

  describe('Data Clearing', () => {
    beforeEach(() => {
      analyticsService.initialize(true);
    });

    it('should clear all analytics data', () => {
      analyticsService.trackCommand('ls', [], true);

      let metrics = analyticsService.getSessionMetrics();
      expect(metrics.commandsExecuted).toBe(1);

      analyticsService.clearData();

      metrics = analyticsService.getSessionMetrics();
      expect(metrics.commandsExecuted).toBe(0);
    });
  });

  describe('Privacy Compliance', () => {
    it('should not persist data without consent', () => {
      analyticsService.trackCommand('ls', [], true);

      // Should not call localStorage.setItem for events without consent
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith(
        expect.stringContaining('portfolio_events'),
        expect.any(String)
      );
    });

    it('should sanitize metadata in exports', () => {
      analyticsService.initialize(true);

      // Track event with potentially sensitive metadata
      analyticsService.trackCommand('ls', [], true);

      const exportData = analyticsService.exportData();

      // Verify that exported events have sanitized metadata
      exportData.events.forEach((event) => {
        if (event.metadata) {
          // Should only contain safe, non-personal data
          Object.values(event.metadata).forEach((value) => {
            if (typeof value === 'string') {
              expect(value.length).toBeLessThan(100);
            }
          });
        }
      });
    });
  });
});
