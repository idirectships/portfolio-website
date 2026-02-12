'use client';

import { useEffect, useState } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import Prism from 'prismjs';
import { FileSystemNode } from '../types/portfolio';
import LazyLoader from './LazyLoader';
import OptimizedImage from './OptimizedImage';

// Import Prism language components
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';

// Import Prism themes
import 'prismjs/themes/prism-tomorrow.css';

interface ContentRendererProps {
  file: FileSystemNode;
  content: string;
  renderMode?: 'terminal' | 'preview';
}

interface RenderStrategy {
  canHandle: (file: FileSystemNode) => boolean;
  render: (
    content: string,
    file: FileSystemNode
  ) => Promise<JSX.Element> | JSX.Element;
}

export default function ContentRenderer({
  file,
  content,
}: ContentRendererProps) {
  const [renderedContent, setRenderedContent] = useState<JSX.Element | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine if content should be lazy loaded
  const shouldLazyLoad = (file: FileSystemNode): boolean => {
    // Don't lazy load small text files or critical content
    const criticalExtensions = ['.md', '.txt', '.json'];
    const isCritical = criticalExtensions.some((ext) =>
      file.name.endsWith(ext)
    );

    // Lazy load large files, images, and non-critical content
    const lazyExtensions = ['.js', '.ts', '.py', '.css', '.scss', '.html'];
    const shouldLazy = lazyExtensions.some((ext) => file.name.endsWith(ext));

    return shouldLazy && !isCritical;
  };

  useEffect(() => {
    const renderContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const strategy = getRenderStrategy(file);
        const result = await strategy.render(content, file);
        setRenderedContent(result);
      } catch (err) {
        console.error('Error rendering content:', err);
        setError(
          `Failed to render ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    renderContent();
  }, [file, content]);

  if (isLoading) {
    return (
      <div className="text-terminal-fg/70 animate-pulse">
        Loading {file.name}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-terminal-error">
        <div className="font-bold">Error:</div>
        <div>{error}</div>
      </div>
    );
  }

  // Wrap non-critical content in lazy loader
  if (shouldLazyLoad(file)) {
    return (
      <LazyLoader
        fallback={
          <div className="text-terminal-fg/50 animate-pulse p-4 border border-terminal-border/30 rounded">
            📄 Loading {file.name}...
          </div>
        }
      >
        {renderedContent}
      </LazyLoader>
    );
  }

  return renderedContent;
}

/**
 * Get the appropriate render strategy for a file
 */
function getRenderStrategy(file: FileSystemNode): RenderStrategy {
  const strategies: RenderStrategy[] = [
    markdownStrategy,
    jsonStrategy,
    yamlStrategy,
    linkStrategy,
    imageStrategy,
    shellScriptStrategy,
    javascriptStrategy,
    typescriptStrategy,
    pythonStrategy,
    cssStrategy,
    plainTextStrategy, // fallback
  ];

  return (
    strategies.find((strategy) => strategy.canHandle(file)) || plainTextStrategy
  );
}

/**
 * Markdown file rendering strategy
 */
const markdownStrategy: RenderStrategy = {
  canHandle: (file) => file.name.endsWith('.md'),
  render: async (content) => {
    try {
      const processor = unified()
        .use(remarkParse)
        .use(remarkRehype)
        .use(rehypeHighlight)
        .use(rehypeStringify);

      const result = await processor.process(content);
      const htmlContent = String(result);

      return (
        <div className="markdown-content">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      );
    } catch (error) {
      throw new Error(
        `Markdown parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};

/**
 * JSON file rendering strategy
 */
const jsonStrategy: RenderStrategy = {
  canHandle: (file) => file.name.endsWith('.json'),
  render: (content, file) => {
    try {
      // Validate and format JSON
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);

      // Apply syntax highlighting
      const highlighted = Prism.highlight(
        formatted,
        Prism.languages.json,
        'json'
      );

      return (
        <div className="json-content">
          <div className="text-terminal-fg/70 text-sm mb-2">
            📄 {file.name} (JSON)
          </div>
          <pre className="bg-terminal-bg/50 p-4 rounded border border-terminal-border overflow-x-auto">
            <code
              className="language-json text-sm"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    } catch (error) {
      throw new Error(
        `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`
      );
    }
  },
};

/**
 * YAML file rendering strategy
 */
const yamlStrategy: RenderStrategy = {
  canHandle: (file) =>
    file.name.endsWith('.yaml') || file.name.endsWith('.yml'),
  render: (content, file) => {
    try {
      // Apply YAML syntax highlighting
      const highlighted = Prism.highlight(
        content,
        Prism.languages.yaml,
        'yaml'
      );

      return (
        <div className="yaml-content">
          <div className="text-terminal-fg/70 text-sm mb-2">
            📄 {file.name} (YAML)
          </div>
          <pre className="bg-terminal-bg/50 p-4 rounded border border-terminal-border overflow-x-auto">
            <code
              className="language-yaml text-sm"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    } catch (error) {
      throw new Error(
        `YAML highlighting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};

/**
 * Image file rendering strategy
 */
const imageStrategy: RenderStrategy = {
  canHandle: (file) => {
    const imageExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.svg',
      '.webp',
      '.avif',
    ];
    return imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
  },
  render: (content, file) => {
    // For static content, we assume the content is the image path/URL
    const imageSrc = content.trim() || `/content/${file.path}`;

    return (
      <div className="image-content">
        <div className="text-terminal-fg/70 text-sm mb-2">
          🖼️ {file.name} (Image)
        </div>
        <div className="bg-terminal-bg/50 p-4 rounded border border-terminal-border">
          <OptimizedImage
            src={imageSrc}
            alt={file.name}
            className="max-w-full h-auto rounded"
            placeholder="blur"
          />
        </div>
      </div>
    );
  },
};

/**
 * Link file rendering strategy (.link files)
 */
const linkStrategy: RenderStrategy = {
  canHandle: (file) => file.name.endsWith('.link'),
  render: (content, file) => {
    const url = content.trim();

    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    const linkType = file.name.includes('github')
      ? 'GitHub'
      : file.name.includes('launch')
        ? 'Live Site'
        : 'External Link';

    const icon = file.name.includes('github')
      ? '🔗'
      : file.name.includes('launch')
        ? '🚀'
        : '🌐';

    return (
      <div className="link-content">
        <div className="text-terminal-fg/70 text-sm mb-2">
          {icon} {file.name} ({linkType})
        </div>
        <div className="bg-terminal-bg/50 p-4 rounded border border-terminal-border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-terminal-prompt font-medium">{linkType}</div>
              <div className="text-terminal-fg/80 text-sm break-all">{url}</div>
            </div>
            <button
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              className="ml-4 px-3 py-1 bg-terminal-prompt/20 hover:bg-terminal-prompt/30 
                       text-terminal-prompt border border-terminal-prompt/50 rounded 
                       transition-colors text-sm font-medium"
            >
              Open →
            </button>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Shell script rendering strategy
 */
const shellScriptStrategy: RenderStrategy = {
  canHandle: (file) => file.name.endsWith('.sh') || file.name.endsWith('.bash'),
  render: (content, file) => {
    try {
      // Apply shell syntax highlighting
      const highlighted = Prism.highlight(
        content,
        Prism.languages.bash,
        'bash'
      );

      return (
        <div className="shell-content">
          <div className="text-terminal-fg/70 text-sm mb-2">
            ⚡ {file.name} (Shell Script)
          </div>
          <pre className="bg-terminal-bg/50 p-4 rounded border border-terminal-border overflow-x-auto">
            <code
              className="language-bash text-sm"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    } catch (error) {
      throw new Error(
        `Shell script highlighting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};

/**
 * JavaScript file rendering strategy
 */
const javascriptStrategy: RenderStrategy = {
  canHandle: (file) => file.name.endsWith('.js') || file.name.endsWith('.jsx'),
  render: (content, file) => {
    try {
      const highlighted = Prism.highlight(
        content,
        Prism.languages.javascript,
        'javascript'
      );

      return (
        <div className="javascript-content">
          <div className="text-terminal-fg/70 text-sm mb-2">
            📜 {file.name} (JavaScript)
          </div>
          <pre className="bg-terminal-bg/50 p-4 rounded border border-terminal-border overflow-x-auto">
            <code
              className="language-javascript text-sm"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    } catch (error) {
      throw new Error(
        `JavaScript highlighting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};

/**
 * TypeScript file rendering strategy
 */
const typescriptStrategy: RenderStrategy = {
  canHandle: (file) => file.name.endsWith('.ts') || file.name.endsWith('.tsx'),
  render: (content, file) => {
    try {
      const highlighted = Prism.highlight(
        content,
        Prism.languages.typescript,
        'typescript'
      );

      return (
        <div className="typescript-content">
          <div className="text-terminal-fg/70 text-sm mb-2">
            📜 {file.name} (TypeScript)
          </div>
          <pre className="bg-terminal-bg/50 p-4 rounded border border-terminal-border overflow-x-auto">
            <code
              className="language-typescript text-sm"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    } catch (error) {
      throw new Error(
        `TypeScript highlighting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};

/**
 * Python file rendering strategy
 */
const pythonStrategy: RenderStrategy = {
  canHandle: (file) => file.name.endsWith('.py'),
  render: (content, file) => {
    try {
      const highlighted = Prism.highlight(
        content,
        Prism.languages.python,
        'python'
      );

      return (
        <div className="python-content">
          <div className="text-terminal-fg/70 text-sm mb-2">
            🐍 {file.name} (Python)
          </div>
          <pre className="bg-terminal-bg/50 p-4 rounded border border-terminal-border overflow-x-auto">
            <code
              className="language-python text-sm"
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    } catch (error) {
      throw new Error(
        `Python highlighting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};

/**
 * CSS file rendering strategy
 */
const cssStrategy: RenderStrategy = {
  canHandle: (file) =>
    file.name.endsWith('.css') ||
    file.name.endsWith('.scss') ||
    file.name.endsWith('.sass'),
  render: (content, file) => {
    try {
      const language =
        file.name.endsWith('.scss') || file.name.endsWith('.sass')
          ? Prism.languages.scss
          : Prism.languages.css;
      const languageName =
        file.name.endsWith('.scss') || file.name.endsWith('.sass')
          ? 'scss'
          : 'css';

      const highlighted = Prism.highlight(content, language, languageName);

      return (
        <div className="css-content">
          <div className="text-terminal-fg/70 text-sm mb-2">
            🎨 {file.name} (CSS/SCSS)
          </div>
          <pre className="bg-terminal-bg/50 p-4 rounded border border-terminal-border overflow-x-auto">
            <code
              className={`language-${languageName} text-sm`}
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
        </div>
      );
    } catch (error) {
      throw new Error(
        `CSS highlighting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};

/**
 * Plain text fallback strategy
 */
const plainTextStrategy: RenderStrategy = {
  canHandle: () => true, // Always matches as fallback
  render: (content, file) => {
    const fileIcon = getFileIcon(file.name);

    return (
      <div className="text-content">
        <div className="text-terminal-fg/70 text-sm mb-2">
          {fileIcon} {file.name}
        </div>
        <pre className="bg-terminal-bg/50 p-4 rounded border border-terminal-border overflow-x-auto whitespace-pre-wrap">
          <code className="text-sm">{content}</code>
        </pre>
      </div>
    );
  },
};

/**
 * Get appropriate icon for file type
 */
function getFileIcon(filename: string): string {
  if (filename.endsWith('.md')) return '📝';
  if (filename.endsWith('.json')) return '📄';
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return '📄';
  if (filename.endsWith('.sh') || filename.endsWith('.bash')) return '⚡';
  if (filename.endsWith('.link')) return '🔗';
  if (filename.endsWith('.txt')) return '📄';
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) return '📜';
  if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return '📜';
  if (filename.endsWith('.py')) return '🐍';
  if (
    filename.endsWith('.css') ||
    filename.endsWith('.scss') ||
    filename.endsWith('.sass')
  )
    return '🎨';
  if (filename.endsWith('.html') || filename.endsWith('.htm')) return '🌐';
  if (
    filename.endsWith('.png') ||
    filename.endsWith('.jpg') ||
    filename.endsWith('.jpeg') ||
    filename.endsWith('.gif') ||
    filename.endsWith('.svg')
  )
    return '🖼️';
  if (filename.endsWith('.pdf')) return '📋';
  if (
    filename.endsWith('.zip') ||
    filename.endsWith('.tar') ||
    filename.endsWith('.gz')
  )
    return '📦';
  return '📄';
}
