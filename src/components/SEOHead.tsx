import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: object;
}

/**
 * SEO component for dynamic meta tags
 * Used for pages that need custom SEO data
 */
export default function SEOHead({
  title,
  description,
  canonical,
  ogImage,
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  const siteUrl = 'https://andrewgarman.dev'; // Update with actual domain
  const defaultTitle = 'Andrew Garman - AI Implementation Specialist';
  const defaultDescription =
    "Portfolio of Andrew 'Dru' Garman - AI Implementation Specialist and ex-FAANG recruiter transitioning to AI engineering";
  const defaultOgImage = '/og-image.png';

  const pageTitle = title ? `${title} | Andrew Garman` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageOgImage = ogImage || defaultOgImage;
  const pageCanonical = canonical || siteUrl;

  return (
    <Head>
      {/* Basic meta tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />

      {/* Canonical URL */}
      <link rel="canonical" href={pageCanonical} />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={`${siteUrl}${pageOgImage}`} />
      <meta property="og:url" content={pageCanonical} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={`${siteUrl}${pageOgImage}`} />
      <meta name="twitter:card" content="summary_large_image" />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* JSON-LD structured data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      )}
    </Head>
  );
}

/**
 * Generate structured data for a project page
 */
export function generateProjectStructuredData(project: {
  name: string;
  description: string;
  url?: string;
  image?: string;
  technologies: string[];
  dateCreated?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.name,
    description: project.description,
    url: project.url,
    image: project.image,
    creator: {
      '@type': 'Person',
      name: 'Andrew Garman',
      url: 'https://andrewgarman.dev',
    },
    keywords: project.technologies.join(', '),
    dateCreated: project.dateCreated,
    dateModified: project.dateModified,
    inLanguage: 'en-US',
  };
}

/**
 * Generate structured data for a blog post or article
 */
export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  keywords?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: article.url,
    image: article.image,
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
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    keywords: article.keywords?.join(', '),
    inLanguage: 'en-US',
  };
}
