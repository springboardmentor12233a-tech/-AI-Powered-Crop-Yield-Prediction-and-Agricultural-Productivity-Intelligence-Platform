/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F7F8F2',
          100: '#e8f0ea',
          200: '#c6dfcd',
          300: '#A8C957',
          400: '#5BAE65',
          500: '#2E8B57',
          600: '#1F6B45',
          700: '#12372A',
          800: '#0d291e',
          900: '#081a13',
        },
        surface: {
          50: '#F7F8F2',
          100: '#f1f5f9',
          DEFAULT: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 40px -10px rgba(18,55,42,0.08)',
      }
    },
  },
  plugins: [],
}
