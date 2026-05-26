import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';

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
          <Feather color="#fff" name="camera" size={25} />
        </View>
        <AppText className="mt-5 text-[22px] font-semibold leading-7 text-white">
          아직 저장한 여행 앨범이 없어요
        </AppText>
        <AppText className="mt-2 text-sm leading-6 text-white/62">
          카메라 버튼으로 장소와 음악을 함께 저장하면, 여행이 끝난 뒤 Recap
          앨범으로 다시 볼 수 있어요.
        </AppText>
        <Pressable
          accessibilityRole="button"
          className="mt-6 self-start rounded-full bg-white px-5 py-3"
          onPress={() => router.push('/camera')}
        >
          <AppText className="text-sm font-semibold text-[#050916]">
            첫 순간 저장하기
          </AppText>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
