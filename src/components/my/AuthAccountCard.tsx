import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useDeleteAccountMutation, useLogoutMutation } from '@/api/authQueries';
import { AppText } from '@/components/AppText';
import { MySettingsRow } from '@/components/my/MySettingsRow';
import { SectionTitle } from '@/components/SectionTitle';
import { useAuthStore } from '@/store/authStore';
import { clearAccountSession } from '@/utils/accountSession';
import { migrateLocalDataToAccount } from '@/utils/localDataMigration';

function getAccountInitial(displayName?: string, email?: string) {
  const source = displayName?.trim() || email?.trim() || 'S';

  return source.slice(0, 1).toUpperCase();
}

export function AuthAccountCard() {
  const [isMigratingLocalData, setIsMigratingLocalData] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string>();
  const deleteAccountMutation = useDeleteAccountMutation();
  const logoutMutation = useLogoutMutation();
  const { refreshToken, status, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync(refreshToken);
    } finally {
      clearAccountSession();
      router.replace('/auth/login' as never);
    }
  };

  const handleMigrate = async () => {
    setMigrationMessage(undefined);
    setIsMigratingLocalData(true);

    try {
      const result = await migrateLocalDataToAccount();
      const failedCount =
        result.momentLogFailedCount + result.libraryFailedCount;

      setMigrationMessage(
        failedCount > 0
          ? `리캡 ${result.momentLogSyncedCount}/${result.summary.momentLogCount}개, 보관함 ${result.librarySyncedCount}/${result.summary.libraryTrackCount}개를 동기화했어요. 실패한 항목은 다시 시도할 수 있어요.`
          : `리캡 ${result.summary.momentLogCount}개, 보관함 ${result.summary.libraryTrackCount}개를 서버 동기화에 반영했어요.`,
      );
    } catch {
      setMigrationMessage(
        '동기화 요청에 실패했어요. 네트워크 상태를 확인해주세요.',
      );
    } finally {
      setIsMigratingLocalData(false);
    }
  };

  const handleLoginPress = () => {
    router.push('/auth/login' as never);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Soundlog 계정을 삭제할까요?',
      '계정과 서버에 저장된 여행 기록, 리캡, 보관함 데이터가 즉시 삭제됩니다. 이 작업은 되돌릴 수 없어요.',
      [
        { style: 'cancel', text: '취소' },
        {
          onPress: () => {
            setMigrationMessage(undefined);
            void deleteAccountMutation
              .mutateAsync()
              .then(() => {
                clearAccountSession();
                router.replace('/auth/login' as never);
              })
              .catch(() => {
                setMigrationMessage(
                  '계정을 삭제하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해주세요.',
                );
              });
          },
          style: 'destructive',
          text: '계정 삭제',
        },
      ],
    );
  };

  if (status === 'authenticated' && user) {
    const accountInitial = getAccountInitial(user.displayName, user.email);

    return (
      <View className="mt-7">
        <SectionTitle title="계정 관리" />

        <View className="mt-2 min-h-[60px] flex-row items-center py-2">
          <View className="h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-white/[0.06]">
            <AppText className="text-xl font-semibold text-white">
              {accountInitial}
            </AppText>
          </View>
          <View className="ml-3 min-w-0 flex-1">
            <AppText
              className="text-lg font-semibold text-white"
              numberOfLines={1}
            >
              {user.displayName}
            </AppText>
            <AppText className="mt-1 text-sm text-white/45" numberOfLines={1}>
              {user.email ?? 'Soundlog 계정'}
            </AppText>
          </View>
          <AppText className="ml-3 text-xs font-semibold text-soundlog-lime">
            로그인됨
          </AppText>
        </View>

        <MySettingsRow
          disabled={isMigratingLocalData || deleteAccountMutation.isPending}
          icon="refresh-cw"
          label="로컬 기록 동기화"
          onPress={() => void handleMigrate()}
          rightText={isMigratingLocalData ? '동기화 중' : undefined}
        />
        <MySettingsRow
          disabled={logoutMutation.isPending || deleteAccountMutation.isPending}
          icon="log-out"
          label="로그아웃"
          onPress={() => void handleLogout()}
          rightText={logoutMutation.isPending ? '정리 중' : undefined}
        />
        <MySettingsRow
          disabled={deleteAccountMutation.isPending || logoutMutation.isPending}
          icon="trash-2"
          label="계정 삭제"
          onPress={handleDeleteAccount}
          rightText={deleteAccountMutation.isPending ? '삭제 중' : undefined}
          tone="danger"
        />

        {migrationMessage ? (
          <AppText className="ml-12 mt-1 text-xs leading-5 text-soundlog-lime/70">
            {migrationMessage}
          </AppText>
        ) : null}
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
