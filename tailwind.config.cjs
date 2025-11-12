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
        primary: {
          DEFAULT: '#2e4999',
          foreground: '#ffffff'
        },
        secondary: {
          DEFAULT: '#3d61cc',
          foreground: '#ffffff'
        },
        tertiary: {
          DEFAULT: '#1b2a59',
          foreground: '#ffffff'
        },
        // keep a gradient-friendly set (legacy sky mapping retained for any existing classes)
        sky: {
          50: '#f5f8ff',
          100: '#e9effd',
          200: '#d2ddfa',
          300: '#b2c5f5',
          400: '#8aa5ef',
          500: '#6686e4',
          600: '#3d61cc',
          700: '#2e4999',
          800: '#1b2a59',
          900: '#131d40'
        }
      },
      boxShadow: {
        'soft-card': '0 4px 18px -2px rgba(30,55,110,0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out',
        'scale-in': 'scale-in .25s ease-out'
      }
    }
  },
  plugins: [],
}
