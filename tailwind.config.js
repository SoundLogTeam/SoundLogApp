/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        soundlog: {
          bg: '#050313',
          bg2: '#0A0624',
          card: '#100828',
          elevated: '#170D35',
          chip: '#20104A',
          selected: '#4F2AEC',
          border: '#5E45B8',
          focus: '#B7E628',
          magenta: '#D718F1',
          purple: '#4F2AEC',
          plum: '#872BA8',
          lime: '#B7E628',
          indigo: '#3B11C4',
          player: '#170738',
          inverse: '#090515',
        },
      },
    },
  },
  plugins: [],
};
