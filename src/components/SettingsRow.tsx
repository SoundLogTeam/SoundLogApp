import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type SettingsRowProps = {
  accessibilityLabel?: string;
  description?: string;
  disabled?: boolean;
  icon: FeatherIconName;
  label: string;
  onPress?: () => void;
  rightContent?: ReactNode;
  rightText?: string;
  tone?: 'danger' | 'default';
};

export function SettingsRow({
  accessibilityLabel,
  description,
  disabled = false,
  icon,
  label,
  onPress,
  rightContent,
  rightText,
  tone = 'default',
}: SettingsRowProps) {
  const content = (
    <>
      <View className="w-9 items-center justify-center">
        <Feather
          color={tone === 'danger' ? '#FF8F8F' : 'rgba(255,255,255,0.5)'}
          name={icon}
          size={20}
        />
      </View>
      <View className="ml-3 min-w-0 flex-1">
        <AppText
          className="text-[15px] font-medium"
          numberOfLines={1}
          style={{
            color: tone === 'danger' ? '#FF9D9D' : 'rgba(255,255,255,0.88)',
          }}
        >
          {label}
        </AppText>
        {description ? (
          <AppText
            className="mt-1 text-xs leading-5 text-white/42"
            numberOfLines={2}
          >
            {description}
          </AppText>
        ) : null}
      </View>
      {rightContent ? (
        <View className="ml-3 shrink-0">{rightContent}</View>
      ) : null}
      {rightText ? (
        <AppText
          className="ml-3 max-w-[44%] text-right text-sm text-white/46"
          numberOfLines={1}
        >
          {rightText}
        </AppText>
      ) : null}
      {onPress ? (
        <Feather
          color="rgba(255,255,255,0.34)"
          name="chevron-right"
          size={18}
          style={{ marginLeft: 8 }}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View className="min-h-[52px] flex-row items-center py-2">{content}</View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className="min-h-[52px] flex-row items-center py-2"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.62 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}
