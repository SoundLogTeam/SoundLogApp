import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';

type ScreenProps = PropsWithChildren<{
  contentClassName?: string;
}>;

export function Screen({ children, contentClassName = '' }: ScreenProps) {
  return (
    <View className="flex-1 bg-soundlog-bg">
      <LinearGradient
        colors={colors.background.gradient}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.3, 0.58, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        style={{
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
      <LinearGradient
        colors={colors.background.aurora}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.3, 0.58, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        style={{
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
      <LinearGradient
        colors={[
          'rgba(183,230,40,0)',
          'rgba(183,230,40,0.03)',
          'rgba(183,230,40,0.12)',
          'rgba(135,43,168,0.18)',
          'rgba(5,3,19,0.24)',
          'rgba(5,3,19,0)',
        ]}
        end={{ x: 0, y: 1 }}
        locations={[0, 0.32, 0.54, 0.76, 0.92, 1]}
        start={{ x: 1, y: 0 }}
        style={{
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
      <LinearGradient
        colors={[
          'rgba(215,24,241,0)',
          'rgba(215,24,241,0.08)',
          'rgba(79,42,236,0.16)',
          'rgba(183,230,40,0.08)',
          'rgba(215,24,241,0)',
        ]}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.34, 0.62, 0.82, 1]}
        start={{ x: 0, y: 0 }}
        style={{
          bottom: 0,
          left: -120,
          pointerEvents: 'none',
          position: 'absolute',
          right: -80,
          top: 0,
        }}
      />
      <SafeAreaView className={`flex-1 ${contentClassName}`}>{children}</SafeAreaView>
    </View>
  );
}
