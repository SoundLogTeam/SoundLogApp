import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';

type SectionTitleProps = {
  rightContent?: ReactNode;
  title: string;
};

export function SectionTitle({ rightContent, title }: SectionTitleProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <AppText className="min-w-0 flex-1 text-[20px] font-semibold text-soundlog-lime">
        {title}
      </AppText>
      {rightContent ? <View className="shrink-0">{rightContent}</View> : null}
    </View>
  );
}
