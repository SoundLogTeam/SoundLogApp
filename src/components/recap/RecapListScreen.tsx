import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { recapApi } from '@/api/recapApi';
import { recapQueryKeys, useRecapListQuery } from '@/api/recapQueries';
import { AppText } from '@/components/AppText';
import { RecapEmptyState } from '@/components/recap/RecapEmptyState';
import { RecapListCard } from '@/components/recap/RecapListCard';
import { Screen } from '@/components/Screen';
import { useMomentLogStore } from '@/store/momentLogStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import type { MomentLog } from '@/types/domain';
import {
  createMomentLogGroups,
  createSessionRecapId,
  momentLogGroupToRecapItem,
} from '@/utils/recapMappers';

type RecapListEntry = {
  imageUrl?: string;
  item: ReturnType<typeof momentLogGroupToRecapItem>;
  shareId: string;
};

type CurrentTripRecapCardProps = {
  isCreating: boolean;
  message?: string;
  momentCount: number;
  onPress: () => void;
  representativeLog?: MomentLog;
  status: 'empty' | 'failed' | 'ready' | 'synced';
  trackCount: number;
};

function getUniqueTrackCount(logs: MomentLog[]) {
  return new Set(logs.map((log) => log.track?.id).filter(Boolean)).size;
}

function getNewestMomentLog(logs: MomentLog[]) {
  return [...logs].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )[0];
}

function CurrentTripRecapCard({
  isCreating,
  message,
  momentCount,
  onPress,
  representativeLog,
  status,
  trackCount,
}: CurrentTripRecapCardProps) {
  const statusLabel = isCreating
    ? '생성 중...'
    : status === 'failed'
      ? '실패 · 재시도 가능'
      : status === 'synced'
        ? '완료'
        : status === 'ready'
          ? '생성 가능'
          : '생성 전';
  const buttonLabel = isCreating
    ? '생성 중...'
    : status === 'failed'
      ? '다시 시도'
    : status === 'synced'
      ? 'Recap 열기'
      : status === 'empty'
        ? '첫 Moment 저장'
        : 'Recap 만들기';
  const representativeTrackLabel = representativeLog?.track
    ? `${representativeLog.track.title} - ${representativeLog.track.artist}`
    : '대표 곡 없음';

  return (
    <View className="overflow-hidden rounded-[24px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <AppText className="text-[11px] font-semibold uppercase text-white/45">
            이번 여행
          </AppText>
          <AppText className="mt-2 text-[26px] font-semibold leading-8 text-white">
            {statusLabel}
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/55">
            {momentCount}개 Moment · {trackCount}곡
          </AppText>
        </View>
        <View className="rounded-full bg-soundlog-lime px-3 py-1.5">
          <AppText className="text-xs font-semibold text-soundlog-inverse">Recap</AppText>
        </View>
      </View>

      <View className="mt-4 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
        <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
          {representativeLog?.placeName ?? '아직 대표 장소가 없어요'}
        </AppText>
        <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
          {representativeTrackLabel}
        </AppText>
      </View>

      {message ? (
        <View className="mt-3 rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
          <AppText className="text-xs leading-5 text-amber-100">{message}</AppText>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        className="mt-4 min-h-[52px] items-center justify-center rounded-full bg-soundlog-lime"
        disabled={isCreating}
        onPress={onPress}
        style={{ opacity: isCreating ? 0.62 : 1 }}
      >
        <AppText className="text-sm font-semibold text-soundlog-inverse">
          {buttonLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

export function RecapListScreen() {
  const queryClient = useQueryClient();
  const momentLogs = useMomentLogStore((state) => state.logs);
  const { session, setSessionRecapId } = useTravelSessionStore();
  const [currentRecapStatus, setCurrentRecapStatus] =
    useState<'empty' | 'failed' | 'ready' | 'synced'>('empty');
  const [currentRecapMessage, setCurrentRecapMessage] = useState<string>();
  const [isCreatingCurrentRecap, setIsCreatingCurrentRecap] = useState(false);
  const {
    data: serverRecapItems = [],
    isError,
    isLoading,
  } = useRecapListQuery();
  const currentTripLogs = useMemo(
    () =>
      session.status === 'idle'
        ? []
        : momentLogs.filter((log) => log.sessionId === session.id),
    [momentLogs, session.id, session.status],
  );
  const currentTripRepresentativeLog = useMemo(
    () => getNewestMomentLog(currentTripLogs),
    [currentTripLogs],
  );
  const currentTripTrackCount = useMemo(
    () => getUniqueTrackCount(currentTripLogs),
    [currentTripLogs],
  );
  const currentTripStatus =
    isCreatingCurrentRecap || currentRecapStatus === 'failed'
      ? currentRecapStatus
      : session.recapId
        ? 'synced'
        : currentTripLogs.length > 0
          ? 'ready'
          : 'empty';
  const serverRecaps: RecapListEntry[] = serverRecapItems.map((item) => ({
    imageUrl: item.representativeTrack.albumImageUrl,
    item,
    shareId: item.id,
  }));
  const serverSessionIds = new Set(serverRecaps.map(({ item }) => item.sessionId).filter(Boolean));
  const localRecaps: RecapListEntry[] = createMomentLogGroups(momentLogs)
    .filter((group) => !group.sessionId || !serverSessionIds.has(group.sessionId))
    .map((group) => ({
      imageUrl: group.logs[0]?.photoUri,
      item: momentLogGroupToRecapItem(group),
      shareId: group.id,
    }));
  const recaps = [...localRecaps, ...serverRecaps];
  const hasRecaps = recaps.length > 0;
  const savedMomentCount = recaps.reduce(
    (sum, { item }) => sum + (item.momentCount ?? 1),
    0,
  );
  const handleCreateRecap = () => {
    const latestLocalRecap = localRecaps[0];

    if (latestLocalRecap) {
      router.push(`/recap-share/${latestLocalRecap.shareId}`);
      return;
    }

    router.push('/camera');
  };
  const handleCurrentTripRecap = async () => {
    if (isCreatingCurrentRecap) {
      return;
    }

    if (currentTripLogs.length === 0) {
      router.push('/camera');
      return;
    }

    const localRecapId = session.recapId ?? createSessionRecapId(session.id);

    if (session.recapId && currentRecapStatus !== 'failed') {
      router.push(`/recap-share/${session.recapId}`);
      return;
    }

    const syncedLogs = currentTripLogs.filter((log) => log.syncStatus === 'synced');
    const hasOnlySyncedLogs = syncedLogs.length === currentTripLogs.length;
    const representativeTrackId = currentTripLogs.find((log) => log.track?.id)?.track?.id;

    if (!hasOnlySyncedLogs) {
      setSessionRecapId(localRecapId);
      setCurrentRecapStatus('failed');
      setCurrentRecapMessage('아직 동기화되지 않은 Moment가 있어 로컬 Recap으로 먼저 보여드릴게요.');
      router.push(`/recap-share/${localRecapId}`);
      return;
    }

    setIsCreatingCurrentRecap(true);
    setCurrentRecapMessage(undefined);

    try {
      const serverRecap = await recapApi.createRecap({
        momentLogIds: syncedLogs.map((log) => log.id),
        representativeTrackId,
        sessionId: session.id,
        templateId: 'lp',
        title: `${currentTripRepresentativeLog?.placeName ?? '이번 여행'} Recap`,
      });
      const recapId = serverRecap?.id ?? localRecapId;

      setSessionRecapId(recapId);
      setCurrentRecapStatus('synced');
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.list });
      router.push(`/recap-share/${recapId}`);
    } catch {
      setSessionRecapId(localRecapId);
      setCurrentRecapStatus('failed');
      setCurrentRecapMessage('서버 Recap 생성에 실패해서 로컬 Recap으로 먼저 보여드릴게요.');
      router.push(`/recap-share/${localRecapId}`);
    } finally {
      setIsCreatingCurrentRecap(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          gap: 18,
          paddingBottom: 132,
          paddingHorizontal: 20,
          paddingTop: 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="overflow-hidden rounded-[28px] border border-white/10">
          <LinearGradient
            colors={[
              'rgba(91,45,255,0.42)',
              'rgba(11,16,31,0.96)',
              'rgba(6,9,19,1)',
            ]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={{ paddingHorizontal: 20, paddingVertical: 24 }}
          >
            <View className="self-start rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <AppText className="text-[11px] font-semibold text-white/70">
                SOUNDLOG ARCHIVE
              </AppText>
            </View>
            <AppText className="mt-5 text-[32px] font-semibold leading-9 text-white">
              Recap
            </AppText>
            <AppText className="mt-3 text-sm leading-6 text-white/60">
              여행별 사운드트랙 앨범 생성 상태를 확인하고 다시 꺼내보세요.
            </AppText>

            <View className="mt-6 flex-row gap-3">
              <View className="flex-1 rounded-[18px] bg-white/10 p-4">
                <AppText className="text-[24px] font-semibold text-white">
                  {recaps.length}
                </AppText>
                <AppText className="mt-1 text-[11px] text-white/55">
                  Recap
                </AppText>
              </View>
              <View className="flex-1 rounded-[18px] bg-white/10 p-4">
                <AppText className="text-[24px] font-semibold text-white">
                  {savedMomentCount}
                </AppText>
                <AppText className="mt-1 text-[11px] text-white/55">
                  Saved moments
                </AppText>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              className="mt-5 min-h-[52px] items-center justify-center rounded-full bg-soundlog-lime"
              onPress={handleCreateRecap}
            >
              <AppText className="text-sm font-semibold text-soundlog-inverse">
                {hasRecaps ? '새 Recap 생성' : '첫 Moment로 Recap 만들기'}
              </AppText>
            </Pressable>
          </LinearGradient>
        </View>

        <CurrentTripRecapCard
          isCreating={isCreatingCurrentRecap}
          message={currentRecapMessage}
          momentCount={currentTripLogs.length}
          onPress={handleCurrentTripRecap}
          representativeLog={currentTripRepresentativeLog}
          status={currentTripStatus}
          trackCount={currentTripTrackCount}
        />

        {isLoading ? (
          <AppText className="text-sm text-white/55">
            Recap 데이터를 불러오는 중이에요.
          </AppText>
        ) : null}

        {isError && !hasRecaps ? (
          <AppText className="text-sm text-white/55">
            Recap 데이터를 불러오지 못했어요. 잠시 후 다시 확인해주세요.
          </AppText>
        ) : null}

        {!isLoading && !hasRecaps ? <RecapEmptyState /> : null}

        <View className="gap-3">
          {hasRecaps ? (
            <AppText className="mb-1 text-[18px] font-semibold text-white">
              최근 Recap
            </AppText>
          ) : null}
          {recaps.map(({ imageUrl, item, shareId }) => (
            <RecapListCard
              key={item.id}
              imageUrl={imageUrl}
              item={item}
              onPress={() => router.push(`/recap-share/${shareId}`)}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
