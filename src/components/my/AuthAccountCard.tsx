import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  useLocalDataMigrationMutation,
  useLogoutMutation,
} from '@/api/authQueries';
import { AppText } from '@/components/AppText';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useMomentLogStore } from '@/store/momentLogStore';

const providerLabels = {
  apple: 'Apple',
  google: 'Google',
  kakao: 'Kakao',
} as const;

function createMigrationKey() {
  return `migration-${Date.now()}`;
}

export function AuthAccountCard() {
  const [migrationMessage, setMigrationMessage] = useState<string>();
  const logoutMutation = useLogoutMutation();
  const migrationMutation = useLocalDataMigrationMutation();
  const { logoutLocal, refreshToken, status, user } = useAuthStore();
  const momentLogs = useMomentLogStore((state) => state.logs);
  const likedTracks = useLibraryStore((state) => state.likedTracks);
  const savedTracks = useLibraryStore((state) => state.savedTracks);

  const localDataSummary = useMemo(
    () => ({
      libraryTrackCount: likedTracks.length + savedTracks.length,
      momentLogCount: momentLogs.length,
      recapDraftCount: Math.max(0, momentLogs.length > 0 ? 1 : 0),
    }),
    [likedTracks.length, momentLogs.length, savedTracks.length],
  );

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

    try {
      const result = await migrationMutation.mutateAsync({
        ...localDataSummary,
        idempotencyKey: createMigrationKey(),
      });

      setMigrationMessage(
        `순간 ${result.migrated.momentLogCount}개, 보관함 ${result.migrated.libraryTrackCount}개를 동기화 큐에 올렸어요.`,
      );
    } catch {
      setMigrationMessage('동기화 요청에 실패했어요. 네트워크 상태를 확인해주세요.');
    }
  };

  const handleLoginPress = () => {
    router.push('/auth/login' as never);
  };

  if (status === 'authenticated' && user) {
    return (
      <View className="mt-5 rounded-[22px] border border-[#1DB954]/25 bg-[#0D1D15] p-5">
        <View className="flex-row items-start gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-[#1DB954]/20">
            <Feather color="#7CFF8A" name="user-check" size={19} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText className="text-sm font-semibold text-[#7CFF8A]/80">
              로그인됨
            </AppText>
            <AppText className="mt-2 text-[20px] font-semibold text-white">
              {user.displayName}
            </AppText>
            <AppText className="mt-1 text-xs leading-5 text-white/50">
              {providerLabels[user.provider]} 계정
              {user.email ? ` · ${user.email}` : ''}
            </AppText>
          </View>
        </View>

        <View className="mt-5 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            className="min-h-11 flex-1 items-center justify-center rounded-full bg-[#1DB954] px-4"
            disabled={migrationMutation.isPending}
            onPress={handleMigrate}
          >
            <AppText className="text-xs font-semibold text-[#05110A]">
              {migrationMutation.isPending ? '동기화 중' : '로컬 기록 동기화'}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="min-h-11 items-center justify-center rounded-full border border-white/10 px-4"
            disabled={logoutMutation.isPending}
            onPress={handleLogout}
          >
            <AppText className="text-xs font-semibold text-white/70">
              {logoutMutation.isPending ? '정리 중' : '로그아웃'}
            </AppText>
          </Pressable>
        </View>

        {migrationMessage ? (
          <AppText className="mt-3 text-xs leading-5 text-[#7CFF8A]/70">
            {migrationMessage}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View className="mt-5 rounded-[22px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather
            color={status === 'guest' ? '#7CFF8A' : '#fff'}
            name={status === 'guest' ? 'eye' : 'log-in'}
            size={19}
          />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-sm font-semibold text-white/45">계정</AppText>
          <AppText className="mt-2 text-[20px] font-semibold text-white">
            {status === 'guest' ? '게스트로 둘러보는 중' : '로그인이 필요해요'}
          </AppText>
          <AppText className="mt-2 text-xs leading-5 text-white/50">
            로그인하면 이 기기의 취향과 여행 기록을 서버 계정으로 이어갈 수 있어요.
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        className="mt-5 min-h-11 items-center justify-center rounded-full bg-white px-4"
        onPress={handleLoginPress}
      >
        <AppText className="text-xs font-semibold text-[#05070C]">
          소셜 로그인 연결하기
        </AppText>
      </Pressable>
    </View>
  );
}
