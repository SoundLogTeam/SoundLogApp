import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  contentClassName?: string;
}>;

export function Screen({ children, contentClassName = '' }: ScreenProps) {
  return (
    <View className="flex-1 bg-soundlog-bg">
      <LinearGradient
        colors={['#050916', '#090E1B', '#160F27']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      />
      <SafeAreaView className={`flex-1 ${contentClassName}`}>{children}</SafeAreaView>
    </View>
  );
}
