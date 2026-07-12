import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';

export function RecapEmptyState() {
  return (
    <View className="overflow-hidden rounded-[26px] border border-white/10">
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.12)',
          'rgba(91,45,255,0.16)',
          'rgba(255,255,255,0.06)',
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{ padding: 24 }}
      >
        <View className="h-16 w-16 items-center justify-center rounded-full bg-white/12">
          <Feather color="#fff" name="grid" size={25} />
        </View>
        <AppText className="mt-5 text-[22px] font-semibold leading-7 text-white">
          아직 볼 수 있는 로그가 없어요
        </AppText>
        <AppText className="mt-2 text-sm leading-6 text-white/62">
          여행모드에서 남긴 기록과 공개된 사운드로그가 생기면 이곳에서
          격자로 모아볼 수 있어요.
        </AppText>
      </LinearGradient>
    </View>
  );
}
