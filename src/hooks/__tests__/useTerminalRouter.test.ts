import { renderHook, act } from '@testing-library/react';
import { useTerminalRouter } from '../useTerminalRouter';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams('path=~/projects'),
}));

describe('useTerminalRouter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with current path from URL params', () => {
    const { result } = renderHook(() => useTerminalRouter());

    expect(result.current.currentPath).toBe('~/projects');
  });

  it('should navigate to new path and update URL', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/artist');
    });

    expect(result.current.currentPath).toBe('~/artist');
    expect(mockPush).toHaveBeenCalledWith('/?path=~/artist');
  });

  it('should handle root path navigation', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~');
    });

    expect(result.current.currentPath).toBe('~');
    expect(mockPush).toHaveBeenCalledWith('/?path=~');
  });

  it('should handle relative path navigation', () => {
    const { result } = renderHook(() => useTerminalRouter());

    // Start at ~/projects
    expect(result.current.currentPath).toBe('~/projects');

    act(() => {
      result.current.navigateRelative('web-apps');
    });

    expect(result.current.currentPath).toBe('~/projects/web-apps');
    expect(mockPush).toHaveBeenCalledWith('/?path=~/projects/web-apps');
  });

  it('should handle parent directory navigation', () => {
    const { result } = renderHook(() => useTerminalRouter());

    // Start at ~/projects
    act(() => {
      result.current.navigateTo('~/projects/web-apps');
    });

    act(() => {
      result.current.navigateUp();
    });

    expect(result.current.currentPath).toBe('~/projects');
    expect(mockPush).toHaveBeenCalledWith('/?path=~/projects');
  });

  it('should not navigate above root directory', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~');
    });

    act(() => {
      result.current.navigateUp();
    });

    expect(result.current.currentPath).toBe('~');
  });

  it('should get current directory name', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects/web-apps');
    });

    expect(result.current.getCurrentDirectory()).toBe('web-apps');
  });

  it('should get parent directory path', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects/web-apps');
    });

    expect(result.current.getParentPath()).toBe('~/projects');
  });

  it('should return root for parent of root', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~');
    });

    expect(result.current.getParentPath()).toBe('~');
  });

  it('should check if path is root', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~');
    });

    expect(result.current.isRoot()).toBe(true);

    act(() => {
      result.current.navigateTo('~/projects');
    });

    expect(result.current.isRoot()).toBe(false);
  });

  it('should get path segments', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects/web-apps/portfolio');
    });

    expect(result.current.getPathSegments()).toEqual([
      '~',
      'projects',
      'web-apps',
      'portfolio',
    ]);
  });

  it('should handle empty path segments', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~');
    });

    expect(result.current.getPathSegments()).toEqual(['~']);
  });

  it('should resolve relative paths correctly', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects');
    });

    act(() => {
      result.current.navigateRelative('../artist');
    });

    expect(result.current.currentPath).toBe('~/artist');
  });

  it('should handle multiple parent directory references', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects/web-apps/portfolio');
    });

    act(() => {
      result.current.navigateRelative('../../artist');
    });

    expect(result.current.currentPath).toBe('~/artist');
  });

  it('should handle current directory reference', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects');
    });

    act(() => {
      result.current.navigateRelative('./web-apps');
    });

    expect(result.current.currentPath).toBe('~/projects/web-apps');
  });

  it('should normalize paths with multiple slashes', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects//web-apps///portfolio');
    });

    expect(result.current.currentPath).toBe('~/projects/web-apps/portfolio');
  });

  it('should handle absolute path navigation from relative', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects');
    });

    act(() => {
      result.current.navigateRelative('~/artist/bio.md');
    });

    expect(result.current.currentPath).toBe('~/artist/bio.md');
  });

  it('should maintain navigation history', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects');
    });

    act(() => {
      result.current.navigateTo('~/artist');
    });

    act(() => {
      result.current.navigateTo('~/studio');
    });

    expect(result.current.getNavigationHistory()).toEqual([
      '~/projects',
      '~/artist',
      '~/studio',
    ]);
  });

  it('should limit navigation history size', () => {
    const { result } = renderHook(() => useTerminalRouter());

    // Navigate to many paths
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.navigateTo(`~/path${i}`);
      });
    }

    const history = result.current.getNavigationHistory();
    expect(history.length).toBeLessThanOrEqual(10); // Assuming max history of 10
  });

  it('should go back in navigation history', () => {
    const { result } = renderHook(() => useTerminalRouter());

    act(() => {
      result.current.navigateTo('~/projects');
    });

    act(() => {
      result.current.navigateTo('~/artist');
    });

    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentPath).toBe('~/projects');
  });

  it('should not go back if no history', () => {
    const { result } = renderHook(() => useTerminalRouter());

    const initialPath = result.current.currentPath;

    act(() => {
      result.current.goBack();
    });

    expect(result.current.currentPath).toBe(initialPath);
  });

  it('should check if can go back', () => {
    const { result } = renderHook(() => useTerminalRouter());

    expect(result.current.canGoBack()).toBe(false);

    act(() => {
      result.current.navigateTo('~/projects');
    });

    act(() => {
      result.current.navigateTo('~/artist');
    });

    expect(result.current.canGoBack()).toBe(true);
  });
});
