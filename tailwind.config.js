/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        soundlog: {
          bg: '#070B1F',
          bg2: '#0B102A',
          card: '#080D18',
          elevated: '#090E1B',
          chip: '#171B2A',
          selected: '#B7E628',
          border: '#364283',
          focus: '#B7E628',
          blue: '#6EA8FF',
          purple: '#7A2CFF',
          gold: '#B1913A',
          lime: '#B7E628',
          player: '#45343D',
          inverse: '#090515',
        },
      },
    },
  },
  plugins: [],
};
