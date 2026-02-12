'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

interface PrivacyConsentProps {
  onConsentChange?: (hasConsent: boolean) => void;
}

export function PrivacyConsent({ onConsentChange }: PrivacyConsentProps) {
  const { hasConsent, enableAnalytics, disableAnalytics, getSummary } =
    useAnalytics();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Show banner if consent hasn't been given yet
    const consentGiven = localStorage.getItem('portfolio_analytics_consent');
    if (consentGiven === null) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    enableAnalytics();
    setShowBanner(false);
    onConsentChange?.(true);
  };

  const handleDecline = () => {
    disableAnalytics();
    setShowBanner(false);
    onConsentChange?.(false);
  };

  const handleToggleConsent = () => {
    if (hasConsent) {
      disableAnalytics();
      onConsentChange?.(false);
    } else {
      enableAnalytics();
      onConsentChange?.(true);
    }
  };

  if (!showBanner && !showDetails) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDetails(true)}
          className="bg-gray-800 text-green-400 px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors border border-gray-600"
          title="Privacy Settings"
        >
          🔒 Privacy
        </button>
      </div>
    );
  }

  if (showDetails) {
    const summary = getSummary();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-600 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-400">
                Privacy & Analytics Settings
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Current Status
                </h3>
                <div className="bg-gray-800 p-3 rounded">
                  <p className="mb-2">
                    <span className="text-gray-400">Analytics:</span>{' '}
                    <span
                      className={hasConsent ? 'text-green-400' : 'text-red-400'}
                    >
                      {hasConsent ? 'Enabled' : 'Disabled'}
                    </span>
                  </p>
                  {hasConsent && (
                    <div className="text-sm text-gray-400">
                      <p>Session events: {summary.totalEvents}</p>
                      <p>
                        Commands executed:{' '}
                        {summary.sessionMetrics.commandsExecuted}
                      </p>
                      <p>Files viewed: {summary.sessionMetrics.filesViewed}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  What We Track
                </h3>
                <div className="bg-gray-800 p-3 rounded text-sm">
                  <ul className="space-y-1">
                    <li>• Terminal commands you execute (ls, cd, cat, etc.)</li>
                    <li>• Files and directories you explore</li>
                    <li>• External links you click (project demos, GitHub)</li>
                    <li>• Time spent in different sections</li>
                    <li>• Navigation patterns within the portfolio</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  What We DON'T Track
                </h3>
                <div className="bg-gray-800 p-3 rounded text-sm">
                  <ul className="space-y-1">
                    <li>• Personal information or identity</li>
                    <li>• IP addresses or location data</li>
                    <li>• Cookies or cross-site tracking</li>
                    <li>• Keyboard input or typed content</li>
                    <li>• Data shared with third parties</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  Privacy Principles
                </h3>
                <div className="bg-gray-800 p-3 rounded text-sm">
                  <ul className="space-y-1">
                    <li>
                      • All data stays in your browser (localStorage only)
                    </li>
                    <li>• No server-side tracking or data collection</li>
                    <li>• Data is automatically deleted after 30 days</li>
                    <li>• You can export or delete your data anytime</li>
                    <li>• Analytics help improve the portfolio experience</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleToggleConsent}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    hasConsent
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {hasConsent ? 'Disable Analytics' : 'Enable Analytics'}
                </button>

                {hasConsent && (
                  <>
                    <button
                      onClick={() => {
                        const data = getSummary();
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'portfolio-analytics-data.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-4 py-2 rounded font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      Export Data
                    </button>

                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Are you sure you want to delete all analytics data?'
                          )
                        ) {
                          // Clear data through analytics hook
                          disableAnalytics();
                          enableAnalytics();
                        }
                      }}
                      className="px-4 py-2 rounded font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                    >
                      Clear Data
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-600 p-4 z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-400 mb-2">
              Privacy-Friendly Analytics
            </h3>
            <p className="text-gray-300 text-sm">
              This portfolio uses privacy-compliant analytics to understand how
              visitors interact with the terminal interface. No personal data is
              collected, and all data stays in your browser.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 min-w-fit">
            <button
              onClick={() => setShowDetails(true)}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Learn More
            </button>
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
