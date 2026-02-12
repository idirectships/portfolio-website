import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import SEOHead, {
  generateProjectStructuredData,
  generateArticleStructuredData,
} from '../SEOHead';

// Mock Next.js Head component
jest.mock('next/head', () => {
  return function MockHead({ children }: { children: React.ReactNode }) {
    return <div data-testid="head">{children}</div>;
  };
});

describe('SEOHead', () => {
  it('should render with default values', () => {
    const { container } = render(<SEOHead />);

    const head = container.querySelector('[data-testid="head"]');
    expect(head).toBeInTheDocument();

    // Check for default title
    const title = head?.querySelector('title');
    expect(title?.textContent).toBe(
      'Andrew Garman - AI Implementation Specialist'
    );
  });

  it('should render with custom title', () => {
    const { container } = render(<SEOHead title="Custom Page" />);

    const head = container.querySelector('[data-testid="head"]');
    const title = head?.querySelector('title');
    expect(title?.textContent).toBe('Custom Page | Andrew Garman');
  });

  it('should render with custom description', () => {
    const customDescription = 'This is a custom page description';
    const { container } = render(<SEOHead description={customDescription} />);

    const head = container.querySelector('[data-testid="head"]');
    const metaDescription = head?.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe(customDescription);
  });

  it('should render canonical URL', () => {
    const canonicalUrl = 'https://example.com/custom-page';
    const { container } = render(<SEOHead canonical={canonicalUrl} />);

    const head = container.querySelector('[data-testid="head"]');
    const canonical = head?.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(canonicalUrl);
  });

  it('should render Open Graph meta tags', () => {
    const props = {
      title: 'Test Page',
      description: 'Test description',
      ogImage: '/custom-og-image.png',
      canonical: 'https://example.com/test',
    };

    const { container } = render(<SEOHead {...props} />);

    const head = container.querySelector('[data-testid="head"]');

    const ogTitle = head?.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute('content')).toBe('Test Page | Andrew Garman');

    const ogDescription = head?.querySelector(
      'meta[property="og:description"]'
    );
    expect(ogDescription?.getAttribute('content')).toBe('Test description');

    const ogImage = head?.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe(
      'https://andrewgarman.dev/custom-og-image.png'
    );

    const ogUrl = head?.querySelector('meta[property="og:url"]');
    expect(ogUrl?.getAttribute('content')).toBe('https://example.com/test');

    const ogType = head?.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute('content')).toBe('website');
  });

  it('should render Twitter meta tags', () => {
    const props = {
      title: 'Test Page',
      description: 'Test description',
      ogImage: '/custom-og-image.png',
    };

    const { container } = render(<SEOHead {...props} />);

    const head = container.querySelector('[data-testid="head"]');

    const twitterTitle = head?.querySelector('meta[name="twitter:title"]');
    expect(twitterTitle?.getAttribute('content')).toBe(
      'Test Page | Andrew Garman'
    );

    const twitterDescription = head?.querySelector(
      'meta[name="twitter:description"]'
    );
    expect(twitterDescription?.getAttribute('content')).toBe(
      'Test description'
    );

    const twitterImage = head?.querySelector('meta[name="twitter:image"]');
    expect(twitterImage?.getAttribute('content')).toBe(
      'https://andrewgarman.dev/custom-og-image.png'
    );

    const twitterCard = head?.querySelector('meta[name="twitter:card"]');
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image');
  });

  it('should render noindex meta tag when specified', () => {
    const { container } = render(<SEOHead noindex={true} />);

    const head = container.querySelector('[data-testid="head"]');
    const robots = head?.querySelector('meta[name="robots"]');
    expect(robots?.getAttribute('content')).toBe('noindex,nofollow');
  });

  it('should not render noindex meta tag by default', () => {
    const { container } = render(<SEOHead />);

    const head = container.querySelector('[data-testid="head"]');
    const robots = head?.querySelector('meta[name="robots"]');
    expect(robots).toBeNull();
  });

  it('should render JSON-LD structured data', () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Andrew Garman',
    };

    const { container } = render(<SEOHead jsonLd={jsonLd} />);

    const head = container.querySelector('[data-testid="head"]');
    const script = head?.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(script?.textContent).toBe(JSON.stringify(jsonLd));
  });

  it('should use default values when props are not provided', () => {
    const { container } = render(<SEOHead />);

    const head = container.querySelector('[data-testid="head"]');

    // Check default canonical
    const canonical = head?.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://andrewgarman.dev');

    // Check default OG image
    const ogImage = head?.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe(
      'https://andrewgarman.dev/og-image.png'
    );
  });
});

describe('generateProjectStructuredData', () => {
  it('should generate correct structured data for a project', () => {
    const project = {
      name: 'Test Project',
      description: 'A test project description',
      url: 'https://example.com/project',
      image: '/project-image.png',
      technologies: ['React', 'TypeScript', 'Next.js'],
      dateCreated: '2024-01-01',
      dateModified: '2024-01-15',
    };

    const result = generateProjectStructuredData(project);

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: 'Test Project',
      description: 'A test project description',
      url: 'https://example.com/project',
      image: '/project-image.png',
      creator: {
        '@type': 'Person',
        name: 'Andrew Garman',
        url: 'https://andrewgarman.dev',
      },
      keywords: 'React, TypeScript, Next.js',
      dateCreated: '2024-01-01',
      dateModified: '2024-01-15',
      inLanguage: 'en-US',
    });
  });

  it('should handle optional project fields', () => {
    const project = {
      name: 'Minimal Project',
      description: 'A minimal project',
      technologies: ['JavaScript'],
    };

    const result = generateProjectStructuredData(project);

    expect(result.name).toBe('Minimal Project');
    expect(result.url).toBeUndefined();
    expect(result.image).toBeUndefined();
    expect(result.dateCreated).toBeUndefined();
    expect(result.dateModified).toBeUndefined();
  });
});

describe('generateArticleStructuredData', () => {
  it('should generate correct structured data for an article', () => {
    const article = {
      title: 'Test Article',
      description: 'A test article description',
      url: 'https://example.com/article',
      image: '/article-image.png',
      datePublished: '2024-01-01',
      dateModified: '2024-01-15',
      keywords: ['AI', 'Technology', 'Programming'],
    };

    const result = generateArticleStructuredData(article);

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article',
      description: 'A test article description',
      url: 'https://example.com/article',
      image: '/article-image.png',
      author: {
        '@type': 'Person',
        name: 'Andrew Garman',
        url: 'https://andrewgarman.dev',
      },
      publisher: {
        '@type': 'Person',
        name: 'Andrew Garman',
        url: 'https://andrewgarman.dev',
      },
      datePublished: '2024-01-01',
      dateModified: '2024-01-15',
      keywords: 'AI, Technology, Programming',
      inLanguage: 'en-US',
    });
  });

  it('should use datePublished as dateModified when dateModified is not provided', () => {
    const article = {
      title: 'Test Article',
      description: 'A test article description',
      url: 'https://example.com/article',
      datePublished: '2024-01-01',
    };

    const result = generateArticleStructuredData(article);

    expect(result.datePublished).toBe('2024-01-01');
    expect(result.dateModified).toBe('2024-01-01');
  });

  it('should handle optional article fields', () => {
    const article = {
      title: 'Minimal Article',
      description: 'A minimal article',
      url: 'https://example.com/minimal',
      datePublished: '2024-01-01',
    };

    const result = generateArticleStructuredData(article);

    expect(result.image).toBeUndefined();
    expect(result.keywords).toBeUndefined();
  });
});
