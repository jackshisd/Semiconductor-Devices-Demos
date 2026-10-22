import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lab: {
          background: '#ffffff',
          panel: '#f7f9fa',
          blue: '#2672d9',
          orange: '#d56138',
          green: '#14875f',
          purple: '#7654ba',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
