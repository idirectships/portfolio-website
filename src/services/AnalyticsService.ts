/**
 * Privacy-compliant analytics service for tracking user interactions
 * and portfolio engagement without collecting personal data
 */

export interface AnalyticsEvent {
  type:
    | 'command_executed'
    | 'navigation'
    | 'file_viewed'
    | 'external_link'
    | 'conversion'
    | 'engagement';
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: Date;
  sessionId: string;
  metadata?: Record<string, any>;
}

export interface EngagementMetrics {
  sessionDuration: number;
  commandsExecuted: number;
  filesViewed: number;
  directoriesExplored: number;
  externalLinksClicked: number;
  uniqueCommands: string[];
  navigationDepth: number;
  returnVisitor: boolean;
}

export interface ConversionEvent {
  type:
    | 'contact_viewed'
    | 'project_demo_clicked'
    | 'github_visited'
    | 'resume_downloaded'
    | 'commission_inquiry';
  projectId?: string;
  source: string;
  timestamp: Date;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private sessionStart: Date;
  private isEnabled: boolean = true;
  private privacyConsent: boolean = false;

  // Privacy-compliant storage (no cookies, local storage only)
  private readonly STORAGE_KEY = 'portfolio_analytics_consent';
  private readonly SESSION_KEY = 'portfolio_session_id';
  private readonly EVENTS_KEY = 'portfolio_events';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStart = new Date();
    this.loadPrivacySettings();
    this.setupEventListeners();
  }

  /**
   * Initialize analytics with privacy consent
   */
  initialize(consent: boolean = false): void {
    this.privacyConsent = consent;
    this.savePrivacySettings();

    if (consent) {
      this.trackEvent({
        type: 'engagement',
        category: 'session',
        action: 'start',
        label: 'analytics_enabled',
        timestamp: new Date(),
        sessionId: this.sessionId,
      });
    }
  }

  /**
   * Track command execution in terminal
   */
  trackCommand(
    command: string,
    args: string[] = [],
    success: boolean = true
  ): void {
    if (!this.isEnabled || !this.privacyConsent) return;

    this.trackEvent({
      type: 'command_executed',
      category: 'terminal',
      action: command,
      label: args.join(' '),
      value: success ? 1 : 0,
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        args,
        success,
        argsCount: args.length,
      },
    });
  }

  /**
   * Track navigation between directories
   */
  trackNavigation(
    fromPath: string,
    toPath: string,
    method: 'command' | 'click' = 'command'
  ): void {
    if (!this.isEnabled || !this.privacyConsent) return;

    const depth = toPath.split('/').filter((p) => p && p !== '~').length;

    this.trackEvent({
      type: 'navigation',
      category: 'filesystem',
      action: 'directory_change',
      label: `${fromPath} -> ${toPath}`,
      value: depth,
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        fromPath,
        toPath,
        method,
        depth,
      },
    });
  }

  /**
   * Track file viewing
   */
  trackFileView(
    filePath: string,
    fileType: string,
    viewDuration?: number
  ): void {
    if (!this.isEnabled || !this.privacyConsent) return;

    this.trackEvent({
      type: 'file_viewed',
      category: 'content',
      action: 'file_view',
      label: filePath,
      value: viewDuration,
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        fileType,
        viewDuration,
        pathDepth: filePath.split('/').length,
      },
    });
  }

  /**
   * Track external link clicks
   */
  trackExternalLink(url: string, source: string, projectId?: string): void {
    if (!this.isEnabled || !this.privacyConsent) return;

    this.trackEvent({
      type: 'external_link',
      category: 'outbound',
      action: 'link_click',
      label: url,
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: {
        source,
        projectId,
        domain: this.extractDomain(url),
      },
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(event: ConversionEvent): void {
    if (!this.isEnabled || !this.privacyConsent) return;

    this.trackEvent({
      type: 'conversion',
      category: 'conversion',
      action: event.type,
      label: event.projectId || event.source,
      timestamp: event.timestamp,
      sessionId: this.sessionId,
      metadata: {
        projectId: event.projectId,
        source: event.source,
      },
    });
  }

  /**
   * Track engagement metrics
   */
  trackEngagement(metrics: Partial<EngagementMetrics>): void {
    if (!this.isEnabled || !this.privacyConsent) return;

    this.trackEvent({
      type: 'engagement',
      category: 'session',
      action: 'engagement_update',
      value: metrics.sessionDuration,
      timestamp: new Date(),
      sessionId: this.sessionId,
      metadata: metrics,
    });
  }

  /**
   * Get current session metrics
   */
  getSessionMetrics(): EngagementMetrics {
    const sessionEvents = this.events.filter(
      (e) => e.sessionId === this.sessionId
    );
    const commandEvents = sessionEvents.filter(
      (e) => e.type === 'command_executed'
    );
    const navigationEvents = sessionEvents.filter(
      (e) => e.type === 'navigation'
    );
    const fileEvents = sessionEvents.filter((e) => e.type === 'file_viewed');
    const linkEvents = sessionEvents.filter((e) => e.type === 'external_link');

    const uniqueCommands = [...new Set(commandEvents.map((e) => e.action))];
    const maxDepth = Math.max(0, ...navigationEvents.map((e) => e.value || 0));
    const sessionDuration = Date.now() - this.sessionStart.getTime();

    return {
      sessionDuration,
      commandsExecuted: commandEvents.length,
      filesViewed: fileEvents.length,
      directoriesExplored: navigationEvents.length,
      externalLinksClicked: linkEvents.length,
      uniqueCommands,
      navigationDepth: maxDepth,
      returnVisitor: this.isReturnVisitor(),
    };
  }

  /**
   * Get analytics summary for the current session
   */
  getAnalyticsSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    topCommands: Array<{ command: string; count: number }>;
    topFiles: Array<{ file: string; count: number }>;
    conversionEvents: number;
    sessionMetrics: EngagementMetrics;
  } {
    const sessionEvents = this.events.filter(
      (e) => e.sessionId === this.sessionId
    );

    // Count events by type
    const eventsByType = sessionEvents.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Top commands
    const commandCounts = sessionEvents
      .filter((e) => e.type === 'command_executed')
      .reduce(
        (acc, event) => {
          acc[event.action] = (acc[event.action] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const topCommands = Object.entries(commandCounts)
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top files
    const fileCounts = sessionEvents
      .filter((e) => e.type === 'file_viewed')
      .reduce(
        (acc, event) => {
          acc[event.label || 'unknown'] =
            (acc[event.label || 'unknown'] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

    const topFiles = Object.entries(fileCounts)
      .map(([file, count]) => ({ file, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const conversionEvents = sessionEvents.filter(
      (e) => e.type === 'conversion'
    ).length;

    return {
      totalEvents: sessionEvents.length,
      eventsByType,
      topCommands,
      topFiles,
      conversionEvents,
      sessionMetrics: this.getSessionMetrics(),
    };
  }

  /**
   * Export analytics data (privacy-compliant)
   */
  exportData(): {
    events: AnalyticsEvent[];
    summary: any;
    privacy: {
      consentGiven: boolean;
      dataRetentionDays: number;
      personalDataCollected: boolean;
    };
  } {
    return {
      events: this.events.map((event) => ({
        ...event,
        // Remove any potentially identifying metadata
        metadata: event.metadata
          ? this.sanitizeMetadata(event.metadata)
          : undefined,
      })),
      summary: this.getAnalyticsSummary(),
      privacy: {
        consentGiven: this.privacyConsent,
        dataRetentionDays: 30,
        personalDataCollected: false,
      },
    };
  }

  /**
   * Clear all analytics data
   */
  clearData(): void {
    this.events = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.EVENTS_KEY);
    }
  }

  /**
   * Disable analytics
   */
  disable(): void {
    this.isEnabled = false;
    this.privacyConsent = false;
    this.savePrivacySettings();
  }

  /**
   * Enable analytics with consent
   */
  enable(): void {
    this.isEnabled = true;
    this.privacyConsent = true;
    this.savePrivacySettings();
  }

  /**
   * Check if user has given consent
   */
  hasConsent(): boolean {
    return this.privacyConsent;
  }

  /**
   * Private methods
   */
  private trackEvent(event: AnalyticsEvent): void {
    this.events.push(event);
    this.persistEvents();

    // Limit stored events to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private isReturnVisitor(): boolean {
    if (typeof window === 'undefined') return false;

    const lastVisit = localStorage.getItem('portfolio_last_visit');
    const now = Date.now();

    if (lastVisit) {
      const daysSinceLastVisit =
        (now - parseInt(lastVisit)) / (1000 * 60 * 60 * 24);
      return daysSinceLastVisit > 1; // Return visitor if last visit was more than 1 day ago
    }

    localStorage.setItem('portfolio_last_visit', now.toString());
    return false;
  }

  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(metadata)) {
      // Only include non-sensitive metadata
      if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (typeof value === 'string' && value.length < 100) {
        // Only include short strings that are unlikely to contain personal data
        sanitized[key] = value;
      } else if (
        Array.isArray(value) &&
        value.every((v) => typeof v === 'string' && v.length < 50)
      ) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private loadPrivacySettings(): void {
    if (typeof window === 'undefined') return;

    const consent = localStorage.getItem(this.STORAGE_KEY);
    this.privacyConsent = consent === 'true';

    // Load existing session ID if available
    const existingSessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (existingSessionId) {
      this.sessionId = existingSessionId;
    } else {
      sessionStorage.setItem(this.SESSION_KEY, this.sessionId);
    }

    // Load persisted events
    this.loadPersistedEvents();
  }

  private savePrivacySettings(): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.STORAGE_KEY, this.privacyConsent.toString());
  }

  private persistEvents(): void {
    if (typeof window === 'undefined' || !this.privacyConsent) return;

    // Only persist recent events (last 100)
    const recentEvents = this.events.slice(-100);
    localStorage.setItem(this.EVENTS_KEY, JSON.stringify(recentEvents));
  }

  private loadPersistedEvents(): void {
    if (typeof window === 'undefined' || !this.privacyConsent) return;

    try {
      const stored = localStorage.getItem(this.EVENTS_KEY);
      if (stored) {
        const events = JSON.parse(stored) as AnalyticsEvent[];
        // Only load events from the last 24 hours
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.events = events.filter(
          (e) => new Date(e.timestamp).getTime() > oneDayAgo
        );
      }
    } catch (error) {
      console.warn('Failed to load persisted analytics events:', error);
    }
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Track page visibility changes for engagement
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEngagement(this.getSessionMetrics());
      }
    });

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.trackEngagement(this.getSessionMetrics());
    });

    // Track focus/blur for engagement
    let focusStart = Date.now();

    window.addEventListener('focus', () => {
      focusStart = Date.now();
    });

    window.addEventListener('blur', () => {
      const focusDuration = Date.now() - focusStart;
      if (focusDuration > 5000) {
        // Only track if focused for more than 5 seconds
        this.trackEvent({
          type: 'engagement',
          category: 'session',
          action: 'focus_duration',
          value: focusDuration,
          timestamp: new Date(),
          sessionId: this.sessionId,
        });
      }
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
