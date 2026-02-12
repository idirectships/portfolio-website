import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Andrew Garman',
  description:
    "The requested page could not be found in Andrew Garman's portfolio terminal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-terminal-bg text-terminal-fg font-mono flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* ASCII Art 404 */}
        <pre className="text-terminal-error text-sm mb-8 overflow-x-auto">
          {`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║    ██╗  ██╗ ██████╗ ██╗  ██╗    ███████╗██████╗ ██████╗      ║
║    ██║  ██║██╔═████╗██║  ██║    ██╔════╝██╔══██╗██╔══██╗     ║
║    ███████║██║██╔██║███████║    █████╗  ██████╔╝██████╔╝     ║
║    ╚════██║████╔╝██║╚════██║    ██╔══╝  ██╔══██╗██╔══██╗     ║
║         ██║╚██████╔╝     ██║    ███████╗██║  ██║██║  ██║     ║
║         ╚═╝ ╚═════╝      ╚═╝    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝     ║
║                                                              ║
║                    DIRECTORY NOT FOUND                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`}
        </pre>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-terminal-prompt">
            bash: cd: No such file or directory
          </h1>

          <p className="text-terminal-fg/80">
            The path you&apos;re looking for doesn&apos;t exist in this
            portfolio terminal.
          </p>

          <div className="bg-terminal-bg/50 border border-terminal-border rounded-lg p-6 text-left">
            <div className="text-terminal-prompt mb-2">dru@portfolio:~$ ls</div>
            <div className="text-terminal-fg/70 space-y-1">
              <div>📁 artist/ - About me and my journey</div>
              <div>📁 studio/ - Technical skills and tools</div>
              <div>📁 projects/ - Portfolio projects</div>
              <div>📁 gallery/ - Visual showcase</div>
              <div>📁 commissions/ - Available services</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="px-6 py-2 bg-terminal-prompt text-terminal-bg rounded hover:bg-terminal-cursor transition-colors font-medium"
            >
              cd ~
            </Link>

            <Link
              href="/projects"
              className="px-6 py-2 border border-terminal-border text-terminal-fg rounded hover:bg-terminal-fg/10 transition-colors"
            >
              cd projects/
            </Link>

            <Link
              href="/artist"
              className="px-6 py-2 border border-terminal-border text-terminal-fg rounded hover:bg-terminal-fg/10 transition-colors"
            >
              cd artist/
            </Link>
          </div>

          <div className="text-sm text-terminal-fg/60 mt-8">
            <p>💡 Tip: Use the terminal interface to navigate naturally</p>
            <p>Type &quot;help&quot; for available commands</p>
          </div>
        </div>
      </div>
    </div>
  );
}
