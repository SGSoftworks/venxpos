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
          50: '#f5f0ff',
          100: '#e8ddff',
          200: '#d0baff',
          300: '#b088ff',
          400: '#8b5cf6',
          500: '#7a40f0',
          600: '#6D3CF5',
          700: '#5B2EE0',
          800: '#4A1FC4',
          900: '#3A0FA0',
        },
        accent: {
          50: '#e6faf8',
          100: '#b3f2ed',
          200: '#80e9e1',
          500: '#16D6C1',
          600: '#12C0AE',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
        },
      },
    },
  },
  plugins: [],
}
