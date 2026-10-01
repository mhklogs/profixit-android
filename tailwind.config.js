/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF9F7',
        surface: '#FFFFFF',
        brand: {
          DEFAULT: '#F04E23',
          soft: '#FDEBE4',
          dark: '#C93A12',
          light: '#FF8A63',
        },
        ink: {
          DEFAULT: '#1C1917',
          muted: '#6B7280',
          light: '#9CA3AF',
        },
      },
    },
  },
  plugins: [],
};