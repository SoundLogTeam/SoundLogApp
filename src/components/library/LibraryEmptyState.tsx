import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';

type LibraryEmptyStateProps = {
  description: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
};

export function LibraryEmptyState({ description, icon, title }: LibraryEmptyStateProps) {
  return (
    <View className="rounded-[22px] border border-white/10 bg-white/10 p-6">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
        <Feather color="#fff" name={icon} size={24} />
      </View>
      <AppText className="mt-5 text-[20px] font-semibold text-white">{title}</AppText>
      <AppText className="mt-2 text-sm leading-6 text-white/60">{description}</AppText>
    </View>
  );
}
