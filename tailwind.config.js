/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#009CB5',
        'primary-2': '#009CB5',
        navy: '#192435',
        'navy-light': '#009CB5',
        accent: '#009CB5',
        'accent-2': '#ECF8FA',
        brand: '#009CB5',
        success: '#009CB5',
        error: '#dc2626',
        warning: '#f59e0b',
        surface: '#FFFFFF',
        'surface-dim': '#F7F8FA',
        'on-surface': '#11232E',
        'on-surface-variant': '#11232E',
        outline: '#E5E7EB',
        'outline-variant': '#E5E7EB',
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
