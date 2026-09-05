import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { useDeleteAccountMutation, useLogoutMutation } from '@/api/authQueries';
import { AppText } from '@/components/AppText';
import { MySettingsRow } from '@/components/my/MySettingsRow';
import { SectionTitle } from '@/components/SectionTitle';
import { useAuthStore } from '@/store/authStore';
import { clearAccountSession } from '@/utils/accountSession';

export function AccountActionsSection() {
  const [accountMessage, setAccountMessage] = useState<string>();
  const deleteAccountMutation = useDeleteAccountMutation();
  const logoutMutation = useLogoutMutation();
  const { refreshToken, status } = useAuthStore();

  if (status !== 'authenticated') {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync(refreshToken);
    } finally {
      clearAccountSession();
      router.replace('/auth/login' as never);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      '로그아웃할까요?',
      '이 기기에서 Soundlog 계정 연결을 종료합니다. 저장된 리캡과 로그는 삭제되지 않아요.',
      [
        { style: 'cancel', text: '취소' },
        {
          onPress: () => void handleLogout(),
          text: '로그아웃',
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Soundlog 계정을 삭제할까요?',
      '계정과 서버에 저장된 여행 기록, 리캡, 보관함 데이터가 즉시 삭제됩니다. 이 작업은 되돌릴 수 없어요.',
      [
        { style: 'cancel', text: '취소' },
        {
          onPress: () => {
            setAccountMessage(undefined);
            void deleteAccountMutation
              .mutateAsync()
              .then(() => {
                clearAccountSession();
                router.replace('/auth/login' as never);
              })
              .catch(() => {
                setAccountMessage(
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

  return (
    <View className="mt-7">
      <SectionTitle title="계정" />
      <MySettingsRow
        disabled={logoutMutation.isPending || deleteAccountMutation.isPending}
        icon="log-out"
        label="로그아웃"
        onPress={handleLogoutPress}
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

      {accountMessage ? (
        <AppText className="ml-12 mt-1 text-xs leading-5 text-soundlog-lime/70">
          {accountMessage}
        </AppText>
      ) : null}
    </View>
  );
}
