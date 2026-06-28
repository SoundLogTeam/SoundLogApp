import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';

export default function AuthCallbackScreen() {
  return (
    <Screen contentClassName="items-center justify-center px-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-white/10">
        <Feather color="#7CFF8A" name="check-circle" size={28} />
      </View>
      <AppText className="mt-6 text-center text-2xl font-semibold text-white">
        로그인 연결을 확인 중이에요
      </AppText>
      <AppText className="mt-3 text-center text-sm leading-6 text-white/55">
        계정 연결 결과를 확인하고 있어요. 잠시만 기다려주세요.
      </AppText>
      <Pressable
        accessibilityRole="button"
        className="mt-8 rounded-full border border-white/10 px-5 py-3"
        onPress={() => router.replace('/auth/login' as never)}
      >
        <AppText className="text-sm font-semibold text-white/70">로그인으로 돌아가기</AppText>
      </Pressable>
    </Screen>
  );
}
