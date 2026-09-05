import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { MySettingsRow } from '@/components/my/MySettingsRow';
import { SectionTitle } from '@/components/SectionTitle';
import { useAuthStore } from '@/store/authStore';

function getAccountInitial(displayName?: string, email?: string) {
  const source = displayName?.trim() || email?.trim() || 'S';

  return source.slice(0, 1).toUpperCase();
}

export function AuthAccountCard() {
  const { status, user } = useAuthStore();

  const handleLoginPress = () => {
    router.push('/auth/login' as never);
  };

  if (status === 'authenticated' && user) {
    const accountInitial = getAccountInitial(user.displayName, user.email);

    return (
      <View className="mt-7">
        <SectionTitle title="계정 관리" />

        <View className="mt-2 min-h-[60px] flex-row items-center py-2">
          <View className="h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.06]">
            <AppText className="text-xl font-semibold text-white">{accountInitial}</AppText>
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <AppText className="text-lg font-semibold text-white" numberOfLines={1}>
              {user.displayName}
            </AppText>
            <AppText className="mt-1 text-sm text-white/62" numberOfLines={1}>
              {user.email ?? 'Soundlog 계정'}
            </AppText>
          </View>
          <AppText className="ml-3 text-xs font-semibold text-soundlog-lime">로그인됨</AppText>
        </View>
      </View>
    );
  }

  return (
    <View className="mt-7">
      <SectionTitle title="계정 관리" />
      <MySettingsRow
        description="추천, 리캡과 로그를 계정에 안전하게 저장해요."
        icon="log-in"
        label="Soundlog 계정으로 로그인"
        onPress={handleLoginPress}
        rightText="로그인 필요"
      />
    </View>
  );
}
