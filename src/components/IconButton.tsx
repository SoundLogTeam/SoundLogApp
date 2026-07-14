import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';

type IconButtonProps = {
  disabled?: boolean;
  name: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
};

export function IconButton({
  disabled = false,
  label,
  name,
  onPress,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: disabled ? 0.42 : pressed ? 0.64 : 1,
      })}
    >
      <Feather color="#fff" name={name} size={22} />
    </Pressable>
  );
}
