/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        pixel: ['"Pixelify Sans"', 'monospace'],
      },
      boxShadow: {
        pixel: '5px 5px 0 #202020',
        soft: '0 18px 45px rgba(23, 31, 37, .12)',
      },
    },
  },
  plugins: [],
};
