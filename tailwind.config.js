/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ember: '#f97316',
        lagoon: '#22d3ee',
        mist: '#ecfeff',
      },
      boxShadow: {
        glass: '0 24px 70px rgba(2, 12, 27, 0.35)',
      },
    },
  },
  plugins: [],
}
