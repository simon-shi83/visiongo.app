/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        brand: {
          dark: '#09090b',
          surface: '#121215',
          card: '#18181b',
          border: '#27272a',
          muted: '#71717a',
          light: '#f4f4f5',
          accent: '#10b981', // Emerald indicator
          cyan: '#06b6d4',
          violet: '#8b5cf6',
          amber: '#f59e0b',
        },
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
        'dots-pattern':
          'radial-gradient(circle, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-sm': '24px 24px',
        'dots-sm': '20px 20px',
      },
    },
  },
  plugins: [],
};
