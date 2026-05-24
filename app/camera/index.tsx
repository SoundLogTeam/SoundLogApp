import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';

export default function CameraScreen() {
  return (
    <Screen contentClassName="items-center justify-center px-8">
      <View className="h-24 w-24 rounded-full border border-white/20 bg-white/10" />
      <AppText className="mt-8 text-center text-[24px] font-semibold text-white">
        순간 저장
      </AppText>
      <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
        카메라 권한과 위치/음악 컨텍스트는 다음 기능 설계 후 연결합니다.
      </AppText>
      <Pressable className="mt-8 rounded-full bg-white px-5 py-3" onPress={() => router.back()}>
        <AppText className="font-semibold text-[#050916]">돌아가기</AppText>
      </Pressable>
    </Screen>
  );
}
