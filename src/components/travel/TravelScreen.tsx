import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { momentLogApi } from '@/api/momentLogApi';
import { recapApi } from '@/api/recapApi';
import { recapQueryKeys } from '@/api/recapQueries';
import { travelSessionApi } from '@/api/travelSessionApi';
import { MiniPlayer } from '@/components/MiniPlayer';
import { RecapListCard } from '@/components/recap/RecapListCard';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { getHomeContentBottomPadding } from '@/constants/layout';
import { useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import type { TravelMode } from '@/types/domain';

import { CommunityRecapCard } from './CommunityRecapCard';
import { EndTravelConfirmModal } from './EndTravelConfirmModal';
import { LiveSoundMapSection } from './live-sound-map';
import { MomentCard } from './MomentCard';
import { TravelModeBottomSheet } from './TravelModeBottomSheet';
import { TravelStatusCard } from './TravelStatusCard';
import { formatKoreanDateTime } from './travelFormat';
import { moodLabelByValue } from './travelData';
import {
  createMomentLogGroups,
  createSessionRecapId,
  momentLogGroupToRecapItem,
} from '@/utils/recapMappers';
import type { MomentLog } from '@/types/domain';

function getUniqueTrackCount(logs: MomentLog[]) {
  return new Set(logs.map((log) => log.track?.id).filter(Boolean)).size;
}

type TravelLogSummaryCardProps = {
  logs: MomentLog[];
  momentCount: number;
  onCreateRecap: () => void;
  onDeleteMoment: (moment: MomentLog) => void;
  onEditMomentNote: (moment: MomentLog, note?: string) => void;
  onOpenMoment: (moment: MomentLog) => void;
  sessionStatus: 'active' | 'ended' | 'idle';
  trackCount: number;
};

function formatMomentTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '시간 없음';
  }

  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
  }).format(date);
}

function getMomentMoodLabel(log: MomentLog) {
  return (
    log.moodTags
      .map((tag) => moodLabelByValue[tag])
      .filter(Boolean)
      .join(', ') || '무드 없음'
  );
}

function TravelLogSummaryCard({
  logs,
  momentCount,
  onCreateRecap,
  onDeleteMoment,
  onEditMomentNote,
  onOpenMoment,
  sessionStatus,
  trackCount,
}: TravelLogSummaryCardProps) {
  const [editingMomentId, setEditingMomentId] = useState<string>();
  const [editNoteDraft, setEditNoteDraft] = useState('');
  const title = sessionStatus === 'idle' ? '최근 여행 로그' : '이번 여행 로그';
  const buttonLabel =
    momentCount === 0
      ? '첫 Moment 남기기'
      : sessionStatus === 'active'
        ? 'Recap 만들기'
        : 'Recap 보기';

  return (
    <View className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <AppText className="text-[24px] font-semibold leading-8 text-white">
            {title}
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/55">
            {momentCount}개 순간 · {trackCount}곡
          </AppText>
        </View>
        <View className="rounded-full bg-soundlog-lime px-3 py-1.5">
          <AppText className="text-xs font-semibold text-soundlog-inverse">
            Soundtrack
          </AppText>
        </View>
      </View>

      <View className="mt-4 gap-2">
        {logs.length === 0 ? (
          <View className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
            <AppText className="text-sm leading-6 text-white/60">
              아직 저장한 순간이 없어요. 지금 장소의 곡을 하나 고르고 사진이나 메모로 남겨보세요.
            </AppText>
          </View>
        ) : (
          logs.slice(0, 3).map((log) => {
            const isEditing = editingMomentId === log.id;
            const trackLabel = log.track
              ? `${log.track.title} - ${log.track.artist}`
              : '음악 없음';
            const metaLabel = `${log.photoUri ? '사진' : '사진 없음'} / ${trackLabel} / ${getMomentMoodLabel(log)}`;
            const actionLabelPrefix = log.placeName ?? '저장한 순간';

            return (
              <View
                className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3"
                key={log.id}
              >
                <Pressable
                  accessibilityRole="button"
                  className="flex-row items-start justify-between gap-3"
                  onPress={() => onOpenMoment(log)}
                >
                  <View className="min-w-0 flex-1">
                    <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
                      {formatMomentTime(log.createdAt)} {log.placeName ?? '위치 없음'}
                    </AppText>
                    <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
                      {metaLabel}
                      {log.note ? ` · ${log.note}` : ''}
                    </AppText>
                  </View>
                  <View className="rounded-full bg-white/10 px-2.5 py-1">
                    <AppText className="text-[10px] font-semibold text-white/60">
                      {log.syncStatus === 'failed'
                        ? '동기화 필요'
                        : log.syncStatus === 'pending'
                          ? '동기화 중'
                          : '저장됨'}
                    </AppText>
                  </View>
                </Pressable>

                {isEditing ? (
                  <View className="mt-3 gap-2">
                    <TextInput
                      className="min-h-[48px] rounded-[14px] border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                      multiline
                      onChangeText={setEditNoteDraft}
                      placeholder="메모 수정"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={editNoteDraft}
                    />
                    <View className="flex-row gap-2">
                      <Pressable
                        accessibilityLabel={`${actionLabelPrefix} Moment 메모 저장`}
                        accessibilityRole="button"
                        className="h-9 flex-1 items-center justify-center rounded-full bg-soundlog-lime"
                        onPress={() => {
                          onEditMomentNote(log, editNoteDraft.trim() || undefined);
                          setEditingMomentId(undefined);
                          setEditNoteDraft('');
                        }}
                      >
                        <AppText className="text-xs font-semibold text-soundlog-inverse">저장</AppText>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`${actionLabelPrefix} Moment 메모 수정 취소`}
                        accessibilityRole="button"
                        className="h-9 flex-1 items-center justify-center rounded-full border border-white/15"
                        onPress={() => {
                          setEditingMomentId(undefined);
                          setEditNoteDraft('');
                        }}
                      >
                        <AppText className="text-xs font-semibold text-white/75">취소</AppText>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="mt-3 flex-row gap-2">
                    <Pressable
                      accessibilityLabel={`${actionLabelPrefix} Moment 수정`}
                      accessibilityRole="button"
                      className="h-8 flex-1 items-center justify-center rounded-full border border-white/10 bg-white/10"
                      onPress={() => {
                        setEditingMomentId(log.id);
                        setEditNoteDraft(log.note ?? '');
                      }}
                    >
                      <AppText className="text-xs font-semibold text-white/75">수정</AppText>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`${actionLabelPrefix} Moment 삭제`}
                      accessibilityRole="button"
                      className="h-8 flex-1 items-center justify-center rounded-full border border-red-300/20 bg-red-300/10"
                      onPress={() => onDeleteMoment(log)}
                    >
                      <AppText className="text-xs font-semibold text-red-100">삭제</AppText>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        className="mt-4 min-h-[52px] items-center justify-center rounded-full bg-soundlog-lime"
        onPress={onCreateRecap}
      >
        <AppText className="text-sm font-semibold text-soundlog-inverse">
          {buttonLabel}
        </AppText>
      </Pressable>
    </View>
  );
}

export function TravelScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [isModeSheetVisible, setIsModeSheetVisible] = useState(false);
  const [isEndConfirmVisible, setIsEndConfirmVisible] = useState(false);
  const [isStartingTravel, setIsStartingTravel] = useState(false);
  const [isCreatingRecap, setIsCreatingRecap] = useState(false);
  const [recapMessage, setRecapMessage] = useState<string>();
  const [, setClockTick] = useState(0);
  const {
    currentLocation,
    currentPlace,
    selectedMode,
    session,
    endSession,
    resetSession,
    setMode,
    setSessionRecapId,
    startSession,
  } = useTravelSessionStore();
  const { currentTrack } = usePlayerStore();
  const { addLog, logs: momentLogs, removeLog, updateLog } = useMomentLogStore();
  const sessionLogs = useMemo(
    () => momentLogs.filter((log) => log.sessionId === session.id),
    [momentLogs, session.id],
  );
  const moments = useMemo(
    () => (session.status === 'idle' ? momentLogs : sessionLogs).slice(0, 3),
    [momentLogs, session.status, sessionLogs],
  );
  const momentCount = session.status === 'idle' ? 0 : sessionLogs.length;
  const trackCount = useMemo(
    () => getUniqueTrackCount(sessionLogs),
    [sessionLogs],
  );
  const travelLogMoments = useMemo(
    () => (session.status === 'idle' ? momentLogs : sessionLogs),
    [momentLogs, session.status, sessionLogs],
  );
  const travelLogMomentCount =
    session.status === 'idle' ? momentLogs.length : sessionLogs.length;
  const travelLogTrackCount = useMemo(
    () => getUniqueTrackCount(travelLogMoments),
    [travelLogMoments],
  );
  const localRecaps = useMemo(
    () =>
      createMomentLogGroups(momentLogs)
        .slice(0, 3)
        .map((group) => ({
          imageUrl: group.logs[0]?.photoUri,
          item: momentLogGroupToRecapItem(group),
          shareId: group.id,
        })),
    [momentLogs],
  );

  useEffect(() => {
    if (session.status !== 'active') {
      return;
    }

    const intervalId = setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [session.status]);

  const openModeSheet = () => {
    if (session.status === 'ended') {
      resetSession();
    }

    setIsModeSheetVisible(true);
  };
  const handleSelectMode = (mode: TravelMode) => {
    setMode(mode);
  };
  const handleStartTravel = async () => {
    if (isStartingTravel) {
      return;
    }

    const nextMode = selectedMode ?? 'cafe';

    if (!selectedMode) {
      setMode(nextMode);
    }

    setIsStartingTravel(true);

    try {
      const serverSession = await travelSessionApi.createTravelSession({
        location: currentLocation ?? currentPlace?.location,
        travelMode: nextMode,
      });

      startSession({
        id: serverSession?.id,
        startedAt: serverSession?.startedAt,
      });
    } catch {
      startSession();
      setRecapMessage('서버 여행 세션 연결에 실패해서 로컬 세션으로 먼저 시작했어요.');
    } finally {
      setIsStartingTravel(false);
      setIsModeSheetVisible(false);
    }
  };
  const retryMomentLog = async (log: MomentLog) => {
    if (log.syncStatus === 'pending') {
      return;
    }

    updateLog(log.id, { syncStatus: 'pending' });

    try {
      const serverLog = await momentLogApi.createMomentLog({
        createdAt: log.createdAt,
        idempotencyKey: log.id,
        location: log.location,
        moodTags: log.moodTags,
        photoUri: log.photoUri,
        placeCategory: log.placeCategory,
        placeId: log.placeId,
        placeName: log.placeName,
        sessionId: log.sessionId,
        note: log.note,
        track: log.track,
        travelMode: log.travelMode,
      });

      if (!serverLog) {
        updateLog(log.id, { syncStatus: 'local' });
        return;
      }

      removeLog(log.id);
      addLog(serverLog);
    } catch {
      updateLog(log.id, { syncStatus: 'failed' });
    }
  };
  const handleConfirmEnd = async () => {
    if (isCreatingRecap) {
      return;
    }

    const endedSessionId = session.id;
    const logsForSession = sessionLogs;
    const localRecapId = createSessionRecapId(endedSessionId);
    const endedAt = new Date().toISOString();

    setRecapMessage(undefined);
    endSession();
    setIsEndConfirmVisible(false);

    try {
      await travelSessionApi.endTravelSession(endedSessionId, {
        endedAt,
        location: currentLocation ?? currentPlace?.location,
      });
    } catch {
      setRecapMessage('서버 여행 세션 종료 동기화에 실패했지만 로컬 Recap은 계속 만들 수 있어요.');
    }

    if (logsForSession.length === 0) {
      setSessionRecapId(undefined);
      setRecapMessage('저장한 Moment가 없어 Recap 대신 빈 기록 화면으로 이동할 수 있어요.');
      return;
    }

    const syncedLogs = logsForSession.filter((log) => log.syncStatus === 'synced');
    const hasOnlySyncedLogs = syncedLogs.length === logsForSession.length;
    const representativeTrackId = logsForSession.find((log) => log.track?.id)?.track?.id;

    if (!hasOnlySyncedLogs) {
      setSessionRecapId(localRecapId);
      setRecapMessage('아직 동기화되지 않은 Moment가 있어 로컬 Recap으로 먼저 만들었어요.');
      router.push(`/recap-share/${localRecapId}`);
      return;
    }

    setIsCreatingRecap(true);

    try {
      const serverRecap = await recapApi.createRecap({
        momentLogIds: syncedLogs.map((log) => log.id),
        representativeTrackId,
        sessionId: endedSessionId,
        templateId: 'lp',
        title: `${logsForSession[0]?.placeName ?? '여행'} Recap`,
      });
      const recapId = serverRecap?.id ?? localRecapId;

      setSessionRecapId(recapId);
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.list });
      router.push(`/recap-share/${recapId}`);
    } catch {
      setSessionRecapId(localRecapId);
      setRecapMessage('서버 Recap 생성이 실패해서 로컬 Recap으로 먼저 보여드릴게요.');
      router.push(`/recap-share/${localRecapId}`);
    } finally {
      setIsCreatingRecap(false);
    }
  };
  const openCurrentRecap = () => {
    const recapId = session.recapId ?? createSessionRecapId(session.id);

    router.push(`/recap-share/${recapId}`);
  };
  const handleCreateTravelLogRecap = () => {
    if (travelLogMomentCount === 0) {
      router.push('/camera');
      return;
    }

    if (session.status === 'active') {
      setIsEndConfirmVisible(true);
      return;
    }

    if (session.status === 'ended') {
      openCurrentRecap();
      return;
    }

    const latestRecap = localRecaps[0];

    if (latestRecap) {
      router.push(`/recap-share/${latestRecap.shareId}`);
    }
  };
  const handleDeleteMoment = (moment: MomentLog) => {
    removeLog(moment.id);
    setRecapMessage('Moment를 여행 로그에서 삭제했어요.');
  };
  const handleEditMomentNote = (moment: MomentLog, note?: string) => {
    updateLog(moment.id, { note });
    setRecapMessage(note ? 'Moment 메모를 수정했어요.' : 'Moment 메모를 비웠어요.');
  };
  const handleCommunityRecapCreated = async (recap: { id: string }) => {
    setSessionRecapId(recap.id);
    await queryClient.invalidateQueries({ queryKey: recapQueryKeys.list });
    router.push(`/recap-share/${recap.id}`);
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: getHomeContentBottomPadding(insets.bottom, Boolean(currentTrack)),
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <AppText className="text-[13px] font-semibold text-soundlog-lime">
            음악으로 기록하는 당신의 여정
          </AppText>
          <AppText className="mt-2 text-[34px] font-semibold leading-10 text-white">
            Travel
          </AppText>
        </View>

        <TravelStatusCard
          currentPlace={currentPlace}
          currentTrack={currentTrack}
          endedAt={session.endedAt}
          isCreatingRecap={isCreatingRecap}
          momentCount={momentCount}
          onEndTravel={() => setIsEndConfirmVisible(true)}
          onOpenRecap={openCurrentRecap}
          onSaveMoment={() => router.push('/camera')}
          onStartTravel={openModeSheet}
          selectedMode={selectedMode}
          startedAt={session.startedAt}
          status={session.status}
          trackCount={trackCount}
        />

        {recapMessage ? (
          <View className="mt-4 rounded-[16px] border border-white/10 bg-white/10 px-4 py-3">
            <AppText className="text-sm leading-5 text-white/65">{recapMessage}</AppText>
          </View>
        ) : null}

        <TravelLogSummaryCard
          logs={travelLogMoments}
          momentCount={travelLogMomentCount}
          onCreateRecap={handleCreateTravelLogRecap}
          onDeleteMoment={handleDeleteMoment}
          onEditMomentNote={handleEditMomentNote}
          onOpenMoment={(moment) => router.push(`/recap-share/${moment.id}`)}
          sessionStatus={session.status}
          trackCount={travelLogTrackCount}
        />

        <LiveSoundMapSection
          currentLocation={currentLocation}
          currentPlace={currentPlace}
          currentTrack={currentTrack}
          selectedMode={selectedMode}
          sessionId={session.id}
          sessionStatus={session.status}
        />

        <CommunityRecapCard
          currentPlace={currentPlace}
          currentTrack={currentTrack}
          momentCount={momentCount}
          onRecapCreated={(recap) => void handleCommunityRecapCreated(recap)}
          sessionId={session.id}
          sessionStatus={session.status}
          trackCount={trackCount}
        />

        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="text-xl font-semibold text-white">최근 Moment</AppText>
              <AppText className="mt-1 text-xs text-white/45">여행 중 직접 저장한 순간</AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push('/library')}>
              <AppText className="text-xs font-semibold text-soundlog-lime">더보기</AppText>
            </Pressable>
          </View>

          <View className="mt-4 gap-3">
            {moments.length === 0 ? (
              <View className="rounded-[18px] border border-white/10 bg-white/10 p-4">
                <AppText className="text-sm leading-6 text-white/60">
                  아직 저장한 Moment가 없어요. 여행 중 카메라 버튼으로 첫 순간을 남겨보세요.
                </AppText>
              </View>
            ) : (
              moments.map((moment) => (
                <MomentCard
                  key={moment.id}
                  item={moment}
                  onPress={() => router.push(`/recap-share/${moment.id}`)}
                  onRetry={(item) => void retryMomentLog(item)}
                />
              ))
            )}
          </View>
        </View>

        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <View>
              <AppText className="text-xl font-semibold text-white">Travel Log</AppText>
              <AppText className="mt-1 text-xs text-white/45">
                여행별 음악과 Moment 요약
              </AppText>
            </View>
          </View>

          <View className="mt-4 gap-3">
            {localRecaps.length === 0 ? (
              <View className="rounded-[18px] border border-white/10 bg-white/10 p-4">
                <AppText className="text-sm leading-6 text-white/60">
                  여행이 끝나면 저장한 Moment가 Recap으로 묶여요.
                </AppText>
              </View>
            ) : (
              localRecaps.map(({ imageUrl, item, shareId }) => (
                <RecapListCard
                  key={item.id}
                  imageUrl={imageUrl}
                  item={item}
                  onPress={() => router.push(`/recap-share/${shareId}`)}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {currentTrack ? <MiniPlayer /> : null}

      <TravelModeBottomSheet
        onClose={() => setIsModeSheetVisible(false)}
        onSelectMode={handleSelectMode}
        onStart={() => void handleStartTravel()}
        selectedMode={selectedMode}
        visible={isModeSheetVisible}
      />
      <EndTravelConfirmModal
        momentCount={momentCount}
        onCancel={() => setIsEndConfirmVisible(false)}
        onConfirm={() => void handleConfirmEnd()}
        visible={isEndConfirmVisible}
      />
    </Screen>
  );
}
