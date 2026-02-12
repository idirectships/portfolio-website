import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacyConsent } from '../PrivacyConsent';
import { useAnalytics } from '../../hooks/useAnalytics';

// Mock the useAnalytics hook
jest.mock('../../hooks/useAnalytics', () => ({
  useAnalytics: jest.fn(),
}));

const mockUseAnalytics = useAnalytics as jest.MockedFunction<
  typeof useAnalytics
>;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(),
});

const mockAnalyticsHook = {
  hasConsent: false,
  enableAnalytics: jest.fn(),
  disableAnalytics: jest.fn(),
  getSummary: jest.fn(() => ({
    totalEvents: 10,
    sessionMetrics: {
      commandsExecuted: 5,
      filesViewed: 3,
    },
  })),
};

describe('PrivacyConsent', () => {
  const mockOnConsentChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAnalytics.mockReturnValue(mockAnalyticsHook);
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should show privacy button when banner is not visible', () => {
    mockLocalStorage.getItem.mockReturnValue('true'); // Consent already given

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    expect(screen.getByText('🔒 Privacy')).toBeInTheDocument();
  });

  it('should show consent banner when no consent given', () => {
    mockLocalStorage.getItem.mockReturnValue(null); // No consent given

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    expect(screen.getByText('Privacy-Friendly Analytics')).toBeInTheDocument();
    expect(
      screen.getByText(/This portfolio uses privacy-compliant analytics/)
    ).toBeInTheDocument();
  });

  it('should handle accept consent', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const acceptButton = screen.getByText('Accept');
    fireEvent.click(acceptButton);

    expect(mockAnalyticsHook.enableAnalytics).toHaveBeenCalled();
    expect(mockOnConsentChange).toHaveBeenCalledWith(true);
  });

  it('should handle decline consent', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const declineButton = screen.getByText('Decline');
    fireEvent.click(declineButton);

    expect(mockAnalyticsHook.disableAnalytics).toHaveBeenCalled();
    expect(mockOnConsentChange).toHaveBeenCalledWith(false);
  });

  it('should open privacy details modal', () => {
    mockLocalStorage.getItem.mockReturnValue('true');

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    expect(
      screen.getByText('Privacy & Analytics Settings')
    ).toBeInTheDocument();
    expect(screen.getByText('What We Track')).toBeInTheDocument();
    expect(screen.getByText("What We DON'T Track")).toBeInTheDocument();
  });

  it('should show current analytics status in details', () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsHook,
      hasConsent: true,
    });

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('Session events: 10')).toBeInTheDocument();
  });

  it('should toggle consent from details modal', () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsHook,
      hasConsent: true,
    });

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    const disableButton = screen.getByText('Disable Analytics');
    fireEvent.click(disableButton);

    expect(mockAnalyticsHook.disableAnalytics).toHaveBeenCalled();
    expect(mockOnConsentChange).toHaveBeenCalledWith(false);
  });

  it('should handle data export', () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsHook,
      hasConsent: true,
    });

    // Mock URL.createObjectURL and document.createElement
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    const mockClick = jest.fn();

    Object.defineProperty(URL, 'createObjectURL', {
      value: mockCreateObjectURL,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      value: mockRevokeObjectURL,
    });

    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick,
        } as any;
      }
      return document.createElement(tagName);
    });

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    const exportButton = screen.getByText('Export Data');
    fireEvent.click(exportButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it('should handle data clearing with confirmation', () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsHook,
      hasConsent: true,
    });

    (window.confirm as jest.Mock).mockReturnValue(true);

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    const clearButton = screen.getByText('Clear Data');
    fireEvent.click(clearButton);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete all analytics data?'
    );
    expect(mockAnalyticsHook.disableAnalytics).toHaveBeenCalled();
    expect(mockAnalyticsHook.enableAnalytics).toHaveBeenCalled();
  });

  it('should not clear data if user cancels confirmation', () => {
    mockUseAnalytics.mockReturnValue({
      ...mockAnalyticsHook,
      hasConsent: true,
    });

    (window.confirm as jest.Mock).mockReturnValue(false);

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    const clearButton = screen.getByText('Clear Data');
    fireEvent.click(clearButton);

    expect(mockAnalyticsHook.disableAnalytics).not.toHaveBeenCalled();
  });

  it('should close details modal', () => {
    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    expect(
      screen.getByText('Privacy & Analytics Settings')
    ).toBeInTheDocument();

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(
      screen.queryByText('Privacy & Analytics Settings')
    ).not.toBeInTheDocument();
  });

  it('should show learn more from banner', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const learnMoreButton = screen.getByText('Learn More');
    fireEvent.click(learnMoreButton);

    expect(
      screen.getByText('Privacy & Analytics Settings')
    ).toBeInTheDocument();
  });

  it('should show disabled status when no consent', () => {
    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('should show enable button when analytics disabled', () => {
    render(<PrivacyConsent onConsentChange={mockOnConsentChange} />);

    const privacyButton = screen.getByText('🔒 Privacy');
    fireEvent.click(privacyButton);

    const enableButton = screen.getByText('Enable Analytics');
    fireEvent.click(enableButton);

    expect(mockAnalyticsHook.enableAnalytics).toHaveBeenCalled();
    expect(mockOnConsentChange).toHaveBeenCalledWith(true);
  });
});
