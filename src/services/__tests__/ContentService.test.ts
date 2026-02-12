import { contentService } from '../ContentService';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('ContentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFileContent', () => {
    it('should fetch file content successfully', async () => {
      const mockContent = 'File content';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
      } as Response);

      const result = await contentService.getFileContent('~/README.md');

      expect(result).toBe(mockContent);
      expect(mockFetch).toHaveBeenCalledWith('/content/README.md');
    });

    it('should handle nested file paths', async () => {
      const mockContent = 'Nested file content';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
      } as Response);

      const result = await contentService.getFileContent(
        '~/projects/web-apps/portfolio/README.md'
      );

      expect(result).toBe(mockContent);
      expect(mockFetch).toHaveBeenCalledWith(
        '/content/projects/web-apps/portfolio/README.md'
      );
    });

    it('should handle file not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        contentService.getFileContent('~/nonexistent.md')
      ).rejects.toThrow('File not found: ~/nonexistent.md');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        contentService.getFileContent('~/README.md')
      ).rejects.toThrow('Network error');
    });

    it('should handle server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      await expect(
        contentService.getFileContent('~/README.md')
      ).rejects.toThrow(
        'Failed to fetch ~/README.md: 500 Internal Server Error'
      );
    });

    it('should normalize file paths', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('content'),
      } as Response);

      await contentService.getFileContent('~/./projects/../README.md');

      expect(mockFetch).toHaveBeenCalledWith('/content/README.md');
    });

    it('should handle root path files', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('content'),
      } as Response);

      await contentService.getFileContent('~/welcome.sh');

      expect(mockFetch).toHaveBeenCalledWith('/content/welcome.sh');
    });
  });

  describe('getDirectoryListing', () => {
    it('should get directory listing successfully', async () => {
      const mockListing = {
        files: ['README.md', 'package.json'],
        directories: ['src', 'public'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      } as Response);

      const result = await contentService.getDirectoryListing('~/projects');

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/content/directory?path=~/projects'
      );
    });

    it('should handle directory not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        contentService.getDirectoryListing('~/nonexistent')
      ).rejects.toThrow('Directory not found: ~/nonexistent');
    });

    it('should handle root directory', async () => {
      const mockListing = {
        files: ['welcome.sh'],
        directories: ['artist', 'projects', 'studio'],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockListing),
      } as Response);

      const result = await contentService.getDirectoryListing('~');

      expect(result).toEqual(mockListing);
      expect(mockFetch).toHaveBeenCalledWith('/api/content/directory?path=~');
    });
  });

  describe('searchContent', () => {
    it('should search content successfully', async () => {
      const mockResults = [
        {
          path: '~/README.md',
          title: 'README',
          excerpt: 'This is a test file...',
          matches: 2,
        },
        {
          path: '~/projects/portfolio/README.md',
          title: 'Portfolio README',
          excerpt: 'Portfolio project description...',
          matches: 1,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockResults }),
      } as Response);

      const result = await contentService.searchContent('test');

      expect(result).toEqual(mockResults);
      expect(mockFetch).toHaveBeenCalledWith('/api/content/search?q=test');
    });

    it('should handle empty search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      } as Response);

      const result = await contentService.searchContent('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle search with filters', async () => {
      const mockResults = [];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockResults }),
      } as Response);

      const result = await contentService.searchContent('test', {
        path: '~/projects',
        fileType: 'md',
      });

      expect(result).toEqual(mockResults);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/content/search?q=test&path=~/projects&fileType=md'
      );
    });

    it('should handle search errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(contentService.searchContent('test')).rejects.toThrow(
        'Search failed: 500'
      );
    });
  });

  describe('getFileMetadata', () => {
    it('should get file metadata successfully', async () => {
      const mockMetadata = {
        size: 1024,
        lastModified: '2024-01-01T00:00:00Z',
        type: 'markdown',
        encoding: 'utf-8',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata),
      } as Response);

      const result = await contentService.getFileMetadata('~/README.md');

      expect(result).toEqual(mockMetadata);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/content/metadata?path=~/README.md'
      );
    });

    it('should handle metadata not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(
        contentService.getFileMetadata('~/nonexistent.md')
      ).rejects.toThrow('Metadata not found: ~/nonexistent.md');
    });
  });

  describe('validatePath', () => {
    it('should validate valid paths', () => {
      const validPaths = [
        '~',
        '~/README.md',
        '~/projects/web-apps',
        '~/artist/bio.md',
        '~/studio/toolbox/languages.json',
      ];

      validPaths.forEach((path) => {
        expect(() => contentService.validatePath(path)).not.toThrow();
      });
    });

    it('should reject invalid paths', () => {
      const invalidPaths = [
        '',
        'README.md', // Missing ~
        '~/../../etc/passwd', // Path traversal
        '~/../outside', // Path traversal
        '~/projects/./../../etc', // Complex path traversal
        '~/projects//double-slash',
      ];

      invalidPaths.forEach((path) => {
        expect(() => contentService.validatePath(path)).toThrow();
      });
    });

    it('should normalize valid paths', () => {
      expect(contentService.normalizePath('~/./projects/../README.md')).toBe(
        '~/README.md'
      );
      expect(
        contentService.normalizePath('~/projects/web-apps/./portfolio')
      ).toBe('~/projects/web-apps/portfolio');
      expect(contentService.normalizePath('~/projects//web-apps')).toBe(
        '~/projects/web-apps'
      );
    });
  });

  describe('caching', () => {
    it('should cache file content', async () => {
      const mockContent = 'Cached content';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
      } as Response);

      // First call
      const result1 = await contentService.getFileContent('~/README.md');
      expect(result1).toBe(mockContent);

      // Second call should use cache
      const result2 = await contentService.getFileContent('~/README.md');
      expect(result2).toBe(mockContent);

      // Should only have called fetch once
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should respect cache expiration', async () => {
      const mockContent = 'Content';
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockContent),
      } as Response);

      // Mock Date.now to control cache expiration
      const originalDateNow = Date.now;
      let currentTime = 1000000;
      Date.now = jest.fn(() => currentTime);

      // First call
      await contentService.getFileContent('~/README.md');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call within cache time
      await contentService.getFileContent('~/README.md');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Advance time beyond cache expiration (assuming 5 minute cache)
      currentTime += 6 * 60 * 1000;

      // Third call should fetch again
      await contentService.getFileContent('~/README.md');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      Date.now = originalDateNow;
    });

    it('should clear cache', async () => {
      const mockContent = 'Content';
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockContent),
      } as Response);

      // First call
      await contentService.getFileContent('~/README.md');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      contentService.clearCache();

      // Second call should fetch again
      await contentService.getFileContent('~/README.md');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(
        contentService.getDirectoryListing('~/projects')
      ).rejects.toThrow('Invalid JSON');
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      await expect(
        contentService.getFileContent('~/README.md')
      ).rejects.toThrow('Timeout');
    });
  });
});
