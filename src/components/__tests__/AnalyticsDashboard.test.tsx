import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalyticsDashboard } from '../AnalyticsDashboard';
import { useAnalytics } from '../../hooks/useAnalytics';

// Mock the useAnalytics hook
jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

const mockUseAnalytics = useAnalytics as jest.MockedFunction<
  typeof useAnalytics
>;

const mockAnalyticsData = {
  getSummary: jest.fn(() => ({
    totalEvents: 25,
    eventsByType: {
      command_executed: 10,
      file_viewed: 8,
      directory_changed: 5,
      external_link_clicked: 2,
    },
    conversionEvents: 2,
    topCommands: [
      { command: 'ls', count: 5 },
      { command: 'cd', count: 3 },
      { command: 'cat', count: 2 },
    ],
    topFiles: [
      { file: '~/projects/web-apps/portfolio/README.md', count: 3 },
      { file: '~/artist/bio.md', count: 2 },
    ],
    sessionMetrics: {
      sessionDuration: 120000,
      commandsExecuted: 10,
      filesViewed: 8,
      directoriesExplored: 5,
      externalLinksClicked: 2,
      navigationDepth: 3,
      returnVisitor: true,
      uniqueCommands: ['ls', 'cd', 'cat', 'pwd'],
    },
  })),
  sessionMetrics: {
    sessionDuration: 120000,
    commandsExecuted: 10,
    filesViewed: 8,
    directoriesExplored: 5,
    externalLinksClicked: 2,
    navigationDepth: 3,
    returnVisitor: true,
    uniqueCommands: ['ls', 'cd', 'cat', 'pwd'],
  },
  hasConsent: true,
};

describe('AnalyticsDashboard', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAnalytics.mockReturnValue(mockAnalyticsData);
  });

  it('should not render when not visible', () => {
    const { container } = render(
      <AnalyticsDashboard isVisible={false} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should show consent message when analytics disabled', () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsData,
      hasConsent: false,
    });

    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    expect(
      screen.getByText(
        'Analytics are disabled. Enable analytics to view the dashboard.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
  });

  it('should render analytics data when consent is given', async () => {
    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    // Check session overview
    expect(screen.getByText('Session Overview')).toBeInTheDocument();
    expect(screen.getByText('2m 0s')).toBeInTheDocument(); // Duration formatting
    expect(screen.getByText('10')).toBeInTheDocument(); // Commands executed

    // Check event breakdown
    expect(screen.getByText('Event Breakdown')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument(); // Total events

    // Check top commands
    expect(screen.getByText('Top Commands')).toBeInTheDocument();
    expect(screen.getByText('ls')).toBeInTheDocument();
    expect(screen.getByText('cd')).toBeInTheDocument();
  });

  it('should handle close button click', async () => {
    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle refresh button click', async () => {
    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockAnalyticsData.getSummary).toHaveBeenCalled();
  });

  it('should format duration correctly', async () => {
    // Test different duration formats
    const testCases = [
      { duration: 30000, expected: '30s' },
      { duration: 90000, expected: '1m 30s' },
      { duration: 3661000, expected: '1h 1m 1s' },
    ];

    for (const testCase of testCases) {
      mockUseAnalytics.mockReturnValue({
        ...mockAnalyticsData,
        sessionMetrics: {
          ...mockAnalyticsData.sessionMetrics,
          sessionDuration: testCase.duration,
        },
        getSummary: jest.fn(() => ({
          ...mockAnalyticsData.getSummary(),
          sessionMetrics: {
            ...mockAnalyticsData.sessionMetrics,
            sessionDuration: testCase.duration,
          },
        })),
      });

      const { unmount } = render(
        <AnalyticsDashboard isVisible={true} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(screen.getByText(testCase.expected)).toBeInTheDocument();
      });

      unmount();
    }
  });

  it('should calculate engagement score correctly', async () => {
    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Engagement Score')).toBeInTheDocument();
    });

    // Score calculation: (10*5) + (8*10) + (5*3) + (2*15) + (4*8) = 50 + 80 + 15 + 30 + 32 = 207, capped at 100
    expect(screen.getByText('100/100')).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('should show return visitor status', async () => {
    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Return Visitor:')).toBeInTheDocument();
    });

    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('should handle empty data gracefully', async () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsData,
      getSummary: jest.fn(() => ({
        totalEvents: 0,
        eventsByType: {},
        conversionEvents: 0,
        topCommands: [],
        topFiles: [],
        sessionMetrics: {
          sessionDuration: 0,
          commandsExecuted: 0,
          filesViewed: 0,
          directoriesExplored: 0,
          externalLinksClicked: 0,
          navigationDepth: 0,
          returnVisitor: false,
          uniqueCommands: [],
        },
      })),
    });

    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('No commands executed yet')).toBeInTheDocument();
    });

    expect(screen.getByText('No files viewed yet')).toBeInTheDocument();
  });

  it('should show unique commands as badges', async () => {
    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Command Variety')).toBeInTheDocument();
    });

    expect(screen.getByText('4')).toBeInTheDocument(); // Unique commands count

    // Check that command badges are rendered
    const commandBadges = screen.getAllByText('ls');
    expect(commandBadges.length).toBeGreaterThan(0);
  });

  it('should auto-refresh data when visible', async () => {
    jest.useFakeTimers();

    render(<AnalyticsDashboard isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    // Clear initial calls
    mockAnalyticsData.getSummary.mockClear();

    // Fast-forward 5 seconds
    jest.advanceTimersByTime(5000);

    expect(mockAnalyticsData.getSummary).toHaveBeenCalled();

    jest.useRealTimers();
  });
});
