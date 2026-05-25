import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

export function RecapEmptyState() {
  return (
    <View className="rounded-[22px] border border-white/10 bg-white/10 p-6">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
        <Feather color="#fff" name="camera" size={24} />
      </View>
      <AppText className="mt-5 text-[20px] font-semibold text-white">
        아직 저장한 순간이 없어요
      </AppText>
      <AppText className="mt-2 text-sm leading-6 text-white/60">
        여행 중 마음에 드는 장면을 저장하면 이곳에서 다시 볼 수 있어요.
      </AppText>
      <Pressable
        className="mt-5 self-start rounded-full bg-white px-4 py-3"
        onPress={() => router.push('/camera')}
      >
        <AppText className="text-sm font-semibold text-[#050916]">순간 저장하기</AppText>
      </Pressable>
    </View>
  );
}
