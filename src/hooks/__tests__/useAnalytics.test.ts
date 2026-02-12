import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '../useAnalytics';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should initialize with no consent by default', () => {
    const { result } = renderHook(() => useAnalytics());

    expect(result.current.hasConsent).toBe(false);
  });

  it('should initialize with consent if previously given', () => {
    mockLocalStorage.getItem.mockReturnValue('true');

    const { result } = renderHook(() => useAnalytics());

    expect(result.current.hasConsent).toBe(true);
  });

  it('should enable analytics and set consent', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.enableAnalytics();
    });

    expect(result.current.hasConsent).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'portfolio_analytics_consent',
      'true'
    );
  });

  it('should disable analytics and remove consent', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.disableAnalytics();
    });

    expect(result.current.hasConsent).toBe(false);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
      'portfolio_analytics_consent'
    );
  });

  it('should track events when consent is given', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackEvent('command_executed', { command: 'ls' });
    });

    // Should not throw error and should update session metrics
    expect(result.current.sessionMetrics.commandsExecuted).toBeGreaterThan(0);
  });

  it('should not track events when consent is not given', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackEvent('command_executed', { command: 'ls' });
    });

    // Should not update session metrics
    expect(result.current.sessionMetrics.commandsExecuted).toBe(0);
  });

  it('should track command execution', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackCommand('ls');
    });

    expect(result.current.sessionMetrics.commandsExecuted).toBe(1);
    expect(result.current.sessionMetrics.uniqueCommands).toContain('ls');
  });

  it('should track file views', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackFileView('~/README.md');
    });

    expect(result.current.sessionMetrics.filesViewed).toBe(1);
  });

  it('should track directory navigation', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackNavigation('~/projects');
    });

    expect(result.current.sessionMetrics.directoriesExplored).toBe(1);
  });

  it('should track external link clicks', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackExternalLink('https://github.com/user/repo');
    });

    expect(result.current.sessionMetrics.externalLinksClicked).toBe(1);
  });

  it('should update navigation depth', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackNavigation('~/projects/web-apps/portfolio');
    });

    expect(result.current.sessionMetrics.navigationDepth).toBeGreaterThan(0);
  });

  it('should detect return visitors', () => {
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'portfolio_analytics_consent') return 'true';
      if (key === 'portfolio_analytics_data')
        return JSON.stringify({
          events: [{ type: 'page_view', timestamp: Date.now() - 86400000 }], // 1 day ago
        });
      return null;
    });

    const { result } = renderHook(() => useAnalytics());

    expect(result.current.sessionMetrics.returnVisitor).toBe(true);
  });

  it('should generate analytics summary', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackCommand('ls');
      result.current.trackCommand('cd');
      result.current.trackFileView('~/README.md');
    });

    const summary = result.current.getSummary();

    expect(summary.totalEvents).toBeGreaterThan(0);
    expect(summary.topCommands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ command: 'ls', count: 1 }),
        expect.objectContaining({ command: 'cd', count: 1 }),
      ])
    );
    expect(summary.sessionMetrics).toBeDefined();
  });

  it('should handle localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useAnalytics());

    // Should not crash and should default to no consent
    expect(result.current.hasConsent).toBe(false);
  });

  it('should clean up old data', () => {
    const oldData = {
      events: [
        { type: 'page_view', timestamp: Date.now() - 31 * 24 * 60 * 60 * 1000 }, // 31 days ago
        { type: 'command_executed', timestamp: Date.now() - 1000 }, // 1 second ago
      ],
    };

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'portfolio_analytics_consent') return 'true';
      if (key === 'portfolio_analytics_data') return JSON.stringify(oldData);
      return null;
    });

    const { result } = renderHook(() => useAnalytics());

    const summary = result.current.getSummary();

    // Should only include recent events
    expect(summary.totalEvents).toBe(1);
  });

  it('should track unique commands correctly', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackCommand('ls');
      result.current.trackCommand('ls'); // Duplicate
      result.current.trackCommand('cd');
    });

    expect(result.current.sessionMetrics.uniqueCommands).toEqual(['ls', 'cd']);
    expect(result.current.sessionMetrics.commandsExecuted).toBe(3);
  });

  it('should calculate session duration', () => {
    mockLocalStorage.getItem.mockReturnValue('true');
    const { result } = renderHook(() => useAnalytics());

    // Session duration should be calculated from when analytics started
    expect(
      result.current.sessionMetrics.sessionDuration
    ).toBeGreaterThanOrEqual(0);
  });
});
