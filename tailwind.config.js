/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#163832',
        'primary-2': '#235347',
        navy: '#0B2B26',
        'navy-light': '#163832',
        accent: '#235347',
        'accent-2': '#8EB69B',
        brand: '#235347',
        success: '#235347',
        error: '#dc2626',
        warning: '#235347',
        surface: '#F4F7F5',
        'surface-dim': '#EBF2ED',
        'on-surface': '#051F20',
        'on-surface-variant': '#235347',
        outline: '#8EB69B',
        'outline-variant': '#D4E5D9',
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
