/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 50:'#1a1612', 100:'#0f0d0a', 200:'#2a2118', 300:'#221e18', 400:'#342b20' },
        gold: { DEFAULT:'#d4a848', dim:'#a8843a', bright:'#e8c468', glow:'rgba(212,168,72,0.15)' },
        parchment: { DEFAULT:'#e8dcc8', dim:'#c4b8a4', faint:'#8a7e6c' },
      },
      fontFamily: {
        serif: ['"Crimson Pro"', 'Georgia', 'serif'],
        arabic: ['"Amiri"', '"Noto Naskh Arabic"', 'serif'],
      },
      keyframes: {
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(200%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
