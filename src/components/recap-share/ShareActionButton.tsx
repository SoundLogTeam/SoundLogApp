import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

export type ShareActionId = 'save' | 'share';

type ShareActionButtonProps = {
  backgroundColor: string;
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  isActive?: boolean;
  label: string;
  loadingLabel: string;
  onPress: () => void;
  textColor: string;
};

export function ShareActionButton({
  backgroundColor,
  disabled = false,
  icon,
  iconColor,
  isActive = false,
  label,
  loadingLabel,
  onPress,
  textColor,
}: ShareActionButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`${label} 실행`}
      accessibilityRole="button"
      className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-full px-4"
      disabled={disabled}
      onPress={onPress}
      style={{
        backgroundColor,
        opacity: disabled && !isActive ? 0.45 : 1,
      }}
    >
      <View className="h-8 w-8 items-center justify-center rounded-full bg-black/10">
        <Feather color={iconColor} name={icon} size={17} />
      </View>
      <AppText
        className="min-w-0 text-center text-sm font-semibold"
        numberOfLines={1}
        style={{ color: textColor }}
      >
        {isActive ? loadingLabel : label}
      </AppText>
    </Pressable>
  );
}
