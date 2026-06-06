import { Track } from '@/types/domain';

const fallbackPalette = [
  '#D718F1',
  '#4F2AEC',
  '#872BA8',
  '#B7E628',
  '#3B11C4',
  '#170D35',
];

function hashString(value: string) {
  return value.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 997;
  }, 0);
}

function normalizeHexColor(color?: string) {
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return undefined;
  }

  return color;
}

export function getTrackKeyColor(track?: Track) {
  const keyColor = normalizeHexColor(track?.fallbackColor);

  if (keyColor) {
    return keyColor;
  }

  const seed = `${track?.id ?? ''}${track?.title ?? ''}${track?.artist ?? ''}`;
  return fallbackPalette[hashString(seed) % fallbackPalette.length];
}

export function hexToRgba(hex: string, alpha: number) {
  const normalized = normalizeHexColor(hex) ?? fallbackPalette[0];
  const red = parseInt(normalized.slice(1, 3), 16);
  const green = parseInt(normalized.slice(3, 5), 16);
  const blue = parseInt(normalized.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
