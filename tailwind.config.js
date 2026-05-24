/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'a-orange': '#D85A30',
        'a-orange-dark': '#BA7517',
        'a-green': '#1D9E75',
        'a-green-dark': '#0F6E56',
        'a-purple': '#534AB7',
        'dark': '#0A0A0A',
        'dark-2': '#141414',
        'dark-3': '#1C1C1C',
        'dark-4': '#242424',
        'border': 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #0A0A0A 0%, #141414 100%)',
        'orange-gradient': 'linear-gradient(135deg, #D85A30 0%, #BA7517 100%)',
        'green-gradient': 'linear-gradient(135deg, #1D9E75 0%, #639922 100%)',
      },
    },
  },
  plugins: [],
}
