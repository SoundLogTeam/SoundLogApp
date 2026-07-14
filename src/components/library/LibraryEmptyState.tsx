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
    <View className="items-center px-5 py-12">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
        <Feather color="rgba(255,255,255,0.52)" name={icon} size={22} />
      </View>
      <AppText className="mt-4 text-center text-base font-semibold text-white">
        {title}
      </AppText>
      <AppText className="mt-2 text-center text-sm leading-6 text-white/46">
        {description}
      </AppText>
    </View>
  );
}
