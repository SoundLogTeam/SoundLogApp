import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  contentClassName?: string;
}>;

export function Screen({ children, contentClassName = '' }: ScreenProps) {
  return (
    <View className="flex-1 bg-soundlog-bg">
      <SafeAreaView className={`flex-1 ${contentClassName}`}>{children}</SafeAreaView>
    </View>
  );
}
