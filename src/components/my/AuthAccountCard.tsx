import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, Linking, Pressable, View } from 'react-native';

import { useLogoutMutation } from '@/api/authQueries';
import { AppText } from '@/components/AppText';
import { SOUNDLOG_SUPPORT_EMAIL } from '@/constants/legal';
import { useAuthStore } from '@/store/authStore';
import { migrateLocalDataToAccount } from '@/utils/localDataMigration';

function openAccountDeletionEmail(userId?: string, email?: string) {
  const subject = encodeURIComponent('Soundlog 계정 삭제 요청');
  const body = encodeURIComponent(
    [
      'Soundlog 계정 삭제를 요청합니다.',
      '',
      `계정 ID: ${userId ?? '확인 필요'}`,
      `계정 이메일: ${email ?? '확인 필요'}`,
      '',
      '삭제 요청 처리에 필요한 추가 확인 절차가 있다면 안내해주세요.',
    ].join('\n'),
  );

  return Linking.openURL(`mailto:${SOUNDLOG_SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
}

function getAccountInitial(displayName?: string, email?: string) {
  const source = displayName?.trim() || email?.trim() || 'S';

  return source.slice(0, 1).toUpperCase();
}

export function AuthAccountCard() {
  const [isMigratingLocalData, setIsMigratingLocalData] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string>();
  const logoutMutation = useLogoutMutation();
  const { logoutLocal, refreshToken, status, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync(refreshToken);
    } finally {
      logoutLocal();
      router.replace('/auth/login' as never);
    }
  };

  const handleMigrate = async () => {
    setMigrationMessage(undefined);
    setIsMigratingLocalData(true);

    try {
      const result = await migrateLocalDataToAccount();
      const failedCount = result.momentLogFailedCount + result.libraryFailedCount;

      setMigrationMessage(
        failedCount > 0
          ? `리캡 ${result.momentLogSyncedCount}/${result.summary.momentLogCount}개, 보관함 ${result.librarySyncedCount}/${result.summary.libraryTrackCount}개를 동기화했어요. 실패한 항목은 다시 시도할 수 있어요.`
          : `리캡 ${result.summary.momentLogCount}개, 보관함 ${result.summary.libraryTrackCount}개를 서버 동기화에 반영했어요.`,
      );
    } catch {
      setMigrationMessage('동기화 요청에 실패했어요. 네트워크 상태를 확인해주세요.');
    } finally {
      setIsMigratingLocalData(false);
    }
  };

  const handleLoginPress = () => {
    router.push('/auth/login' as never);
  };

  const handleDeleteAccountRequest = () => {
    Alert.alert(
      '계정 삭제 요청',
      '요청을 보내면 계정과 서버에 동기화된 여행 기록 삭제 절차를 안내받게 됩니다.',
      [
        { style: 'cancel', text: '취소' },
        {
          onPress: () => {
            void openAccountDeletionEmail(user?.id, user?.email).catch(() => {
              setMigrationMessage(
                `메일 앱을 열지 못했어요. ${SOUNDLOG_SUPPORT_EMAIL} 으로 계정 삭제를 요청해주세요.`,
              );
            });
          },
          style: 'destructive',
          text: '요청 메일 작성',
        },
      ],
    );
  };

  if (status === 'authenticated' && user) {
    const accountInitial = getAccountInitial(user.displayName, user.email);

    return (
      <View className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06]">
        <LinearGradient
          colors={[
            'rgba(191,255,36,0.14)',
            'rgba(91,45,255,0.12)',
            'rgba(255,255,255,0.04)',
          ]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{ padding: 20 }}
        >
          <View className="flex-row items-center gap-4">
            <View className="relative">
              <LinearGradient
                colors={['#C7FF2E', '#46D8A6', '#5B2DFF']}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={{
                  alignItems: 'center',
                  borderRadius: 28,
                  height: 72,
                  justifyContent: 'center',
                  width: 72,
                }}
              >
                <View className="h-[64px] w-[64px] items-center justify-center rounded-[24px] bg-[#07110D]">
                  <AppText className="text-[28px] font-semibold text-white">
                    {accountInitial}
                  </AppText>
                </View>
              </LinearGradient>
              <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full border-2 border-[#10141E] bg-soundlog-lime">
                <Feather color="#050916" name="check" size={15} />
              </View>
            </View>
            <View className="min-w-0 flex-1">
              <View className="self-start rounded-full bg-soundlog-lime/20 px-3 py-1">
                <AppText className="text-[11px] font-semibold text-soundlog-lime">
                  로그인됨
                </AppText>
              </View>
              <AppText className="mt-3 text-[24px] font-semibold text-white" numberOfLines={1}>
                {user.displayName}
              </AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/50" numberOfLines={1}>
                Soundlog 계정{user.email ? ` · ${user.email}` : ''}
              </AppText>
            </View>
          </View>

          <View className="mt-6 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              className="min-h-11 flex-1 items-center justify-center rounded-full bg-soundlog-lime px-4"
              disabled={isMigratingLocalData}
              onPress={handleMigrate}
            >
              <AppText className="text-xs font-semibold text-soundlog-inverse">
                {isMigratingLocalData ? '동기화 중' : '로컬 기록 동기화'}
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4"
              disabled={logoutMutation.isPending}
              onPress={handleLogout}
            >
              <AppText className="text-xs font-semibold text-white/70">
                {logoutMutation.isPending ? '정리 중' : '로그아웃'}
              </AppText>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            className="mt-3 min-h-11 items-center justify-center rounded-full border border-[#FF6B6B]/30 bg-[#FF6B6B]/5 px-4"
            onPress={handleDeleteAccountRequest}
          >
            <AppText className="text-xs font-semibold text-[#FFB3B3]">
              계정 삭제 요청
            </AppText>
          </Pressable>

          {migrationMessage ? (
            <AppText className="mt-3 text-xs leading-5 text-soundlog-lime/70">
              {migrationMessage}
            </AppText>
          ) : null}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="mt-5 rounded-[22px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#fff" name="log-in" size={19} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-sm font-semibold text-white/45">계정</AppText>
          <AppText className="mt-2 text-[20px] font-semibold text-white">
            로그인이 필요해요
          </AppText>
          <AppText className="mt-2 text-xs leading-5 text-white/50">
            Soundlog의 추천, 리캡, 로그는 계정에 저장된 상태로 사용할 수 있어요.
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        className="mt-5 min-h-11 items-center justify-center rounded-full bg-white px-4"
        onPress={handleLoginPress}
      >
        <AppText className="text-xs font-semibold text-[#05070C]">
          Soundlog 계정으로 로그인
        </AppText>
      </Pressable>
    </View>
  );
}
