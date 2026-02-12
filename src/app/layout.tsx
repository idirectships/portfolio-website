import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteConfig = {
  name: 'Andrew Garman',
  title: 'Andrew Garman - AI Implementation Specialist',
  description:
    "Portfolio of Andrew 'Dru' Garman - AI Implementation Specialist and ex-FAANG recruiter transitioning to AI engineering. Explore projects, skills, and professional journey through an interactive terminal interface.",
  url: 'https://andrewgarman.dev',
  ogImage: '/og-image.png',
  creator: 'Andrew Garman',
  keywords: [
    'AI Implementation Specialist',
    'Machine Learning Engineer',
    'Software Engineering',
    'Portfolio',
    'FAANG Recruiter',
    'AI Engineering',
    'Terminal Interface',
    'Next.js',
    'TypeScript',
    'React',
    'Web Development',
    'Career Transition',
    'Technical Recruiting',
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [
    {
      name: siteConfig.creator,
      url: siteConfig.url,
    },
  ],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.title,
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@drewgarman',
  },

  // Additional meta tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Verification (add when available)
  // verification: {
  //   google: 'your-verification-code',
  // },

  // Canonical URL
  alternates: {
    canonical: siteConfig.url,
  },

  // Additional metadata
  category: 'technology',
  classification: 'Portfolio Website',

  // App-specific metadata
  applicationName: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteConfig.name,
  },

  // Manifest
  manifest: '/manifest.json',

  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

// Structured data for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Andrew Garman',
  alternateName: 'Dru Garman',
  description: siteConfig.description,
  url: siteConfig.url,
  image: siteConfig.ogImage,
  sameAs: [
    'https://linkedin.com/in/drewgarman',
    'https://github.com/idirectships',
  ],
  jobTitle: 'AI Implementation Specialist',
  worksFor: {
    '@type': 'Organization',
    name: 'Freelance',
  },
  knowsAbout: [
    'Artificial Intelligence',
    'Machine Learning',
    'Software Engineering',
    'Technical Recruiting',
    'Web Development',
    'TypeScript',
    'React',
    'Next.js',
  ],
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Arizona State University',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />

        {/* Additional meta tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Performance hints */}
        <link
          rel="preload"
          href="/fonts/GeistVF.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeistMonoVF.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-mono antialiased">
        <div className="terminal-container">{children}</div>
      </body>
    </html>
  );
}
