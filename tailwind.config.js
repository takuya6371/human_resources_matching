/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // "Line" — quiet-luxury outline system (paper.md)
        'paper': '#FAF8F4',
        'ink': '#1C1B18',
        'ink-soft': '#8A8577',
        'ink-faint': '#B7B2A1',
        'hairline': '#E7E2D6',
        'seal': '#A6332B',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['Futura', '"Century Gothic"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
