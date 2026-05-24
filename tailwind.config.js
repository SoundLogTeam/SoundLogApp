/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        soundlog: {
          bg: '#050916',
          card: '#080D18',
          chip: '#0E1E3A',
          border: '#364283',
          purple: '#7A2CFF',
          gold: '#B1913A',
          player: '#45343D',
        },
      },
    },
  },
  plugins: [],
};
