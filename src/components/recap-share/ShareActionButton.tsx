import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

export type ShareActionId = 'save' | 'share';

type ShareActionButtonProps = {
  color: string;
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  isActive?: boolean;
  label: string;
  onPress: () => void;
};

export function ShareActionButton({
  color,
  disabled = false,
  icon,
  isActive = false,
  label,
  onPress,
}: ShareActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`${label} 실행`}
      accessibilityRole="button"
      className="w-[72px] items-center gap-2"
      disabled={disabled}
      onPress={onPress}
      style={{ opacity: disabled && !isActive ? 0.45 : 1 }}
    >
      <View
        className="h-[54px] w-[54px] items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <Feather color="#fff" name={icon} size={24} />
      </View>
      <AppText className="text-center text-xs text-white" numberOfLines={1}>
        {isActive ? 'Working' : label}
      </AppText>
    </Pressable>
  );
}
