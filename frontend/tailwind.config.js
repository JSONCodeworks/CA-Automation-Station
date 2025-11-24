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
          50: '#0a0e1a',
          100: '#0f1729',
          200: '#1a2332',
          300: '#252f3e',
          400: '#2d3a4d',
          500: '#36465d',
          600: '#3f526e',
          700: '#495e7f',
          800: '#556a90',
          900: '#6276a1',
        },
        accent: {
          DEFAULT: '#00d4ff',
          dark: '#00a8cc',
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
