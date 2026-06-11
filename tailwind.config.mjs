/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        carbon: '#0a0a0a',
        'carbon-2': '#14110f',
        'carbon-3': '#1d1916',
        sangre: '#8b0000',
        'sangre-viva': '#c1121f',
        amarillo: '#c8a951',
        'amarillo-luz': '#e7c95c',
        hueso: '#e8e2d0',
        'hueso-2': '#b8b09a',
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'Haettenschweiler', 'sans-serif'],
        cond: ['Oswald', 'Arial Narrow', 'sans-serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        brutal: '0.02em',
        ancho: '0.18em',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        tileIn: {
          '0%': { opacity: '0', transform: 'scale(0.4)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '42%': { opacity: '1' },
          '43%': { opacity: '0.45' },
          '45%': { opacity: '1' },
          '62%': { opacity: '0.7' },
          '64%': { opacity: '1' },
        },
        slowpulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-1.2deg)' },
          '50%': { transform: 'rotate(1.2deg)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.6s cubic-bezier(0.2,0.8,0.2,1) both',
        tileIn: 'tileIn 0.45s ease both',
        flicker: 'flicker 6s infinite',
        slowpulse: 'slowpulse 3.5s ease-in-out infinite',
        sway: 'sway 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
