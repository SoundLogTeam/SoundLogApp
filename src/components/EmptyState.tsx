import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
};

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <View className="items-center">
      <AppText className="text-center text-[24px] font-semibold text-white">{title}</AppText>
      {description ? (
        <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
          {description}
        </AppText>
      ) : null}
      {action ? (
        <Pressable className="mt-6 rounded-full bg-white px-5 py-3" onPress={action.onPress}>
          <AppText className="font-semibold text-[#050916]">{action.label}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
