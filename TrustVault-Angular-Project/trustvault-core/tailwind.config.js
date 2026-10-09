/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--ui-font, "Space Grotesk")', '"Noto Sans Telugu Variable"', '"Noto Sans Devanagari Variable"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Noto Sans Telugu Variable"', '"Noto Sans Devanagari Variable"', 'monospace'],
      },
      colors: {
        brand: { 50: '#ecfeff', 100: '#cffafe', 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 900: '#164e63' },
        cyber: { bg: '#02040a', panel: 'rgba(10, 15, 30, 0.6)', accent: '#00f0ff', danger: '#ff003c', purple: '#b535f6' },
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        scanline: 'scanline 4s linear infinite',
        laser: 'laser 2s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite',
        glitch: 'glitch 0.2s linear infinite',
        'fade-in-up': 'fadeInUp 0.15s ease-out forwards',
      },
      keyframes: {
        scanline: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
        laser: { '0%': { top: '0%' }, '100%': { top: '100%' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        fadeInUp: { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        glitch: {
          '0%': { transform: 'translate(0)' }, '20%': { transform: 'translate(-2px, 1px)' },
          '40%': { transform: 'translate(-1px, -1px)' }, '60%': { transform: 'translate(2px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' }, '100%': { transform: 'translate(0)' },
        },
      },
    },
  },
  plugins: [],
};
