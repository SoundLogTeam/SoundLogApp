import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';

export default function AuthCallbackScreen() {
  return (
    <Screen>
      <View className="flex-1 px-6 pb-10 pt-10">
        <PageHeader
          leftContent={
            <IconButton
              label="로그인으로 돌아가기"
              name="arrow-left"
              onPress={() => router.replace('/auth/login' as never)}
            />
          }
          title="로그인"
        />

        <View className="mt-24 items-center px-5">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Feather color="#FFFFFF" name="alert-circle" size={28} />
          </View>
          <AppText className="mt-6 text-center text-2xl font-semibold text-white">
            로그인을 완료하지 못했어요
          </AppText>
          <AppText className="mt-3 text-center text-sm leading-6 text-white/65">
            로그인 정보가 만료되었거나 올바르지 않습니다.{`\n`}이메일과
            비밀번호를 다시 확인해주세요.
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          className="mt-auto h-14 items-center justify-center rounded-xl bg-soundlog-lime"
          onPress={() => router.replace('/auth/login' as never)}
        >
          <AppText className="text-sm font-semibold text-soundlog-inverse">
            로그인으로 돌아가기
          </AppText>
        </Pressable>
      </View>
    </Screen>
  );
}
