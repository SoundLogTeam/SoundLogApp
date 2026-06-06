import { Pressable } from 'react-native';

import { AppText } from '@/components/AppText';

type ChipProps = {
  label: string;
  size?: 'default' | 'small';
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, onPress, selected = false, size = 'default' }: ChipProps) {
  const isSmall = size === 'small';

  return (
    <Pressable
      className={`justify-center rounded-full border ${
        isSmall ? 'min-h-[28px] px-3' : 'min-h-[38px] px-5'
      } ${
        selected
          ? 'border-soundlog-lime bg-soundlog-selected'
          : 'border-transparent bg-soundlog-chip'
      }`}
      onPress={onPress}
    >
      <AppText
        className={`${isSmall ? 'text-[10px]' : 'text-[13px]'} ${
          selected ? 'font-semibold text-soundlog-inverse' : 'font-medium text-white/90'
        }`}
      >
        {label}
      </AppText>
    </Pressable>
  );
}
