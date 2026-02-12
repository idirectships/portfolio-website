import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import LazyLoader, { useLazyLoad } from '../LazyLoader';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});

// Store the original IntersectionObserver
const originalIntersectionObserver = window.IntersectionObserver;

describe('LazyLoader', () => {
  beforeEach(() => {
    // Reset the mock
    mockIntersectionObserver.mockClear();
    window.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    // Restore original IntersectionObserver
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('should render fallback initially', () => {
    render(
      <LazyLoader fallback={<div>Loading content...</div>}>
        <div>Actual content</div>
      </LazyLoader>
    );

    expect(screen.getByText('Loading content...')).toBeInTheDocument();
    expect(screen.queryByText('Actual content')).not.toBeInTheDocument();
  });

  it('should render content when intersection occurs', () => {
    let intersectionCallback: (entries: any[]) => void;

    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(
      <LazyLoader>
        <div>Actual content</div>
      </LazyLoader>
    );

    // Initially shows fallback
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    expect(screen.getByText('Actual content')).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });

  it('should use custom fallback', () => {
    render(
      <LazyLoader fallback={<div>Custom loading message</div>}>
        <div>Content</div>
      </LazyLoader>
    );

    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LazyLoader className="custom-class">
        <div>Content</div>
      </LazyLoader>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should use custom rootMargin and threshold', () => {
    render(
      <LazyLoader rootMargin="100px" threshold={0.5}>
        <div>Content</div>
      </LazyLoader>
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        rootMargin: '100px',
        threshold: 0.5,
      }
    );
  });

  it('should disconnect observer after loading', () => {
    let intersectionCallback: (entries: any[]) => void;
    const mockDisconnect = jest.fn();

    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      };
    });

    render(
      <LazyLoader>
        <div>Content</div>
      </LazyLoader>
    );

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should handle IntersectionObserver not supported', () => {
    // Remove IntersectionObserver support
    delete (window as any).IntersectionObserver;

    render(
      <LazyLoader>
        <div>Fallback content</div>
      </LazyLoader>
    );

    // Should immediately show content when IntersectionObserver is not supported
    expect(screen.getByText('Fallback content')).toBeInTheDocument();
  });

  it('should not load content if not intersecting', () => {
    let intersectionCallback: (entries: any[]) => void;

    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(
      <LazyLoader>
        <div>Content</div>
      </LazyLoader>
    );

    // Simulate non-intersection
    act(() => {
      intersectionCallback([{ isIntersecting: false }]);
    });

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

// Test the useLazyLoad hook
function TestComponent({
  rootMargin,
  threshold,
}: {
  rootMargin?: string;
  threshold?: number;
}) {
  const [ref, isVisible] = useLazyLoad(rootMargin, threshold);

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>}>
      {isVisible ? 'Content is visible' : 'Content is not visible'}
    </div>
  );
}

describe('useLazyLoad hook', () => {
  beforeEach(() => {
    mockIntersectionObserver.mockClear();
    window.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
  });

  it('should return ref and visibility state', () => {
    render(<TestComponent />);

    expect(screen.getByText('Content is not visible')).toBeInTheDocument();
  });

  it('should update visibility when intersecting', () => {
    let intersectionCallback: (entries: any[]) => void;

    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(<TestComponent />);

    expect(screen.getByText('Content is not visible')).toBeInTheDocument();

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    expect(screen.getByText('Content is visible')).toBeInTheDocument();
  });

  it('should use custom options', () => {
    render(<TestComponent rootMargin="200px" threshold={0.8} />);

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        rootMargin: '200px',
        threshold: 0.8,
      }
    );
  });

  it('should handle IntersectionObserver not supported in hook', () => {
    delete (window as any).IntersectionObserver;

    render(<TestComponent />);

    // Should immediately show as visible when IntersectionObserver is not supported
    expect(screen.getByText('Content is visible')).toBeInTheDocument();
  });
});
