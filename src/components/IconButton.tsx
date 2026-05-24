import { Feather } from '@expo/vector-icons';
import { Pressable } from 'react-native';

type IconButtonProps = {
  name: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
};

export function IconButton({ label, name, onPress }: IconButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
      onPress={onPress}
    >
      <Feather color="#fff" name={name} size={22} />
    </Pressable>
  );
}
