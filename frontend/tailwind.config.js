/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7f3',
          100: '#e5ece0',
          200: '#ccdcb5',
          300: '#aac58c',
          400: '#84aa61',
          500: '#648d42',
          600: '#4e7132',
          700: '#3c5728',
          800: '#324722',
          900: '#2b3c1f',
          950: '#15210d',
        }
      }
    },
  },
  plugins: [],
}
