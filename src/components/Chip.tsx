import { LinearGradient } from 'expo-linear-gradient';
import { Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors } from '@/constants/colors';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

const chipTones = [
  {
    active: [colors.brand.pulseMagenta, colors.brand.electricViolet],
    border: 'rgba(215,24,241,0.72)',
    inactive: ['rgba(215,24,241,0.32)', 'rgba(135,43,168,0.22)'],
    text: '#FDE7FF',
  },
  {
    active: [colors.brand.electricViolet, colors.brand.deepIndigo],
    border: 'rgba(79,42,236,0.76)',
    inactive: ['rgba(79,42,236,0.34)', 'rgba(59,17,196,0.24)'],
    text: '#ECE7FF',
  },
  {
    active: [colors.brand.signalPurple, colors.brand.pulseMagenta],
    border: 'rgba(135,43,168,0.76)',
    inactive: ['rgba(135,43,168,0.34)', 'rgba(215,24,241,0.2)'],
    text: '#F7E6FF',
  },
  {
    active: [colors.brand.limeWave, '#D9FF5A'],
    border: 'rgba(183,230,40,0.8)',
    inactive: ['rgba(183,230,40,0.28)', 'rgba(79,42,236,0.16)'],
    text: '#F5FFD0',
  },
  {
    active: [colors.brand.deepIndigo, colors.brand.electricViolet],
    border: 'rgba(59,17,196,0.82)',
    inactive: ['rgba(59,17,196,0.36)', 'rgba(79,42,236,0.2)'],
    text: '#E8E2FF',
  },
] as const;

function getChipTone(label: string) {
  const seed = label.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) % 997;
  }, 0);

  return chipTones[seed % chipTones.length];
}

export function Chip({ label, onPress, selected = false }: ChipProps) {
  const tone = getChipTone(label);
  const gradientColors = selected ? tone.active : tone.inactive;

  return (
    <Pressable
      className="overflow-hidden rounded-full border"
      onPress={onPress}
      style={{
        borderColor: selected ? colors.border.focus : tone.border,
        shadowColor: selected ? colors.accent.lime : colors.accent.purple,
        shadowOffset: { height: 3, width: 0 },
        shadowOpacity: selected ? 0.28 : 0.14,
        shadowRadius: selected ? 9 : 5,
      }}
    >
      <LinearGradient
        colors={gradientColors}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          minHeight: 32,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <AppText
          className="text-[10px] font-semibold"
          style={{ color: selected && tone.active[0] === colors.brand.limeWave ? colors.text.inverse : tone.text }}
        >
          {label}
        </AppText>
      </LinearGradient>
    </Pressable>
  );
}
