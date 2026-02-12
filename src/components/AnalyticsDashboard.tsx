'use client';

import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

interface AnalyticsDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AnalyticsDashboard({
  isVisible,
  onClose,
}: AnalyticsDashboardProps) {
  const { getSummary, sessionMetrics, hasConsent } = useAnalytics();
  const [summary, setSummary] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    if (isVisible && hasConsent) {
      // Initial load
      setSummary(getSummary());

      // Set up auto-refresh
      const interval = setInterval(() => {
        setSummary(getSummary());
      }, 5000);

      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isVisible, hasConsent, getSummary]);

  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [refreshInterval]);

  if (!isVisible) return null;

  if (!hasConsent) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-green-400 mb-4">
            Analytics Dashboard
          </h2>
          <p className="text-gray-300 mb-4">
            Analytics are disabled. Enable analytics to view the dashboard.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-6">
          <div className="text-green-400">Loading analytics data...</div>
        </div>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-green-400">
              Analytics Dashboard
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Session Overview */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                Session Overview
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">
                    {formatDuration(sessionMetrics.sessionDuration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Commands:</span>
                  <span className="text-white">
                    {sessionMetrics.commandsExecuted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Files Viewed:</span>
                  <span className="text-white">
                    {sessionMetrics.filesViewed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Directories:</span>
                  <span className="text-white">
                    {sessionMetrics.directoriesExplored}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">External Links:</span>
                  <span className="text-white">
                    {sessionMetrics.externalLinksClicked}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Depth:</span>
                  <span className="text-white">
                    {sessionMetrics.navigationDepth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Return Visitor:</span>
                  <span
                    className={
                      sessionMetrics.returnVisitor
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {sessionMetrics.returnVisitor ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Breakdown */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                Event Breakdown
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Events:</span>
                  <span className="text-white">{summary.totalEvents}</span>
                </div>
                {Object.entries(summary.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-gray-400 capitalize">
                      {type.replace('_', ' ')}:
                    </span>
                    <span className="text-white">{count as number}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-gray-600 pt-2 mt-2">
                  <span className="text-gray-400">Conversions:</span>
                  <span className="text-green-400 font-semibold">
                    {summary.conversionEvents}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Commands */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                Top Commands
              </h3>
              <div className="space-y-2 text-sm">
                {summary.topCommands.length > 0 ? (
                  summary.topCommands.map((cmd: any, index: number) => (
                    <div key={cmd.command} className="flex justify-between">
                      <span className="text-gray-400">
                        {index + 1}.{' '}
                        <code className="text-green-300">{cmd.command}</code>
                      </span>
                      <span className="text-white">{cmd.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">
                    No commands executed yet
                  </div>
                )}
              </div>
            </div>

            {/* Top Files */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                Most Viewed Files
              </h3>
              <div className="space-y-2 text-sm">
                {summary.topFiles.length > 0 ? (
                  summary.topFiles.map((file: any, index: number) => (
                    <div key={file.file} className="flex justify-between">
                      <span className="text-gray-400 truncate">
                        {index + 1}. {file.file.split('/').pop()}
                      </span>
                      <span className="text-white">{file.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic">
                    No files viewed yet
                  </div>
                )}
              </div>
            </div>

            {/* Unique Commands */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                Command Variety
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Unique Commands:</span>
                  <span className="text-white">
                    {sessionMetrics.uniqueCommands.length}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-gray-400 mb-1">Commands Used:</div>
                  <div className="flex flex-wrap gap-1">
                    {sessionMetrics.uniqueCommands.map((cmd) => (
                      <span
                        key={cmd}
                        className="px-2 py-1 bg-gray-700 text-green-300 text-xs rounded"
                      >
                        {cmd}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Score */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-400 mb-3">
                Engagement Score
              </h3>
              <div className="space-y-2 text-sm">
                {(() => {
                  const score = Math.min(
                    100,
                    sessionMetrics.commandsExecuted * 5 +
                      sessionMetrics.filesViewed * 10 +
                      sessionMetrics.directoriesExplored * 3 +
                      sessionMetrics.externalLinksClicked * 15 +
                      sessionMetrics.uniqueCommands.length * 8
                  );

                  const level =
                    score >= 80
                      ? 'Expert'
                      : score >= 60
                        ? 'Advanced'
                        : score >= 40
                          ? 'Intermediate'
                          : score >= 20
                            ? 'Beginner'
                            : 'New';

                  const color =
                    score >= 80
                      ? 'text-green-400'
                      : score >= 60
                        ? 'text-blue-400'
                        : score >= 40
                          ? 'text-yellow-400'
                          : score >= 20
                            ? 'text-orange-400'
                            : 'text-red-400';

                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Score:</span>
                        <span className={`font-bold ${color}`}>
                          {score}/100
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Level:</span>
                        <span className={color}>{level}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            score >= 80
                              ? 'bg-green-400'
                              : score >= 60
                                ? 'bg-blue-400'
                                : score >= 40
                                  ? 'bg-yellow-400'
                                  : score >= 20
                                    ? 'bg-orange-400'
                                    : 'bg-red-400'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSummary(getSummary())}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
