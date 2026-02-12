import { renderHook, act } from '@testing-library/react';
import { useContentManager } from '../useContentManager';
import { contentManager } from '../../services/ContentManager';

// Mock the ContentManager service
jest.mock('../../services/ContentManager', () => ({
  contentManager: {
    initialize: jest.fn(),
    getContent: jest.fn(),
    updateContent: jest.fn(),
    regenerateContent: jest.fn(),
    validateContent: jest.fn(),
    getContentMetadata: jest.fn(),
  },
}));

const mockContentManager = contentManager as jest.Mocked<typeof contentManager>;

describe('useContentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    mockContentManager.initialize.mockResolvedValue(undefined);

    const { result } = renderHook(() => useContentManager());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should initialize content manager on mount', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);

    renderHook(() => useContentManager());

    expect(mockContentManager.initialize).toHaveBeenCalled();
  });

  it('should handle initialization success', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle initialization error', async () => {
    const error = new Error('Initialization failed');
    mockContentManager.initialize.mockRejectedValue(error);

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Initialization failed');
  });

  it('should get content', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.getContent.mockResolvedValue('File content');

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let content: string | null = null;
    await act(async () => {
      content = await result.current.getContent('~/README.md');
    });

    expect(content).toBe('File content');
    expect(mockContentManager.getContent).toHaveBeenCalledWith('~/README.md');
  });

  it('should handle get content error', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.getContent.mockRejectedValue(
      new Error('File not found')
    );

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let content: string | null = null;
    await act(async () => {
      content = await result.current.getContent('~/nonexistent.md');
    });

    expect(content).toBeNull();
    expect(result.current.error).toBe('File not found');
  });

  it('should update content', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.updateContent.mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let success = false;
    await act(async () => {
      success = await result.current.updateContent(
        '~/README.md',
        'New content'
      );
    });

    expect(success).toBe(true);
    expect(mockContentManager.updateContent).toHaveBeenCalledWith(
      '~/README.md',
      'New content'
    );
  });

  it('should handle update content error', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.updateContent.mockRejectedValue(
      new Error('Update failed')
    );

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let success = false;
    await act(async () => {
      success = await result.current.updateContent(
        '~/README.md',
        'New content'
      );
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Update failed');
  });

  it('should regenerate content', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.regenerateContent.mockResolvedValue(undefined);

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let success = false;
    await act(async () => {
      success = await result.current.regenerateContent();
    });

    expect(success).toBe(true);
    expect(mockContentManager.regenerateContent).toHaveBeenCalled();
  });

  it('should handle regenerate content error', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.regenerateContent.mockRejectedValue(
      new Error('Regeneration failed')
    );

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let success = false;
    await act(async () => {
      success = await result.current.regenerateContent();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe('Regeneration failed');
  });

  it('should validate content', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.validateContent.mockResolvedValue({
      isValid: true,
      errors: [],
      warnings: [],
    });

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let validationResult: any = null;
    await act(async () => {
      validationResult = await result.current.validateContent();
    });

    expect(validationResult.isValid).toBe(true);
    expect(mockContentManager.validateContent).toHaveBeenCalled();
  });

  it('should handle validate content error', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.validateContent.mockRejectedValue(
      new Error('Validation failed')
    );

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let validationResult: any = null;
    await act(async () => {
      validationResult = await result.current.validateContent();
    });

    expect(validationResult).toBeNull();
    expect(result.current.error).toBe('Validation failed');
  });

  it('should get content metadata', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.getContentMetadata.mockResolvedValue({
      lastModified: new Date(),
      size: 1024,
      type: 'markdown',
    });

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let metadata: any = null;
    await act(async () => {
      metadata = await result.current.getContentMetadata('~/README.md');
    });

    expect(metadata).toBeDefined();
    expect(metadata.size).toBe(1024);
    expect(mockContentManager.getContentMetadata).toHaveBeenCalledWith(
      '~/README.md'
    );
  });

  it('should handle get metadata error', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.getContentMetadata.mockRejectedValue(
      new Error('Metadata not found')
    );

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let metadata: any = null;
    await act(async () => {
      metadata = await result.current.getContentMetadata('~/README.md');
    });

    expect(metadata).toBeNull();
    expect(result.current.error).toBe('Metadata not found');
  });

  it('should clear error when operation succeeds', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.getContent.mockRejectedValueOnce(
      new Error('First error')
    );
    mockContentManager.getContent.mockResolvedValueOnce('Success content');

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    // First call should set error
    await act(async () => {
      await result.current.getContent('~/file1.md');
    });

    expect(result.current.error).toBe('First error');

    // Second call should clear error
    await act(async () => {
      await result.current.getContent('~/file2.md');
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle multiple concurrent operations', async () => {
    mockContentManager.initialize.mockResolvedValue(undefined);
    mockContentManager.getContent.mockImplementation((path) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`Content for ${path}`), 100);
      });
    });

    const { result, waitForNextUpdate } = renderHook(() => useContentManager());

    await waitForNextUpdate(); // Wait for initialization

    let results: (string | null)[] = [];
    await act(async () => {
      const promises = [
        result.current.getContent('~/file1.md'),
        result.current.getContent('~/file2.md'),
        result.current.getContent('~/file3.md'),
      ];
      results = await Promise.all(promises);
    });

    expect(results).toEqual([
      'Content for ~/file1.md',
      'Content for ~/file2.md',
      'Content for ~/file3.md',
    ]);
  });
});
