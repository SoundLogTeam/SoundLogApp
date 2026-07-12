import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { momentLogApi } from '@/api/momentLogApi';
import { momentLogQueryKeys, useMomentLogListQuery } from '@/api/momentLogQueries';
import { recapApi } from '@/api/recapApi';
import { recapQueryKeys } from '@/api/recapQueries';
import { travelSessionApi } from '@/api/travelSessionApi';
import { MiniPlayer } from '@/components/MiniPlayer';
import { RecapListCard } from '@/components/recap/RecapListCard';
import { RecapTemplateSelector } from '@/components/recap-share/RecapTemplateSelector';
import { Screen } from '@/components/Screen';
import { AppText } from '@/components/AppText';
import { getHomeContentBottomPadding } from '@/constants/layout';
import {
  createRoutePoint,
  useTravelRouteTracking,
} from '@/hooks/useTravelRouteTracking';
import { useAuthStore } from '@/store/authStore';
import {
  useMomentLogStore,
  type MomentLogCreateQueuePayload,
  type MomentLogEditQueuePayload,
  type MomentLogPendingAction,
} from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import type { MomentLog, MoodTag, RecapTemplateId, Track, TravelMode } from '@/types/domain';

import { CommunityRecapCard } from './CommunityRecapCard';
import { EndTravelConfirmModal } from './EndTravelConfirmModal';
import { MomentCard } from './MomentCard';
import { RecapMapSection } from './recap-map';
import { TravelModeBottomSheet } from './TravelModeBottomSheet';
import { TravelStatusCard } from './TravelStatusCard';
import { formatKoreanDateTime } from './travelFormat';
import { moodLabelByValue } from './travelData';
import { pickMomentReplacementPhoto } from '@/utils/momentPhotoPicker';
import {
  createMomentLogGroups,
  createSessionRecapId,
  momentLogGroupToRecapItem,
} from '@/utils/recapMappers';

function getUniqueTrackCount(logs: MomentLog[]) {
  return new Set(logs.map((log) => log.track?.id).filter(Boolean)).size;
}

type MomentLogEditDraft = {
  moodTags: MoodTag[];
  note?: string;
  placeName?: string;
  removePhoto?: boolean;
  replacePhotoUri?: string;
  track?: Track;
};

const moodOptions = Object.entries(moodLabelByValue) as Array<[MoodTag, string]>;
const LIVE_SOUND_MAP_FOCUS = 'sound-map';
const LIVE_SOUND_MAP_SCROLL_OFFSET = 16;

function momentLogPatchFromPayload(
  moment: MomentLog,
  payload: MomentLogEditQueuePayload,
): Partial<MomentLog> {
  return {
    moodTags: payload.moodTags,
    note: payload.note ?? undefined,
    photoUri: payload.removePhoto ? undefined : payload.replacePhotoUri ?? moment.photoUri,
    placeName: payload.placeName ?? undefined,
    track: payload.track,
  };
}

function momentLogCreatePayloadFromLog(log: MomentLog): MomentLogCreateQueuePayload {
  return {
    createdAt: log.createdAt,
    location: log.location,
    moodTags: log.moodTags,
    note: log.note,
    photoUri: log.photoUri,
    placeCategory: log.placeCategory,
    placeId: log.placeId,
    placeName: log.placeName,
    sessionId: log.sessionId,
    track: log.track,
    travelMode: log.travelMode,
  };
}

type TravelLogSummaryCardProps = {
  currentTrack?: Track;
  logs: MomentLog[];
  momentCount: number;
  onCreateRecap: () => void;
  onDeleteMoment: (moment: MomentLog) => Promise<void> | void;
  onEditMoment: (moment: MomentLog, draft: MomentLogEditDraft) => Promise<void> | void;
  onOpenMoment: (moment: MomentLog) => void;
  onSelectRecapTemplate: (template: RecapTemplateId) => void;
  pendingMomentActionId?: string;
  selectedRecapTemplate: RecapTemplateId;
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
  currentTrack,
  logs,
  momentCount,
  onCreateRecap,
  onDeleteMoment,
  onEditMoment,
  onOpenMoment,
  onSelectRecapTemplate,
  pendingMomentActionId,
  selectedRecapTemplate,
  sessionStatus,
  trackCount,
}: TravelLogSummaryCardProps) {
  const [editingMomentId, setEditingMomentId] = useState<string>();
  const [editMoodDraft, setEditMoodDraft] = useState<MoodTag[]>([]);
  const [editNoteDraft, setEditNoteDraft] = useState('');
  const [editPhotoMessage, setEditPhotoMessage] = useState<string>();
  const [editPhotoUriDraft, setEditPhotoUriDraft] = useState<string>();
  const [editPlaceDraft, setEditPlaceDraft] = useState('');
  const [editTrackDraft, setEditTrackDraft] = useState<Track>();
  const title = sessionStatus === 'idle' ? '최근 여행 로그' : '이번 여행 로그';
  const buttonLabel =
    momentCount === 0
      ? '첫 리캡 남기기'
      : sessionStatus === 'active'
        ? '로그 만들기'
        : '로그 보기';
  const canSelectRecapTemplate = sessionStatus === 'active' && momentCount > 0;
  const resetEditDraft = () => {
    setEditingMomentId(undefined);
    setEditMoodDraft([]);
    setEditNoteDraft('');
    setEditPhotoMessage(undefined);
    setEditPhotoUriDraft(undefined);
    setEditPlaceDraft('');
    setEditTrackDraft(undefined);
  };
  const handlePickPhoto = async (momentLogId: string) => {
    setEditPhotoMessage(undefined);

    const result = await pickMomentReplacementPhoto(momentLogId);

    if (result.status === 'selected') {
      setEditPhotoUriDraft(result.uri);
      setEditPhotoMessage('새 사진을 선택했어요. 저장하면 리캡에 반영돼요.');
      return;
    }

    if (result.status === 'permission-denied') {
      setEditPhotoMessage('사진을 교체하려면 사진 보관함 접근 권한이 필요해요.');
      return;
    }

    if (result.status === 'unavailable') {
      setEditPhotoMessage('사진을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <View className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <AppText className="text-[24px] font-semibold leading-8 text-white">
            {title}
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/55">
            리캡 {momentCount}개 · {trackCount}곡
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
              아직 저장한 리캡이 없어요. 지금 장소의 곡을 하나 고르고 사진이나 메모로 남겨보세요.
            </AppText>
          </View>
        ) : (
          logs.slice(0, 3).map((log) => {
            const isEditing = editingMomentId === log.id;
            const isActionPending = pendingMomentActionId === log.id;
            const trackLabel = log.track
              ? `${log.track.title} - ${log.track.artist}`
              : '음악 없음';
            const metaLabel = `${log.photoUri ? '사진' : '사진 없음'} / ${trackLabel} / ${getMomentMoodLabel(log)}`;
            const actionLabelPrefix = log.placeName ?? '저장한 리캡';
            const draftTrackLabel = editTrackDraft
              ? `${editTrackDraft.title} - ${editTrackDraft.artist}`
              : '음악 없음';

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
                      className="h-11 rounded-[14px] border border-white/10 bg-white/10 px-3 text-sm text-white"
                      onChangeText={setEditPlaceDraft}
                      placeholder="장소 수정"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={editPlaceDraft}
                    />
                    <TextInput
                      className="min-h-[48px] rounded-[14px] border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
                      multiline
                      onChangeText={setEditNoteDraft}
                      placeholder="메모 수정"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      value={editNoteDraft}
                    />
                    <View className="flex-row flex-wrap gap-2">
                      {moodOptions.map(([tag, label]) => {
                        const isSelected = editMoodDraft.includes(tag);

                        return (
                          <Pressable
                            accessibilityRole="button"
                            className={
                              isSelected
                                ? 'h-8 items-center justify-center rounded-full bg-soundlog-lime px-3'
                                : 'h-8 items-center justify-center rounded-full border border-white/10 bg-white/10 px-3'
                            }
                            disabled={isActionPending}
                            key={tag}
                            onPress={() => {
                              setEditMoodDraft((current) =>
                                current.includes(tag)
                                  ? current.filter((item) => item !== tag)
                                  : [...current, tag],
                              );
                            }}
                          >
                            <AppText
                              className={
                                isSelected
                                  ? 'text-xs font-semibold text-soundlog-inverse'
                                  : 'text-xs font-semibold text-white/70'
                              }
                            >
                              {label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View className="rounded-[14px] border border-white/10 bg-white/10 px-3 py-3">
                      <AppText className="text-[11px] font-semibold text-white/45">
                        사진
                      </AppText>
                      {editPhotoUriDraft ? (
                        <View className="mt-2 h-28 overflow-hidden rounded-[14px] bg-black/20">
                          <Image
                            contentFit="cover"
                            source={{ uri: editPhotoUriDraft }}
                            style={{ flex: 1 }}
                          />
                        </View>
                      ) : null}
                      <AppText className="mt-1 text-sm font-semibold text-white">
                        {editPhotoUriDraft ? '사진 연결됨' : '사진 없음'}
                      </AppText>
                      {editPhotoMessage ? (
                        <AppText className="mt-2 text-xs leading-5 text-white/45">
                          {editPhotoMessage}
                        </AppText>
                      ) : null}
                      <View className="mt-3 flex-row gap-2">
                        <Pressable
                          accessibilityRole="button"
                          className="h-9 flex-1 items-center justify-center rounded-full border border-soundlog-lime/40 bg-soundlog-lime/10"
                          disabled={isActionPending}
                          onPress={() => void handlePickPhoto(log.id)}
                        >
                          <AppText className="text-xs font-semibold text-soundlog-lime">
                            {editPhotoUriDraft ? '사진 교체' : '사진 추가'}
                          </AppText>
                        </Pressable>
                        {editPhotoUriDraft ? (
                          <Pressable
                            accessibilityRole="button"
                            className="h-9 flex-1 items-center justify-center rounded-full border border-red-300/20 bg-red-300/10"
                            disabled={isActionPending}
                            onPress={() => {
                              setEditPhotoUriDraft(undefined);
                              setEditPhotoMessage('저장하면 리캡 사진이 제거돼요.');
                            }}
                          >
                            <AppText className="text-xs font-semibold text-red-100">
                              사진 제거
                            </AppText>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                    <View className="rounded-[14px] border border-white/10 bg-white/10 px-3 py-3">
                      <AppText className="text-[11px] font-semibold text-white/45">
                        연결된 곡
                      </AppText>
                      <AppText className="mt-1 text-sm font-semibold text-white" numberOfLines={1}>
                        {draftTrackLabel}
                      </AppText>
                      {currentTrack ? (
                        <Pressable
                          accessibilityRole="button"
                          className="mt-3 h-9 items-center justify-center rounded-full border border-soundlog-lime/40 bg-soundlog-lime/10"
                          disabled={isActionPending}
                          onPress={() => setEditTrackDraft(currentTrack)}
                        >
                          <AppText className="text-xs font-semibold text-soundlog-lime">
                            현재 곡으로 교체
                          </AppText>
                        </Pressable>
                      ) : (
                        <AppText className="mt-2 text-xs leading-5 text-white/45">
                          현재 선택된 곡이 없어요.
                        </AppText>
                      )}
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        accessibilityLabel={`${actionLabelPrefix} 리캡 수정 저장`}
                        accessibilityRole="button"
                        className="h-9 flex-1 items-center justify-center rounded-full bg-soundlog-lime"
                        disabled={isActionPending}
                        onPress={() => {
                          void Promise.resolve(
                            onEditMoment(log, {
                              moodTags: editMoodDraft,
                              note: editNoteDraft.trim() || undefined,
                              placeName: editPlaceDraft.trim() || undefined,
                              removePhoto: Boolean(log.photoUri && !editPhotoUriDraft),
                              replacePhotoUri:
                                editPhotoUriDraft && editPhotoUriDraft !== log.photoUri
                                  ? editPhotoUriDraft
                                  : undefined,
                              track: editTrackDraft,
                            }),
                          ).then(() => {
                            resetEditDraft();
                          });
                        }}
                      >
                        <AppText className="text-xs font-semibold text-soundlog-inverse">
                          {isActionPending ? '저장 중' : '저장'}
                        </AppText>
                      </Pressable>
                      <Pressable
                        accessibilityLabel={`${actionLabelPrefix} 리캡 메모 수정 취소`}
                        accessibilityRole="button"
                        className="h-9 flex-1 items-center justify-center rounded-full border border-white/15"
                        disabled={isActionPending}
                        onPress={resetEditDraft}
                      >
                        <AppText className="text-xs font-semibold text-white/75">취소</AppText>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View className="mt-3 flex-row gap-2">
                    <Pressable
                      accessibilityLabel={`${actionLabelPrefix} 리캡 수정`}
                      accessibilityRole="button"
                      className="h-8 flex-1 items-center justify-center rounded-full border border-white/10 bg-white/10"
                      disabled={isActionPending}
                      onPress={() => {
                        setEditingMomentId(log.id);
                        setEditMoodDraft(log.moodTags);
                        setEditNoteDraft(log.note ?? '');
                        setEditPhotoMessage(undefined);
                        setEditPhotoUriDraft(log.photoUri);
                        setEditPlaceDraft(log.placeName ?? '');
                        setEditTrackDraft(log.track);
                      }}
                    >
                      <AppText className="text-xs font-semibold text-white/75">수정</AppText>
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`${actionLabelPrefix} 리캡 삭제`}
                      accessibilityRole="button"
                      className="h-8 flex-1 items-center justify-center rounded-full border border-red-300/20 bg-red-300/10"
                      disabled={isActionPending}
                      onPress={() => void onDeleteMoment(log)}
                    >
                      <AppText className="text-xs font-semibold text-red-100">
                        {isActionPending ? '삭제 중' : '삭제'}
                      </AppText>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {canSelectRecapTemplate ? (
        <View className="mt-4">
          <AppText className="mb-3 text-[11px] font-semibold text-white/45">
            로그 템플릿
          </AppText>
          <RecapTemplateSelector
            onSelect={onSelectRecapTemplate}
            selectedTemplate={selectedRecapTemplate}
          />
        </View>
      ) : null}

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
  useTravelRouteTracking();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ focus?: string | string[]; focusAt?: string | string[] }>();
  const focusTarget = Array.isArray(params.focus) ? params.focus[0] : params.focus;
  const focusAt = Array.isArray(params.focusAt) ? params.focusAt[0] : params.focusAt;
  const scrollRef = useRef<ScrollView | null>(null);
  const [isModeSheetVisible, setIsModeSheetVisible] = useState(false);
  const [isEndConfirmVisible, setIsEndConfirmVisible] = useState(false);
  const [isStartingTravel, setIsStartingTravel] = useState(false);
  const [isCreatingRecap, setIsCreatingRecap] = useState(false);
  const [pendingMomentActionId, setPendingMomentActionId] = useState<string>();
  const [isSyncingMomentUploads, setIsSyncingMomentUploads] = useState(false);
  const [isSyncingPendingActions, setIsSyncingPendingActions] = useState(false);
  const [recapMessage, setRecapMessage] = useState<string>();
  const [selectedRecapTemplate, setSelectedRecapTemplate] =
    useState<RecapTemplateId>('album');
  const [soundMapSectionY, setSoundMapSectionY] = useState<number>();
  const [clockTick, setClockTick] = useState(0);
  const authStatus = useAuthStore((state) => state.status);
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
  const {
    logs: momentLogs,
    mergeServerLogs,
    pendingActions,
    queueCreate,
    queueDelete,
    queueEdit,
    removePendingAction,
    removeLog,
    resolveLocalLog,
    updateLog,
  } = useMomentLogStore();
  const pendingCreateActions = useMemo(
    () => pendingActions.filter((action) => action.type === 'create'),
    [pendingActions],
  );
  const pendingChangeActions = useMemo(
    () => pendingActions.filter((action) => action.type !== 'create'),
    [pendingActions],
  );
  const pendingActionCount = pendingChangeActions.length;
  const stalePendingCreateMomentIds = useMemo(() => {
    const staleThresholdMs = 60 * 1000;
    const now = Date.now();

    return new Set(
      pendingCreateActions
        .filter((action) => now - new Date(action.queuedAt).getTime() > staleThresholdMs)
        .map((action) => action.momentLogId),
    );
  }, [clockTick, pendingCreateActions]);
  const momentLogListParams = useMemo(() => ({ limit: 50 }), []);
  const {
    data: serverMomentLogs,
    isError: isMomentLogSyncError,
    isFetching: isMomentLogSyncing,
    refetch: refetchMomentLogs,
  } = useMomentLogListQuery(momentLogListParams, {
    enabled: authStatus === 'authenticated',
  });
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
  const unsyncedMomentUploads = useMemo(
    () =>
      travelLogMoments.filter(
        (log) =>
          log.syncStatus === 'failed' ||
          log.syncStatus === 'local' ||
          (log.syncStatus === 'pending' && stalePendingCreateMomentIds.has(log.id)),
      ),
    [stalePendingCreateMomentIds, travelLogMoments],
  );
  const pendingMomentUploadCount = useMemo(
    () =>
      travelLogMoments.filter(
        (log) => log.syncStatus === 'pending' && !stalePendingCreateMomentIds.has(log.id),
      ).length,
    [stalePendingCreateMomentIds, travelLogMoments],
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

  useEffect(() => {
    if (authStatus !== 'authenticated' || !serverMomentLogs) {
      return;
    }

    mergeServerLogs(serverMomentLogs);
  }, [authStatus, mergeServerLogs, serverMomentLogs]);

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
      const startLocation = currentLocation ?? currentPlace?.location;
      const startedAt = new Date().toISOString();
      const initialRoutePoints = startLocation
        ? [createRoutePoint(startLocation, new Date(startedAt))]
        : undefined;
      const serverSession = await travelSessionApi.createTravelSession({
        location: startLocation,
        routePoints: initialRoutePoints,
        startedAt,
        travelMode: nextMode,
      });

      startSession({
        id: serverSession?.id,
        routePoints: serverSession?.routePoints ?? initialRoutePoints,
        startedAt: serverSession?.startedAt ?? startedAt,
      });
    } catch {
      const startLocation = currentLocation ?? currentPlace?.location;
      const startedAt = new Date().toISOString();

      startSession({
        routePoints: startLocation
          ? [createRoutePoint(startLocation, new Date(startedAt))]
          : undefined,
        startedAt,
      });
      setRecapMessage('서버 여행 세션 연결에 실패해서 로컬 세션으로 먼저 시작했어요.');
    } finally {
      setIsStartingTravel(false);
      setIsModeSheetVisible(false);
    }
  };
  const handleSubmitTravelMode = async () => {
    if (session.status === 'active') {
      setIsModeSheetVisible(false);
      setRecapMessage('현재 여행 상태를 수정했어요. 다음 추천과 리캡에 반영돼요.');
      return;
    }

    await handleStartTravel();
  };
  const retryMomentLog = async (log: MomentLog) => {
    if (log.syncStatus === 'pending' && !stalePendingCreateMomentIds.has(log.id)) {
      return false;
    }

    const queuedCreateAction = pendingCreateActions.find(
      (action) => action.momentLogId === log.id,
    );
    const createPayload = queuedCreateAction?.payload ?? momentLogCreatePayloadFromLog(log);

    queueCreate(log.id, createPayload);
    updateLog(log.id, { syncStatus: 'pending' });

    try {
      const serverLog = await momentLogApi.createMomentLog({
        ...createPayload,
        idempotencyKey: log.id,
      });

      if (!serverLog) {
        updateLog(log.id, { syncStatus: 'local' });
        return false;
      }

      resolveLocalLog(log.id, serverLog);
      await queryClient.invalidateQueries({ queryKey: momentLogQueryKeys.all });
      return true;
    } catch {
      queueCreate(log.id, createPayload);
      updateLog(log.id, { syncStatus: 'failed' });
      return false;
    }
  };
  const handleRetryUnsyncedMomentUploads = async () => {
    if (isSyncingMomentUploads || unsyncedMomentUploads.length === 0) {
      return;
    }

    setIsSyncingMomentUploads(true);

    let failureCount = 0;

    try {
      for (const log of [...unsyncedMomentUploads]) {
        const didSync = await retryMomentLog(log);

        if (!didSync) {
          failureCount += 1;
        }
      }

      await queryClient.invalidateQueries({ queryKey: momentLogQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
      setRecapMessage(
        failureCount === 0
          ? '대기 중인 리캡 업로드를 모두 동기화했어요.'
          : `리캡 ${failureCount}개는 아직 서버에 올리지 못했어요.`,
      );
    } finally {
      setIsSyncingMomentUploads(false);
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
        routePoints: session.routePoints,
      });
    } catch {
      setRecapMessage('서버 여행 세션 종료 동기화에 실패했지만 로컬 로그는 계속 만들 수 있어요.');
    }

    if (logsForSession.length === 0) {
      setSessionRecapId(undefined);
      setRecapMessage('저장한 리캡이 없어 빈 로그 화면으로 이동할 수 있어요.');
      return;
    }

    const syncedLogs = logsForSession.filter((log) => log.syncStatus === 'synced');
    const hasOnlySyncedLogs = syncedLogs.length === logsForSession.length;
    const representativeTrackId = logsForSession.find((log) => log.track?.id)?.track?.id;

    if (!hasOnlySyncedLogs) {
      setSessionRecapId(localRecapId);
      setRecapMessage('아직 동기화되지 않은 리캡이 있어 로컬 로그로 먼저 만들었어요.');
      router.push(`/recap-share/${localRecapId}`);
      return;
    }

    setIsCreatingRecap(true);

    try {
      const serverRecap = await recapApi.createRecap({
        momentLogIds: syncedLogs.map((log) => log.id),
        representativeTrackId,
        routePoints: session.routePoints,
        sessionId: endedSessionId,
        templateId: selectedRecapTemplate,
        title: `${logsForSession[0]?.placeName ?? '여행'} 로그`,
        visibility: 'private',
      });
      const recapId = serverRecap?.id ?? localRecapId;

      setSessionRecapId(recapId);
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
      router.push(`/recap-share/${recapId}`);
    } catch {
      setSessionRecapId(localRecapId);
      setRecapMessage('서버 로그 생성이 실패해서 로컬 로그로 먼저 보여드릴게요.');
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
  const handleDeleteMoment = async (moment: MomentLog) => {
    if (pendingMomentActionId) {
      return;
    }

    setPendingMomentActionId(moment.id);

    try {
      let deletedOnServer = false;

      if (moment.syncStatus === 'synced') {
        deletedOnServer = Boolean(await momentLogApi.deleteMomentLog(moment.id));

        if (!deletedOnServer) {
          throw new Error('Recap capture delete was not accepted by the server.');
        }
      }

      removeLog(moment.id);
      await queryClient.invalidateQueries({ queryKey: momentLogQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
      setRecapMessage(
        deletedOnServer
          ? '서버와 여행 로그에서 리캡을 삭제했어요.'
          : '로컬 여행 로그에서 리캡을 삭제했어요.',
      );
    } catch {
      if (moment.syncStatus === 'synced') {
        queueDelete(moment);
        setRecapMessage('서버 리캡 삭제에 실패해서 동기화 대기열에 저장했어요.');
      } else {
        setRecapMessage('리캡 삭제에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setPendingMomentActionId(undefined);
    }
  };
  const handleEditMoment = async (moment: MomentLog, draft: MomentLogEditDraft) => {
    if (pendingMomentActionId) {
      return;
    }

    const editPayload: MomentLogEditQueuePayload = {
      moodTags: draft.moodTags,
      note: draft.note?.trim() || null,
      placeName: draft.placeName?.trim() || null,
      removePhoto: draft.removePhoto,
      replacePhotoUri: draft.removePhoto ? undefined : draft.replacePhotoUri,
      track: draft.track,
    };
    const nextPatch = momentLogPatchFromPayload(moment, editPayload);

    setPendingMomentActionId(moment.id);

    try {
      if (moment.syncStatus === 'synced') {
        if (draft.removePhoto) {
          await momentLogApi.deleteMomentLogPhoto(moment.id);
        } else if (draft.replacePhotoUri) {
          await momentLogApi.updateMomentLogPhoto(moment.id, draft.replacePhotoUri);
        }

        const serverLog = await momentLogApi.updateMomentLog(moment.id, {
          moodTags: editPayload.moodTags,
          note: editPayload.note,
          placeName: editPayload.placeName,
          track: editPayload.track,
        });

        if (serverLog) {
          updateLog(moment.id, serverLog);
        } else {
          throw new Error('Recap capture edit was not accepted by the server.');
        }
      } else {
        updateLog(moment.id, nextPatch);
        queueCreate(moment.id, momentLogCreatePayloadFromLog({ ...moment, ...nextPatch }));
      }

      await queryClient.invalidateQueries({ queryKey: momentLogQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
      setRecapMessage('리캡 정보를 수정했어요.');
    } catch {
      if (moment.syncStatus === 'synced') {
        updateLog(moment.id, nextPatch);
        queueEdit(moment.id, editPayload);
        setRecapMessage('서버 리캡 수정에 실패해서 동기화 대기열에 저장했어요.');
      } else {
        setRecapMessage('리캡 수정에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setPendingMomentActionId(undefined);
    }
  };
  const syncPendingMomentAction = async (action: MomentLogPendingAction) => {
    if (action.type === 'create') {
      const localMoment = momentLogs.find((moment) => moment.id === action.momentLogId);

      if (!localMoment) {
        removePendingAction(action.id);
        return;
      }

      updateLog(action.momentLogId, { syncStatus: 'pending' });

      const serverLog = await momentLogApi.createMomentLog({
        ...action.payload,
        idempotencyKey: action.momentLogId,
      });

      if (!serverLog) {
        updateLog(action.momentLogId, { syncStatus: 'local' });
        throw new Error('Queued recap capture create was not accepted by the server.');
      }

      resolveLocalLog(action.momentLogId, serverLog);
      return;
    }

    if (action.type === 'delete') {
      try {
        const accepted = await momentLogApi.deleteMomentLog(action.momentLogId);

        if (!accepted) {
          throw new Error('Queued recap capture delete was not accepted by the server.');
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          removePendingAction(action.id);
          return;
        }

        throw error;
      }

      removePendingAction(action.id);
      return;
    }

    const localMoment = momentLogs.find((moment) => moment.id === action.momentLogId);

    if (!localMoment) {
      removePendingAction(action.id);
      return;
    }

    if (action.payload.removePhoto) {
      const photoDeletedLog = await momentLogApi.deleteMomentLogPhoto(action.momentLogId);

      if (!photoDeletedLog) {
        throw new Error('Queued recap capture photo delete was not accepted by the server.');
      }
    } else if (action.payload.replacePhotoUri) {
      const photoUpdatedLog = await momentLogApi.updateMomentLogPhoto(
        action.momentLogId,
        action.payload.replacePhotoUri,
      );

      if (!photoUpdatedLog) {
        throw new Error('Queued recap capture photo update was not accepted by the server.');
      }
    }

    const serverLog = await momentLogApi.updateMomentLog(action.momentLogId, {
      moodTags: action.payload.moodTags,
      note: action.payload.note,
      placeName: action.payload.placeName,
      track: action.payload.track,
    });

    if (!serverLog) {
      throw new Error('Queued recap capture edit was not accepted by the server.');
    }

    updateLog(action.momentLogId, serverLog);
    removePendingAction(action.id);
  };
  const handleRetryPendingMomentActions = async () => {
    if (isSyncingPendingActions || pendingActions.length === 0) {
      return;
    }

    setIsSyncingPendingActions(true);

    let failureCount = 0;

    try {
      for (const action of [...pendingChangeActions]) {
        try {
          await syncPendingMomentAction(action);
        } catch {
          failureCount += 1;
        }
      }

      await queryClient.invalidateQueries({ queryKey: momentLogQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
      setRecapMessage(
        failureCount === 0
          ? '대기 중인 리캡 변경을 모두 동기화했어요.'
          : `리캡 변경 ${failureCount}개는 아직 동기화하지 못했어요.`,
      );
    } finally {
      setIsSyncingPendingActions(false);
    }
  };
  const handleCommunityRecapCreated = async (recap: { id: string }) => {
    setSessionRecapId(recap.id);
    await queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
    router.push(`/recap-share/${recap.id}`);
  };

  useEffect(() => {
    if (focusTarget !== LIVE_SOUND_MAP_FOCUS || soundMapSectionY === undefined) {
      return;
    }

    const timeoutId = setTimeout(() => {
      scrollRef.current?.scrollTo({
        animated: true,
        y: Math.max(0, soundMapSectionY - LIVE_SOUND_MAP_SCROLL_OFFSET),
      });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [focusAt, focusTarget, soundMapSectionY]);

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: getHomeContentBottomPadding(insets.bottom, Boolean(currentTrack)),
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <AppText className="text-[13px] font-semibold text-soundlog-lime">
            장소에 남기는 사운드 로그
          </AppText>
          <AppText className="mt-2 text-[34px] font-semibold leading-10 text-white">
            여행모드
          </AppText>
        </View>

        <TravelStatusCard
          currentPlace={currentPlace}
          currentTrack={currentTrack}
          endedAt={session.endedAt}
          isCreatingRecap={isCreatingRecap}
          momentCount={momentCount}
          onEndTravel={() => setIsEndConfirmVisible(true)}
          onEditTravelState={openModeSheet}
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

        {authStatus === 'authenticated' && isMomentLogSyncError ? (
          <View className="mt-4 rounded-[16px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
            <AppText className="text-sm leading-5 text-amber-50">
              서버 여행 로그를 불러오지 못했어요. 로컬에 저장된 리캡을 먼저 보여드릴게요.
            </AppText>
            <Pressable
              accessibilityRole="button"
              className="mt-3 h-9 items-center justify-center rounded-full bg-white/10"
              onPress={() => void refetchMomentLogs()}
            >
              <AppText className="text-xs font-semibold text-white/75">다시 동기화</AppText>
            </Pressable>
          </View>
        ) : authStatus === 'authenticated' && isMomentLogSyncing ? (
          <View className="mt-4 rounded-[16px] border border-white/10 bg-white/10 px-4 py-3">
            <AppText className="text-sm leading-5 text-white/60">
              서버 여행 로그를 동기화하고 있어요.
            </AppText>
          </View>
        ) : null}

        {unsyncedMomentUploads.length > 0 || pendingMomentUploadCount > 0 ? (
          <View className="mt-4 rounded-[16px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
            <AppText className="text-sm leading-5 text-amber-50">
              {pendingMomentUploadCount > 0
                ? `리캡 ${pendingMomentUploadCount}개를 서버에 올리는 중이에요.`
                : `서버에 아직 올라가지 않은 리캡 ${unsyncedMomentUploads.length}개가 있어요.`}
            </AppText>
            {unsyncedMomentUploads.length > 0 ? (
              authStatus === 'authenticated' ? (
                <Pressable
                  accessibilityRole="button"
                  className="mt-3 h-9 items-center justify-center rounded-full bg-white/10"
                  disabled={isSyncingMomentUploads}
                  onPress={() => void handleRetryUnsyncedMomentUploads()}
                >
                  <AppText className="text-xs font-semibold text-white/75">
                    {isSyncingMomentUploads ? '업로드 중' : '지금 업로드'}
                  </AppText>
                </Pressable>
              ) : (
                <AppText className="mt-2 text-xs leading-5 text-amber-50/70">
                  로그인하면 로컬에 남긴 리캡을 서버에 동기화할 수 있어요.
                </AppText>
              )
            ) : null}
          </View>
        ) : null}

        {pendingActionCount > 0 ? (
          <View className="mt-4 rounded-[16px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
            <AppText className="text-sm leading-5 text-amber-50">
              서버에 아직 반영되지 않은 리캡 변경 {pendingActionCount}개가 있어요.
            </AppText>
            <Pressable
              accessibilityRole="button"
              className="mt-3 h-9 items-center justify-center rounded-full bg-white/10"
              disabled={isSyncingPendingActions}
              onPress={() => void handleRetryPendingMomentActions()}
            >
              <AppText className="text-xs font-semibold text-white/75">
                {isSyncingPendingActions ? '동기화 중' : '지금 동기화'}
              </AppText>
            </Pressable>
          </View>
        ) : null}

        <TravelLogSummaryCard
          currentTrack={currentTrack}
          logs={travelLogMoments}
          momentCount={travelLogMomentCount}
          onCreateRecap={handleCreateTravelLogRecap}
          onDeleteMoment={handleDeleteMoment}
          onEditMoment={handleEditMoment}
          onOpenMoment={(moment) => router.push(`/recap-share/${moment.id}`)}
          onSelectRecapTemplate={setSelectedRecapTemplate}
          pendingMomentActionId={pendingMomentActionId}
          selectedRecapTemplate={selectedRecapTemplate}
          sessionStatus={session.status}
          trackCount={travelLogTrackCount}
        />

        <View onLayout={(event) => setSoundMapSectionY(event.nativeEvent.layout.y)}>
          <RecapMapSection
            currentLocation={currentLocation}
            currentPlace={currentPlace}
            onCreateMoment={() => router.push('/camera')}
            onOpenRecap={(recapId) => router.push(`/recap-share/${recapId}`)}
            onStartTravel={openModeSheet}
            sessionStatus={session.status}
          />
        </View>

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
              <AppText className="text-xl font-semibold text-white">최근 리캡</AppText>
              <AppText className="mt-1 text-xs text-white/45">여행 중 직접 저장한 리캡</AppText>
            </View>
            <Pressable accessibilityRole="button" onPress={() => router.push('/library')}>
              <AppText className="text-xs font-semibold text-soundlog-lime">더보기</AppText>
            </Pressable>
          </View>

          <View className="mt-4 gap-3">
            {moments.length === 0 ? (
              <View className="rounded-[18px] border border-white/10 bg-white/10 p-4">
                <AppText className="text-sm leading-6 text-white/60">
                  아직 저장한 리캡이 없어요. 여행 중 카메라 버튼으로 첫 리캡을 남겨보세요.
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
              <AppText className="text-xl font-semibold text-white">여행 로그</AppText>
              <AppText className="mt-1 text-xs text-white/45">
                여행별 리캡과 음악 요약
              </AppText>
            </View>
          </View>

          <View className="mt-4 gap-3">
            {localRecaps.length === 0 ? (
              <View className="rounded-[18px] border border-white/10 bg-white/10 p-4">
                <AppText className="text-sm leading-6 text-white/60">
                  여행이 끝나면 저장한 리캡들이 하나의 로그로 묶여요.
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
        onStart={() => void handleSubmitTravelMode()}
        selectedMode={selectedMode}
        submitLabel={session.status === 'active' ? '여행 상태 저장' : '여행 시작'}
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
