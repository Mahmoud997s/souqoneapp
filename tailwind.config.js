/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#004ac6',
        'primary-2': '#2563eb',
        navy: '#0B2447',
        'navy-light': '#19376D',
        accent: '#E8781E',
        'accent-2': '#F59E4A',
        brand: '#fe5e00',
        success: '#16a34a',
        error: '#dc2626',
        warning: '#d97706',
        surface: '#F5F7FA',
        'surface-dim': '#EBEEF3',
        'on-surface': '#111827',
        'on-surface-variant': '#4B5563',
        outline: '#9CA3AF',
        'outline-variant': '#E2E6EC',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '28px',
      },
      fontFamily: {
        almarai: ['Almarai_400Regular'],
        'almarai-bold': ['Almarai_700Bold'],
        'almarai-extrabold': ['Almarai_800ExtraBold'],
      },
    },
  },
  plugins: [],
}
