/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f2f9f4',
          100: '#e1f2e6',
          200: '#c5e5ce',
          300: '#9ad3ac',
          400: '#68b983',
          500: '#439d61',
          600: '#327f4d',
          700: '#2a653f',
          800: '#255135',
          900: '#20432d',
          950: '#0d2417',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
