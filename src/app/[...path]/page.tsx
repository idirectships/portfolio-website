import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import TerminalInterface from '@/components/TerminalInterface';

interface PageProps {
  params: {
    path?: string[];
  };
}

// Valid portfolio paths that should be accessible via URL
const VALID_PATHS = [
  'artist',
  'studio',
  'projects',
  'gallery',
  'commissions',
  'projects/web-apps',
  'projects/client-sites',
  'projects/experiments',
  'studio/toolbox',
  'studio/certifications',
  'studio/workspace-setup',
  'gallery/screenshots',
  'gallery/process-videos',
  'gallery/design-mockups',
  'gallery/ui-components',
];

// Generate metadata based on the current path
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const path = params.path?.join('/') || '';

  // Default metadata
  let title = 'Andrew Garman - AI Implementation Specialist';
  let description =
    "Portfolio of Andrew 'Dru' Garman - AI Implementation Specialist and ex-FAANG recruiter transitioning to AI engineering";

  // Customize metadata based on path
  switch (path) {
    case 'artist':
      title = 'About Andrew Garman - Professional Background';
      description =
        "Learn about Andrew Garman's journey from FAANG recruiter to AI Implementation Specialist, including background, philosophy, and career transition.";
      break;
    case 'studio':
      title = 'Technical Skills & Tools - Andrew Garman';
      description =
        "Explore Andrew Garman's technical toolkit, programming languages, frameworks, certifications, and development environment setup.";
      break;
    case 'projects':
      title = 'Projects Portfolio - Andrew Garman';
      description =
        "Browse Andrew Garman's project portfolio including web applications, client sites, and experimental projects showcasing AI and web development skills.";
      break;
    case 'projects/web-apps':
      title = 'Web Applications - Project Portfolio';
      description =
        'Web applications built by Andrew Garman, featuring AI-powered tools, modern frameworks, and innovative user experiences.';
      break;
    case 'projects/client-sites':
      title = 'Client Websites - Project Portfolio';
      description =
        'Professional client websites and landing pages developed by Andrew Garman, showcasing modern web development practices.';
      break;
    case 'projects/experiments':
      title = 'Experimental Projects - Innovation Lab';
      description =
        'Experimental and research projects by Andrew Garman, exploring cutting-edge technologies, AI applications, and innovative solutions.';
      break;
    case 'gallery':
      title = 'Design Gallery - Visual Portfolio';
      description =
        "Visual gallery showcasing UI designs, mockups, screenshots, and process documentation from Andrew Garman's projects.";
      break;
    case 'commissions':
      title = 'Commission Work - Available Services';
      description =
        'Commission and consulting services offered by Andrew Garman, including AI implementation, web development, and technical recruiting.';
      break;
  }

  const canonical = `https://andrewgarman.dev/${path}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
    twitter: {
      title,
      description,
    },
  };
}

// Generate static params for known paths
export async function generateStaticParams() {
  return VALID_PATHS.map((path) => ({
    path: path.split('/'),
  }));
}

export default function DynamicTerminalPage({ params }: PageProps) {
  const path = params.path?.join('/') || '';

  // Check if this is a valid path
  if (path && !VALID_PATHS.includes(path)) {
    notFound();
  }

  // Convert URL path to terminal directory format
  const initialDirectory = path ? `/${path}` : '~';

  // Generate structured data for specific paths
  let structuredData = null;
  if (path === 'projects') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Andrew Garman - Project Portfolio',
      description:
        'Collection of projects by Andrew Garman showcasing AI implementation and web development skills',
      url: `https://andrewgarman.dev/${path}`,
      creator: {
        '@type': 'Person',
        name: 'Andrew Garman',
        url: 'https://andrewgarman.dev',
      },
      mainEntity: {
        '@type': 'ItemList',
        name: 'Projects',
        description:
          'Portfolio projects including web applications, client sites, and experiments',
      },
    };
  }

  return (
    <>
      {/* Inject structured data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}

      {/* Wrap TerminalInterface in Suspense to handle useSearchParams during SSG */}
      <Suspense
        fallback={
          <div className="min-h-screen bg-terminal-bg text-terminal-fg font-mono p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-pulse text-terminal-accent mb-4">
                Loading terminal...
              </div>
              <div className="flex space-x-1 justify-center">
                <div className="w-2 h-2 bg-terminal-cursor rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-terminal-cursor rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-terminal-cursor rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          </div>
        }
      >
        <TerminalInterface
          initialDirectory={initialDirectory}
          welcomeMessage={`Welcome to Andrew Garman's Portfolio Terminal${path ? ` - ${path}` : ''}`}
        />
      </Suspense>
    </>
  );
}
