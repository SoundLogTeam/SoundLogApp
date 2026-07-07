export const colors = {
  brand: {
    limeWave: '#B7E628',
  },
  background: {
    primary: '#070B1F',
    secondary: '#0B102A',
    deepPurple: '#170738',
    gradient: ['#070B1F', '#070B1F', '#070B1F', '#070B1F', '#070B1F'],
    aurora: [
      'rgba(7,11,31,0)',
      'rgba(7,11,31,0)',
      'rgba(7,11,31,0)',
      'rgba(7,11,31,0)',
      'rgba(7,11,31,0)',
    ],
  },
  surface: {
    card: '#080D18',
    cardElevated: '#090E1B',
    chip: '#171B2A',
    chipSelected: '#B7E628',
    player: '#45343D',
    tab: 'rgba(10, 16, 30, 0.58)',
    glass: 'rgba(255,255,255,0.1)',
  },
  border: {
    subtle: 'rgba(255,255,255,0.12)',
    chip: '#364283',
    focus: '#B7E628',
  },
  accent: {
    blue: '#6EA8FF',
    purple: '#7A2CFF',
    gold: '#B1913A',
    lime: '#B7E628',
    warning: '#FF8A3D',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#ACACAC',
    muted: 'rgba(255,255,255,0.58)',
    inverse: '#090515',
  },
} as const;
