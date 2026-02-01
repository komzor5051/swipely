/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A84FF',
        'primary-dark': '#0066CC',
        'primary-light': '#3D9FFF',
        teal: '#1E3A5F',
        'teal-light': '#4A6B8A',
        charcoal: '#1A1A2E',
        'warm-white': '#F8FAFC',
        cream: '#E8F4FC',
      },
      fontFamily: {
        display: ['DM Serif Display', 'serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
