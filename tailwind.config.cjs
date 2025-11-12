/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Map the existing 'sky' palette to project colors so existing classes work
        sky: {
          50: '#eef2ff',
          600: '#3d61cc', // secondary
          700: '#2e4999', // primary
          800: '#1b2a59', // tertiary (darkest)
        },
      },
    },
  },
  plugins: [],
}
