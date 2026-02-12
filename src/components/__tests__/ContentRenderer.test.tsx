import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as fc from 'fast-check';
import { FileSystemNode } from '../../types/portfolio';

// Mock all the Prism.js imports to prevent loading issues
jest.mock('prismjs/components/prism-json', () => ({}));
jest.mock('prismjs/components/prism-yaml', () => ({}));
jest.mock('prismjs/components/prism-bash', () => ({}));
jest.mock('prismjs/components/prism-typescript', () => ({}));
jest.mock('prismjs/components/prism-javascript', () => ({}));
jest.mock('prismjs/components/prism-markdown', () => ({}));
jest.mock('prismjs/components/prism-python', () => ({}));
jest.mock('prismjs/components/prism-css', () => ({}));
jest.mock('prismjs/components/prism-scss', () => ({}));
jest.mock('prismjs/themes/prism-tomorrow.css', () => ({}));

// Mock Prism.js with proper language support
jest.mock('prismjs', () => ({
  highlight: jest.fn((code: string) => {
    // Return the code wrapped in basic token spans for testing
    return `<span class="token">${code}</span>`;
  }),
  languages: {
    json: { test: true },
    yaml: { test: true },
    bash: { test: true },
    javascript: { test: true },
    typescript: { test: true },
    python: { test: true },
    css: { test: true },
    scss: { test: true },
    markdown: { test: true },
  },
}));

// Mock unified and related packages
jest.mock('unified', () => ({
  unified: jest.fn(() => ({
    use: jest.fn().mockReturnThis(),
    process: jest
      .fn()
      .mockResolvedValue({ toString: () => '<p>Processed markdown</p>' }),
  })),
}));

jest.mock('remark-parse', () => jest.fn());
jest.mock('remark-rehype', () => jest.fn());
jest.mock('rehype-stringify', () => jest.fn());
jest.mock('rehype-highlight', () => jest.fn());

// Import ContentRenderer directly for testing (avoid lazy loading issues)
import ContentRenderer from '../ContentRenderer';

// Helper functions for validation
function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

describe('ContentRenderer Property Tests', () => {
  // Property 5: File type rendering consistency
  it('Property 5: File type rendering consistency - For any file with a recognized extension (.md, .json, .link, .sh), the content renderer should display it with appropriate formatting and syntax highlighting', () => {
    fc.assert(
      fc.property(
        fc.record({
          extension: fc.constantFrom(
            '.md',
            '.json',
            '.yaml',
            '.yml',
            '.sh',
            '.bash',
            '.js',
            '.jsx',
            '.ts',
            '.tsx',
            '.py',
            '.css',
            '.scss',
            '.link',
            '.txt'
          ),
          filename: fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => !s.includes('.') && s.trim().length > 0),
          content: fc.string({ minLength: 0, maxLength: 100 }),
          path: fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => s.trim().length > 0),
        }),
        ({ extension, filename, content, path }) => {
          const fullFilename = `${filename.trim()}${extension}`;
          const file: FileSystemNode = {
            name: fullFilename,
            type: 'file',
            path: `${path.trim()}/${fullFilename}`,
          };

          // Property: All recognized file types should render without errors
          let renderResult: ReturnType<typeof render> | null = null;
          let hasError = false;

          try {
            renderResult = render(
              <ContentRenderer file={file} content={content} />
            );
          } catch {
            hasError = true;
          }

          // Property: Should not throw errors during initial render for recognized file types
          expect(hasError).toBe(false);

          if (renderResult) {
            const { container } = renderResult;

            // Property: Should render some content (container should not be empty)
            expect(container.firstChild).not.toBeNull();

            // Property: Should not display generic error messages for recognized file types (except invalid JSON/URLs)
            const isInvalidJson =
              extension === '.json' &&
              (content.trim() === '' ||
                (content.trim() && !isValidJson(content)));
            const isInvalidUrl =
              extension === '.link' &&
              (content.trim() === '' ||
                (content.trim() && !isValidUrl(content.trim())));

            if (!isInvalidJson && !isInvalidUrl) {
              // For valid content, should not show error messages
              const errorElements = container.querySelectorAll(
                '[class*="error"], [class*="Error"]'
              );
              const hasErrorText = Array.from(errorElements).some(
                (el) =>
                  el.textContent?.includes('Error:') ||
                  el.textContent?.includes('Failed to render')
              );
              expect(hasErrorText).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 } // Full property test with 100 iterations
    );
  });

  // Unit tests for specific file types
  describe('Unit Tests', () => {
    it('should render markdown files with proper formatting', async () => {
      const file: FileSystemNode = {
        name: 'test.md',
        type: 'file',
        path: '~/test.md',
      };
      const content = '# Test Markdown\n\nThis is a test.';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.md/)).toBeInTheDocument();
      });
    });

    it('should render JSON files with syntax highlighting', async () => {
      const file: FileSystemNode = {
        name: 'test.json',
        type: 'file',
        path: '~/test.json',
      };
      const content = '{"name": "test", "value": 123}';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.json.*JSON/)).toBeInTheDocument();
      });
    });

    it('should render link files with open button', async () => {
      const file: FileSystemNode = {
        name: 'test.link',
        type: 'file',
        path: '~/test.link',
      };
      const content = 'https://example.com';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.link/)).toBeInTheDocument();
        expect(screen.getByText('Open →')).toBeInTheDocument();
      });
    });

    it('should render shell scripts with proper highlighting', async () => {
      const file: FileSystemNode = {
        name: 'test.sh',
        type: 'file',
        path: '~/test.sh',
      };
      const content = '#!/bin/bash\necho "Hello World"';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.sh.*Shell Script/)).toBeInTheDocument();
      });
    });

    it('should render JavaScript files with syntax highlighting', async () => {
      const file: FileSystemNode = {
        name: 'test.js',
        type: 'file',
        path: '~/test.js',
      };
      const content = 'function hello() { console.log("Hello"); }';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.js.*JavaScript/)).toBeInTheDocument();
      });
    });

    it('should render TypeScript files with syntax highlighting', async () => {
      const file: FileSystemNode = {
        name: 'test.ts',
        type: 'file',
        path: '~/test.ts',
      };
      const content = 'interface Test { name: string; }';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.ts.*TypeScript/)).toBeInTheDocument();
      });
    });

    it('should render Python files with syntax highlighting', async () => {
      const file: FileSystemNode = {
        name: 'test.py',
        type: 'file',
        path: '~/test.py',
      };
      const content = 'def hello():\n    print("Hello World")';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.py.*Python/)).toBeInTheDocument();
      });
    });

    it('should render CSS files with syntax highlighting', async () => {
      const file: FileSystemNode = {
        name: 'test.css',
        type: 'file',
        path: '~/test.css',
      };
      const content = '.test { color: red; }';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.css.*CSS\/SCSS/)).toBeInTheDocument();
      });
    });

    it('should handle invalid JSON gracefully', async () => {
      const file: FileSystemNode = {
        name: 'invalid.json',
        type: 'file',
        path: '~/invalid.json',
      };
      const content = '{ invalid json }';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
      });
    });

    it('should handle invalid URLs in link files gracefully', async () => {
      const file: FileSystemNode = {
        name: 'invalid.link',
        type: 'file',
        path: '~/invalid.link',
      };
      const content = 'not-a-valid-url';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Invalid URL format/)).toBeInTheDocument();
      });
    });

    it('should render unknown file types as plain text', async () => {
      const file: FileSystemNode = {
        name: 'test.unknown',
        type: 'file',
        path: '~/test.unknown',
      };
      const content = 'This is plain text content';

      render(<ContentRenderer file={file} content={content} />);

      await waitFor(() => {
        expect(screen.getByText(/test\.unknown/)).toBeInTheDocument();
        expect(
          screen.getByText('This is plain text content')
        ).toBeInTheDocument();
      });
    });
  });
});
