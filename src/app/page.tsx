import { Suspense } from 'react';
import TerminalInterface from '@/components/TerminalInterface';

export default function Home() {
  return (
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
        initialDirectory="~"
        welcomeMessage="Welcome to Andrew Garman's Portfolio Terminal"
      />
    </Suspense>
  );
}
