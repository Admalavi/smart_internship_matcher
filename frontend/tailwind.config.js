/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { display: ['Fraunces', 'Georgia', 'serif'], sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        paper: '#F8F6F1', ink: { DEFAULT: '#16213A', soft: '#51607A', faint: '#8A94A8' }, line: '#E5E1D8',
        brand: { 50: '#ECFAF6', 100: '#D1F3EA', 500: '#13987F', 600: '#0E7C68', 700: '#0B6354', 900: '#0A3B34' },
        amber: { 50: '#FFF8E8', 500: '#E59A14', 600: '#C27F08' },
        rose: { 50: '#FDF0EF', 500: '#D6453D', 600: '#B93830' },
      },
      boxShadow: { card: '0 1px 2px rgba(22,33,58,.05), 0 4px 14px rgba(22,33,58,.05)' },
    },
  },
  plugins: [],
};
