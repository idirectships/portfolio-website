import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const siteConfig = {
  name: 'Andrew Garman',
  title: 'Andrew Garman - AI Implementation Specialist',
  description:
    'AI Implementation Specialist, ex-FAANG recruiter, and full-stack engineer building AI-powered products in Phoenix, AZ.',
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
    'Next.js',
    'TypeScript',
    'React',
    'Full Stack Developer',
    'Phoenix AZ',
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
  authors: [{ name: siteConfig.creator, url: siteConfig.url }],
  creator: siteConfig.creator,
  publisher: siteConfig.creator,

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

  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@drewgarman',
  },

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

  alternates: {
    canonical: siteConfig.url,
  },

  category: 'technology',
  classification: 'Portfolio Website',
  applicationName: siteConfig.name,

  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0a0a0a',
};

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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
