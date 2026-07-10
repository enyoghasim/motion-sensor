/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        accent: { hover: '#3b82f6' },
        default: { hover: '#e4e4e7' },
        danger: { hover: '#ef4444', soft: { hover: '#fee2e2' } },
      },
      fontFamily: {
        display: ['Spline Sans', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        rounded: ['SF Pro Rounded', 'Hiragino Maru Gothic ProN', 'Meiryo', 'MS PGothic', 'sans-serif'],
        serif: ['Georgia', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
};
