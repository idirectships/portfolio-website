/**
 * Property-based tests for lazy loading behavior
 * Feature: personal-brand-website, Property 9: Lazy loading behavior
 * Validates: Requirements 7.3
 */

import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import LazyLoader, { useLazyLoad } from '../LazyLoader';
import OptimizedImage from '../OptimizedImage';
import { act } from 'react';

// Mock IntersectionObserver for testing
const mockIntersectionObserver = jest.fn();
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeAll(() => {
  global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
    mockIntersectionObserver.mockImplementation(callback);
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: jest.fn(),
    };
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  // Clean up DOM between tests to prevent pollution
  document.body.innerHTML = '';
});

afterEach(() => {
  // Additional cleanup after each test
  jest.clearAllMocks();
  // Reset any global state
  document.body.innerHTML = '';
});

describe('Lazy Loading Properties', () => {
  /**
   * Property 9: Lazy loading behavior
   * For any non-critical asset request, the content renderer should defer loading
   * until needed while maintaining interface responsiveness
   */
  describe('Property 9: Lazy loading behavior', () => {
    test('should defer loading until intersection for any content', () => {
      fc.assert(
        fc.property(
          fc.record({
            content: fc.string({ minLength: 1, maxLength: 1000 }),
            className: fc.string({ maxLength: 50 }),
            rootMargin: fc.oneof(
              fc.constant('0px'),
              fc.constant('50px'),
              fc.constant('100px')
            ),
            threshold: fc.float({ min: 0, max: 1 }),
          }),
          ({ content, className, rootMargin, threshold }) => {
            // Render LazyLoader with test content
            const TestContent = () => (
              <div data-testid="lazy-content">{content}</div>
            );
            const fallback = <div data-testid="fallback">Loading...</div>;

            render(
              <LazyLoader
                fallback={fallback}
                rootMargin={rootMargin}
                threshold={threshold}
                className={className}
              >
                <TestContent />
              </LazyLoader>
            );

            // Initially should show fallback, not the actual content
            expect(screen.getByTestId('fallback')).toBeInTheDocument();
            expect(
              screen.queryByTestId('lazy-content')
            ).not.toBeInTheDocument();

            // Verify IntersectionObserver was set up correctly
            expect(global.IntersectionObserver).toHaveBeenCalledWith(
              expect.any(Function),
              {
                rootMargin,
                threshold,
              }
            );
            expect(mockObserve).toHaveBeenCalled();

            // Simulate intersection
            act(() => {
              const callback = mockIntersectionObserver.mock.calls[0][0];
              callback([{ isIntersecting: true }]);
            });

            // After intersection, content should be loaded
            expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
            expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();

            // Observer should be disconnected after loading
            expect(mockDisconnect).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle IntersectionObserver unavailability gracefully', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 500 }), (content) => {
          // Temporarily remove IntersectionObserver
          const originalIO = global.IntersectionObserver;
          // @ts-expect-error - Temporarily remove IntersectionObserver
          delete global.IntersectionObserver;

          const TestContent = () => (
            <div data-testid="lazy-content">{content}</div>
          );
          const fallback = <div data-testid="fallback">Loading...</div>;

          render(
            <LazyLoader fallback={fallback}>
              <TestContent />
            </LazyLoader>
          );

          // Should load immediately when IntersectionObserver is not available
          expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
          expect(screen.queryByTestId('fallback')).not.toBeInTheDocument();

          // Restore IntersectionObserver
          global.IntersectionObserver = originalIO;
        }),
        { numRuns: 50 }
      );
    });

    test('should maintain responsive interface during loading states', () => {
      fc.assert(
        fc.property(
          fc.record({
            loadingText: fc.string({ minLength: 1, maxLength: 100 }),
            contentSize: fc.integer({ min: 1, max: 10000 }),
          }),
          ({ loadingText, contentSize }) => {
            const largeContent = 'x'.repeat(contentSize);
            const TestContent = () => (
              <div data-testid="lazy-content">{largeContent}</div>
            );
            const fallback = (
              <div data-testid="fallback" className="animate-pulse">
                {loadingText}
              </div>
            );

            const { container } = render(
              <LazyLoader fallback={fallback}>
                <TestContent />
              </LazyLoader>
            );

            // Fallback should be immediately available and responsive
            const fallbackElement = screen.getByTestId('fallback');
            expect(fallbackElement).toBeInTheDocument();
            expect(fallbackElement).toHaveClass('animate-pulse');

            // Container should not block rendering
            expect(container.firstChild).toBeInTheDocument();

            // Simulate intersection to load content
            act(() => {
              const callback = mockIntersectionObserver.mock.calls[0][0];
              callback([{ isIntersecting: true }]);
            });

            // Content should load without blocking the interface
            expect(screen.getByTestId('lazy-content')).toBeInTheDocument();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('OptimizedImage lazy loading', () => {
    test('should defer image loading based on priority setting', () => {
      fc.assert(
        fc.property(
          fc.record({
            src: fc.webUrl(),
            alt: fc.string({ minLength: 1, maxLength: 100 }),
            priority: fc.boolean(),
            width: fc.integer({ min: 50, max: 2000 }),
            height: fc.integer({ min: 50, max: 2000 }),
          }),
          ({ src, alt, priority, width, height }) => {
            render(
              <OptimizedImage
                src={src}
                alt={alt}
                priority={priority}
                width={width}
                height={height}
              />
            );

            const img = screen.getByRole('img');

            // Priority images should have eager loading
            if (priority) {
              expect(img).toHaveAttribute('loading', 'eager');
            } else {
              expect(img).toHaveAttribute('loading', 'lazy');
            }

            // Should have proper responsive attributes
            expect(img).toHaveAttribute('srcset');
            expect(img).toHaveAttribute('sizes');
            expect(img).toHaveAttribute('decoding', 'async');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should handle image loading states correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            src: fc.webUrl(),
            alt: fc.string({ minLength: 1, maxLength: 100 }),
            className: fc.string({ maxLength: 50 }),
          }),
          ({ src, alt, className }) => {
            render(
              <OptimizedImage
                src={src}
                alt={alt}
                className={className}
                priority={true} // Use priority to avoid lazy loading wrapper
              />
            );

            // Should show loading state initially
            expect(screen.getByText('Loading image...')).toBeInTheDocument();

            const img = screen.getByRole('img');
            expect(img).toHaveClass('opacity-0'); // Initially hidden

            // Simulate successful load
            act(() => {
              img.dispatchEvent(new Event('load'));
            });

            // Should show loaded state
            expect(img).toHaveClass('opacity-100');
            expect(
              screen.queryByText('Loading image...')
            ).not.toBeInTheDocument();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('useLazyLoad hook', () => {
    test('should provide correct visibility state for any configuration', () => {
      fc.assert(
        fc.property(
          fc.record({
            rootMargin: fc.oneof(
              fc.constant('0px'),
              fc.constant('25px'),
              fc.constant('50px'),
              fc.constant('100px')
            ),
            threshold: fc.float({ min: 0, max: 1 }),
          }),
          ({ rootMargin, threshold }) => {
            let hookResult: [React.RefObject<HTMLDivElement>, boolean] | null =
              null;

            const TestComponent = () => {
              hookResult = useLazyLoad(rootMargin, threshold);
              const [ref, isVisible] = hookResult;

              return (
                <div
                  ref={ref as React.RefObject<HTMLDivElement>}
                  data-testid="hook-element"
                >
                  {isVisible ? 'Visible' : 'Hidden'}
                </div>
              );
            };

            render(<TestComponent />);

            expect(hookResult).not.toBeNull();
            const [, initialVisibility] = hookResult!;

            // Initially should not be visible
            expect(initialVisibility).toBe(false);
            expect(screen.getByText('Hidden')).toBeInTheDocument();

            // Simulate intersection
            act(() => {
              const callback = mockIntersectionObserver.mock.calls[0][0];
              callback([{ isIntersecting: true }]);
            });

            // Should become visible after intersection
            expect(screen.getByText('Visible')).toBeInTheDocument();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
