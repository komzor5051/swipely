/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: '#FF6B6B',
        'coral-dark': '#EE5A6F',
        teal: '#0D3B66',
        'teal-light': '#1A5F7A',
        butter: '#FFD93D',
        charcoal: '#2D3142',
        'warm-white': '#FAF8F6',
        cream: '#F4F1EA',
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
