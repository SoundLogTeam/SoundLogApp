import { Pressable } from 'react-native';

import { AppText } from '@/components/AppText';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, onPress, selected = false }: ChipProps) {
  return (
    <Pressable
      className={`rounded-full border px-3 py-2 ${
        selected ? 'border-[#7A8CFF] bg-[#243A75]' : 'border-soundlog-border bg-soundlog-chip'
      }`}
      onPress={onPress}
    >
      <AppText className="text-[10px] text-white">{label}</AppText>
    </Pressable>
  );
}
