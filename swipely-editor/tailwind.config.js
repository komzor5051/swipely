/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: '#D4F542',
        'primary-dark': '#B8D928',
        'primary-light': '#E8FF6E',
        ink: '#0D0D14',
        charcoal: '#1A1A2E',
        'warm-white': '#FAFAF9',
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
