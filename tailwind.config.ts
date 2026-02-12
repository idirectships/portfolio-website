import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: 'var(--terminal-bg)',
          fg: 'var(--terminal-fg)',
          border: 'var(--terminal-border)',
          prompt: 'var(--terminal-prompt)',
          success: 'var(--terminal-success)',
          error: 'var(--terminal-error)',
          warning: 'var(--terminal-warning)',
          cursor: 'var(--terminal-cursor)',
          selection: 'var(--terminal-selection)',
          accent: 'var(--terminal-prompt)', // Add accent color for consistency
        },
        syntax: {
          keyword: 'var(--syntax-keyword)',
          string: 'var(--syntax-string)',
          number: 'var(--syntax-number)',
          comment: 'var(--syntax-comment)',
          function: 'var(--syntax-function)',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      animation: {
        blink: 'blink 1s infinite',
      },
      screens: {
        xs: '480px',
        touch: { raw: '(hover: none) and (pointer: coarse)' },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [],
};
export default config;
