export const colors = {
  brand: {
    pulseMagenta: '#D718F1',
    electricViolet: '#4F2AEC',
    signalPurple: '#872BA8',
    limeWave: '#B7E628',
    deepIndigo: '#3B11C4',
  },
  background: {
    primary: '#050313',
    secondary: '#0A0624',
    deepPurple: '#170738',
    gradient: ['#050313', '#12052F', '#2B0A69', '#14052E', '#050313'],
    aurora: [
      'rgba(215,24,241,0)',
      'rgba(215,24,241,0.24)',
      'rgba(79,42,236,0.18)',
      'rgba(183,230,40,0.08)',
      'rgba(59,17,196,0)',
    ],
  },
  surface: {
    card: '#100828',
    cardElevated: '#170D35',
    chip: '#20104A',
    chipSelected: '#4F2AEC',
    player: '#170738',
    tab: 'rgba(10, 6, 36, 0.94)',
    glass: 'rgba(255,255,255,0.1)',
  },
  border: {
    subtle: 'rgba(255,255,255,0.12)',
    chip: '#5E45B8',
    focus: '#B7E628',
  },
  accent: {
    purple: '#4F2AEC',
    magenta: '#D718F1',
    plum: '#872BA8',
    lime: '#B7E628',
    indigo: '#3B11C4',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#C7BEE8',
    muted: 'rgba(255,255,255,0.58)',
    inverse: '#090515',
  },
} as const;
