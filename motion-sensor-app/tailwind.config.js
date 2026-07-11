/** @type {import('tailwindcss').Config} */
module.exports = {
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
        sans: ['Google Sans'],
        'google-sans': ['Google Sans'],
        'google-sans-thin': ['Google Sans Thin'],
        'google-sans-extralight': ['Google Sans ExtraLight'],
        'google-sans-light': ['Google Sans Light'],
        'google-sans-medium': ['Google Sans Medium'],
        'google-sans-semibold': ['Google Sans SemiBold'],
        'google-sans-bold': ['Google Sans Bold'],
        'google-sans-extrabold': ['Google Sans ExtraBold'],
        'google-sans-black': ['Google Sans Black'],
      },
    },
  },
  plugins: [],
};
