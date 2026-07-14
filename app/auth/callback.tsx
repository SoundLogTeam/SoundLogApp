import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';

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
          title="로그인 연결"
        />

        <View className="mt-10">
          <SectionTitle title="계정 연결 상태" />
          <SettingsRow
            description="현재 앱은 이메일 계정 로그인을 사용합니다. 이전 로그인 링크는 다시 사용할 수 없어요."
            icon="alert-circle"
            label="연결 정보를 확인하지 못했어요"
          />
        </View>

        <AppText className="mt-6 text-sm leading-6 text-white/52">
          로그인 화면에서 이메일과 비밀번호를 입력해 다시 진행해주세요.
        </AppText>

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
