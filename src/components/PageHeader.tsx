import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';

type PageHeaderProps = {
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  title: string;
};

export function PageHeader({ leftContent, rightContent, title }: PageHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      {leftContent ? <View className="shrink-0">{leftContent}</View> : null}
      <AppText className="min-w-0 flex-1 text-[30px] font-semibold leading-9 text-white">
        {title}
      </AppText>
      {rightContent ? <View className="shrink-0">{rightContent}</View> : null}
    </View>
  );
}
