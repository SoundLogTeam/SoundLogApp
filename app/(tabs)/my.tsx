import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';

export default function MyScreen() {
  return (
    <Screen contentClassName="px-5 pt-8">
      <AppText className="text-[26px] font-semibold text-white">My</AppText>
      <View className="mt-6 gap-3">
        {['음악 플랫폼 연동', '취향 정보 수정', '위치/카메라 권한', '로그아웃'].map((label) => (
          <View key={label} className="rounded-[16px] bg-white/10 px-5 py-4">
            <AppText className="text-base font-medium text-white">{label}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}
