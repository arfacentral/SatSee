/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tactical: {
          dark: '#070b12',
          surface: '#0d1522',
          panel: '#131e30',
          border: '#1f334d',
          cyan: '#00e5ff',
          emerald: '#00ffaa',
          amber: '#ffb300',
          red: '#ff3366',
          muted: '#5a718c',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
