import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ApiError } from '@/api/client';
import { communityApi } from '@/api/communityApi';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { useAuthStore } from '@/store/authStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import type {
  GeoPoint,
  MusicMatch,
  PlaceContext,
  SoundMapPin as ServerSoundMapPin,
  Track,
  TravelMateRequest,
  TravelMode,
} from '@/types/domain';
import { formatPlaceLabel } from '@/utils/placeLabel';

import { SoundMapView } from './SoundMapView';
import {
  createFallbackMusicMatches,
  createSoundMapCenter,
  createSoundMapPins,
} from './soundMapData';
import type { SoundMapPin, SoundMapVisibility } from './types';
import { modeLabelByValue } from '../travelData';

type LiveSoundMapSectionProps = {
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  currentTrack?: Track;
  selectedMode?: TravelMode;
  sessionId: string;
  sessionStatus: 'active' | 'ended' | 'idle';
};

const visibilityOptions: Array<{ label: string; value: SoundMapVisibility }> = [
  { label: '동행자만', value: 'companions' },
  { label: '주변 익명', value: 'nearby' },
  { label: '비공개', value: 'private' },
];

const visibilityCopy: Record<SoundMapVisibility, { description: string; title: string }> = {
  companions: {
    description: '같은 여행방에 있는 동행자에게만 현재 음악 핀을 보여줘요.',
    title: '동행자 공개',
  },
  nearby: {
    description: '정확한 좌표 대신 대략 위치와 음악 취향만 주변 여행자에게 보여줘요.',
    title: '주변 익명 공개',
  },
  private: {
    description: '내 지도에는 보이지만 다른 사람에게는 현재 음악 핀을 공개하지 않아요.',
    title: '비공개',
  },
};

const mateRequestMessageLabel: Record<TravelMateRequest['messageTemplate'], string> = {
  cafe_together: '근처 카페 산책 코스 같이 볼까요?',
  liked_track: '이 곡 좋아해서 눌렀어요',
  walk_together: '근처 산책 코스 같이 볼까요?',
};

type SoundMapPublishState = 'blocked' | 'failed' | 'idle' | 'private' | 'synced' | 'syncing';

function createProfileSummary(match: MusicMatch) {
  return [
    ...match.pin.profile.preferredMoods.slice(0, 1),
    ...match.pin.profile.preferredGenres.slice(0, 1),
    ...match.pin.profile.travelStyles.slice(0, 1),
  ]
    .filter(Boolean)
    .join(' · ') || '취향 공개';
}

function getMateRequestErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.message) {
    return error.message;
  }

  return '동행 요청을 보내지 못했어요. 잠시 후 다시 시도해주세요.';
}

export function LiveSoundMapSection({
  currentLocation,
  currentPlace,
  currentTrack,
  selectedMode,
  sessionId,
  sessionStatus,
}: LiveSoundMapSectionProps) {
  const [visibility, setVisibility] = useState<SoundMapVisibility>('companions');
  const [serverPins, setServerPins] = useState<ServerSoundMapPin[]>([]);
  const [matches, setMatches] = useState<MusicMatch[]>([]);
  const [mapMessage, setMapMessage] = useState<string>();
  const [isLoadingMateRequests, setIsLoadingMateRequests] = useState(false);
  const [mateRequests, setMateRequests] = useState<TravelMateRequest[]>([]);
  const [requestedMatchIds, setRequestedMatchIds] = useState<Record<string, string>>({});
  const [hiddenMatchIds, setHiddenMatchIds] = useState<Record<string, true>>({});
  const [pendingMatchId, setPendingMatchId] = useState<string>();
  const [pendingMateRequestActionId, setPendingMateRequestActionId] = useState<string>();
  const [publishState, setPublishState] = useState<SoundMapPublishState>('idle');
  const authStatus = useAuthStore((state) => state.status);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const addEvent = useRecommendationEventStore((state) => state.addEvent);
  const center = useMemo(
    () => createSoundMapCenter(currentLocation, currentPlace),
    [currentLocation, currentPlace],
  );
  const isTravelActive = sessionStatus === 'active';
  const syncLocation = currentLocation ?? currentPlace?.location;
  const locationLabel = currentPlace?.title ?? formatPlaceLabel(center);
  const currentTrackLabel = currentTrack
    ? `${currentTrack.title} - ${currentTrack.artist}`
    : '선택한 곡 없음';
  const visibilityMessage = visibilityCopy[visibility];
  const canSyncSoundMap = isTravelActive && authStatus === 'authenticated';
  const canPublishNearby = canSyncSoundMap && Boolean(syncLocation) && Boolean(currentTrack);
  const canPublishCurrentTrack =
    canSyncSoundMap && Boolean(syncLocation) && Boolean(currentTrack) && visibility !== 'private';
  const liveStatus = !isTravelActive
    ? 'off'
    : authStatus !== 'authenticated'
      ? 'preview'
      : visibility === 'private'
        ? 'private'
        : !syncLocation
          ? 'locationMissing'
          : !currentTrack
            ? 'trackMissing'
            : publishState === 'syncing'
              ? 'syncing'
              : publishState === 'failed'
                ? 'failed'
                : publishState === 'synced'
                  ? 'live'
                  : 'ready';
  const isLive = liveStatus === 'live';
  const liveStatusCopy = {
    failed: {
      badge: 'RETRY',
      description: '서버에 공개 상태를 저장하지 못했어요. 네트워크가 회복되면 다시 시도할 수 있어요.',
      title: '공개 실패',
    },
    live: {
      badge: 'LIVE',
      description: visibilityMessage.description,
      title: visibilityMessage.title,
    },
    locationMissing: {
      badge: 'READY',
      description: '현재 위치나 장소 좌표가 있어야 지도에 음악 핀을 남길 수 있어요.',
      title: '위치 필요',
    },
    off: {
      badge: 'OFF',
      description: '여행을 시작하면 현재 위치와 Soundlog에서 선택한 음악을 지도에 표시할 수 있어요.',
      title: '여행 모드 OFF',
    },
    preview: {
      badge: 'PREVIEW',
      description: '로그인하면 서버 지도에 현재 음악을 공개할 수 있어요. 지금은 로컬 미리보기예요.',
      title: '미리보기',
    },
    private: {
      badge: 'PRIVATE',
      description: visibilityMessage.description,
      title: visibilityMessage.title,
    },
    ready: {
      badge: 'READY',
      description: '현재 공개 범위를 서버에 저장하는 중이에요.',
      title: visibilityMessage.title,
    },
    syncing: {
      badge: 'SYNC',
      description: '현재 곡과 위치 공개 범위를 서버에 저장하고 있어요.',
      title: visibilityMessage.title,
    },
    trackMissing: {
      badge: 'READY',
      description: '추천 플레이리스트에서 곡을 선택하거나 외부 링크를 열면 현재 음악으로 공개할 수 있어요.',
      title: '현재 곡 없음',
    },
  }[liveStatus];
  const statusBadgeClassName = isLive
    ? 'bg-soundlog-lime'
    : liveStatus === 'failed'
      ? 'bg-amber-300/15'
      : 'bg-white/10';
  const statusBadgeTextClassName = isLive
    ? 'text-soundlog-inverse'
    : liveStatus === 'failed'
      ? 'text-amber-100'
      : 'text-white/55';
  const statusIconName = isLive
    ? 'radio'
    : liveStatus === 'syncing'
      ? 'upload-cloud'
      : liveStatus === 'trackMissing'
        ? 'music'
        : liveStatus === 'locationMissing'
          ? 'map-pin'
          : liveStatus === 'failed'
            ? 'alert-circle'
            : 'lock';
  const statusIconColor = isLive
    ? '#B7E628'
    : liveStatus === 'failed'
      ? '#FDE68A'
      : 'rgba(255,255,255,0.72)';
  const statusPillLabel = isLive
    ? '표시중'
    : liveStatus === 'syncing'
      ? '동기화'
      : liveStatus === 'private'
        ? '숨김'
        : liveStatus === 'failed'
          ? '재시도'
          : liveStatus === 'preview'
            ? '미리보기'
            : undefined;
  const nearbyCtaTitle = canPublishNearby ? '주변 사운드 취향 보기' : '주변 사운드 취향 미리보기';
  const nearbyCtaDescription = canPublishNearby
    ? '대략 위치와 현재 음악만 공개하고 취향이 맞는 여행자를 찾아요.'
    : '로그인, 여행 모드, 위치, 현재 곡이 준비되면 주변 익명 공개로 전환돼요.';
  const shouldShowPreviewPeers = !canSyncSoundMap && !canPublishCurrentTrack;
  const fallbackMatches = useMemo(
    () =>
      createFallbackMusicMatches({
        center,
        currentTrack,
        place: currentPlace,
        selectedMode,
      }),
    [center, currentPlace, currentTrack, selectedMode],
  );
  const activeMatches =
    visibility === 'nearby' && matches.length === 0 && shouldShowPreviewPeers
      ? fallbackMatches
      : matches;
  const visibleMatches = activeMatches.filter((match) => !hiddenMatchIds[match.id]).slice(0, 2);
  const pendingMateRequests = mateRequests
    .filter((request) => request.status === 'pending')
    .slice(0, 3);
  const selectedModeLabel = selectedMode ? modeLabelByValue[selectedMode] : '산책';
  const matchModeTabs = Array.from(new Set([selectedModeLabel, '카페', '야경'])).slice(0, 3);
  const pins = useMemo(() => {
    const matchScoreByPinId = new Map(matches.map((match) => [match.targetPinId, match.matchScore]));
    const serverVisualPins = serverPins.map((pin) => toVisualPin(pin, matchScoreByPinId.get(pin.id)));
    const knownPinIds = new Set(serverVisualPins.map((pin) => pin.id));
    const matchVisualPins = matches
      .filter((match) => !knownPinIds.has(match.pin.id))
      .map((match) => toVisualPin(match.pin, match.matchScore));

    if (serverVisualPins.length > 0 || matchVisualPins.length > 0) {
      return [...serverVisualPins, ...matchVisualPins];
    }

    return createSoundMapPins({
      center,
      currentTrack,
      includePreviewPeers: shouldShowPreviewPeers,
      visibility,
    });
  }, [center, currentTrack, matches, serverPins, shouldShowPreviewPeers, visibility]);

  useEffect(() => {
    if (!canSyncSoundMap) {
      setServerPins([]);
      setMatches([]);
      setMateRequests([]);
      return;
    }

    let ignore = false;
    const query = syncLocation
      ? { lat: syncLocation.lat, lng: syncLocation.lng, radiusMeters: 3000 }
      : { radiusMeters: 3000 };

    communityApi
      .getSoundMap(query)
      .then((nextPins) => {
        if (!ignore) {
          setServerPins(nextPins);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMapMessage('사운드맵 서버 핀을 불러오지 못해 로컬 미리보기로 보여드려요.');
        }
      });

    if (visibility === 'nearby') {
      communityApi
        .getMusicMatches(query)
        .then((nextMatches) => {
          if (!ignore) {
            setMatches(nextMatches);
          }
        })
        .catch(() => {
          if (!ignore) {
            setMatches([]);
          }
        });
    } else {
      setMatches([]);
    }

    return () => {
      ignore = true;
    };
  }, [canSyncSoundMap, syncLocation?.lat, syncLocation?.lng, visibility]);

  useEffect(() => {
    if (!canSyncSoundMap) {
      setMateRequests([]);
      return;
    }

    let ignore = false;

    setIsLoadingMateRequests(true);
    communityApi
      .getTravelMateRequests({ box: 'all', limit: 6, status: 'pending' })
      .then((requests) => {
        if (!ignore) {
          setMateRequests(requests);
        }
      })
      .catch(() => {
        if (!ignore) {
          setMapMessage('동행 요청함을 불러오지 못했어요.');
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingMateRequests(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [canSyncSoundMap]);

  useEffect(() => {
    if (!canSyncSoundMap) {
      setPublishState(isTravelActive ? 'blocked' : 'idle');
      return;
    }

    if (!syncLocation) {
      setPublishState('blocked');
      return;
    }

    if (!currentTrack && visibility !== 'private') {
      setPublishState('blocked');
      return;
    }

    let ignore = false;

    setPublishState(visibility === 'private' ? 'private' : 'syncing');
    communityApi
      .upsertCurrentTrack({
        artistName: currentTrack?.artist,
        location: syncLocation,
        moodTags: [],
        placeName: currentPlace?.title,
        sessionId,
        trackId: currentTrack?.id,
        trackTitle: currentTrack?.title,
        travelMode: selectedMode,
        visibility,
      })
      .then((pin) => {
        if (!pin || ignore) {
          return;
        }

        setServerPins((pins) => [pin, ...pins.filter((item) => item.id !== pin.id)]);
        setMapMessage(undefined);
        setPublishState(visibility === 'private' ? 'private' : 'synced');
      })
      .catch(() => {
        if (!ignore) {
          setMapMessage('현재 곡 공개 상태를 서버에 저장하지 못했어요.');
          setPublishState('failed');
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    authStatus,
    canSyncSoundMap,
    currentPlace?.title,
    currentTrack?.artist,
    currentTrack?.id,
    currentTrack?.title,
    isTravelActive,
    selectedMode,
    sessionId,
    syncLocation,
    visibility,
  ]);

  const handleVisibilityPress = (nextVisibility: SoundMapVisibility) => {
    setVisibility(nextVisibility);

    if (!isTravelActive || !currentTrack || nextVisibility === 'private') {
      return;
    }

    const event = addEvent({
      context: {
        placeId: currentPlace?.id,
        placeName: currentPlace?.title,
      },
      trackId: currentTrack.id,
      type: nextVisibility === 'nearby' ? 'nearby_sound_opened' : 'live_track_shared',
      value: nextVisibility,
    });

    syncRecommendationEvent(event);
  };
  const handleMateRequest = async (match: MusicMatch) => {
    if (pendingMatchId) {
      return;
    }

    setPendingMatchId(match.id);
    setMapMessage(undefined);

    try {
      const request = await communityApi.createTravelMateRequest({
        messageTemplate: 'liked_track',
        targetPinId: match.targetPinId,
      });

      if (!request) {
        setMapMessage('로그인된 서버 세션에서 동행 요청을 보낼 수 있어요.');
        return;
      }

      setRequestedMatchIds((state) => ({ ...state, [match.id]: request.id }));
      setMateRequests((requests) => [
        request,
        ...requests.filter((item) => item.id !== request.id),
      ]);
      setMapMessage('동행 요청을 보냈어요. 상대가 수락하기 전까지 연락처와 정확한 위치는 숨겨져요.');
    } catch (error) {
      setMapMessage(getMateRequestErrorMessage(error));
    } finally {
      setPendingMatchId(undefined);
    }
  };
  const handleReportAndBlockMatch = async (match: MusicMatch) => {
    try {
      await communityApi.reportTarget({
        reason: 'safety',
        targetPinId: match.targetPinId,
      });
      await communityApi.blockUser({ targetPinId: match.targetPinId });
      setHiddenMatchIds((state) => ({ ...state, [match.id]: true }));
      setMatches((items) => items.filter((item) => item.id !== match.id));
      setServerPins((items) => items.filter((item) => item.id !== match.targetPinId));
      setMapMessage('차단/신고를 접수했어요. 해당 여행자의 공개 음악은 더 이상 추천에 보이지 않아요.');
    } catch {
      setMapMessage('차단/신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };
  const handleUpdateMateRequest = async (
    request: TravelMateRequest,
    action: 'accept' | 'cancel' | 'decline',
  ) => {
    if (pendingMateRequestActionId) {
      return;
    }

    setPendingMateRequestActionId(request.id);
    setMapMessage(undefined);

    try {
      const updated = await communityApi.updateTravelMateRequest(request.id, action);

      if (!updated) {
        setMapMessage('로그인된 서버 세션에서 동행 요청을 처리할 수 있어요.');
        return;
      }

      setMateRequests((requests) =>
        updated.status === 'pending'
          ? requests.map((item) => (item.id === updated.id ? updated : item))
          : requests.filter((item) => item.id !== updated.id),
      );
      setMapMessage(
        action === 'accept'
          ? '동행 요청을 수락했어요. 정확한 위치와 연락처는 계속 선택 공개로 유지돼요.'
          : action === 'decline'
            ? '동행 요청을 거절했어요.'
            : '보낸 동행 요청을 취소했어요.',
      );
    } catch {
      setMapMessage('동행 요청 상태를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setPendingMateRequestActionId(undefined);
    }
  };

  return (
    <View className="mt-8 rounded-[28px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-2.5 w-2.5 rounded-full bg-soundlog-lime" />
            <AppText className="text-xs font-semibold text-soundlog-lime">
              Live Sound Map
            </AppText>
          </View>
          <AppText className="mt-3 text-[24px] font-semibold leading-8 text-white">
            지금 듣는 음악을 지도에 남겨요
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/60">
            여행 모드 중인 내 음악과 동행자/주변 익명 핀을 실제 지도 위에서 함께
            확인할 수 있어요.
          </AppText>
        </View>
        <View
          className={`rounded-full px-3 py-1.5 ${statusBadgeClassName}`}
        >
          <AppText
            className={`text-[11px] font-semibold ${statusBadgeTextClassName}`}
          >
            {liveStatusCopy.badge}
          </AppText>
        </View>
      </View>

      <View className="mt-5">
        <SoundMapView
          center={center}
          pins={pins}
          selectedTrack={currentTrack}
          sessionStatus={sessionStatus}
          visibility={visibility}
        />
      </View>

      {mapMessage ? (
        <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/60">{mapMessage}</AppText>
        </View>
      ) : null}

      <View className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Feather color={statusIconColor} name={statusIconName} size={18} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText className="mb-2 text-[11px] font-semibold text-white/40">
              내 현재 음악
            </AppText>
            <AppText className="text-sm font-semibold text-white">
              {liveStatusCopy.title}
            </AppText>
            <AppText className="mt-1 text-xs leading-5 text-white/55">
              {liveStatusCopy.description}
            </AppText>
            <AppText className="mt-2 text-xs text-white/40" numberOfLines={1}>
              {locationLabel} · {currentTrackLabel}
            </AppText>
          </View>
          {statusPillLabel ? (
            <View
              className={`rounded-full px-2.5 py-1 ${
                isLive ? 'bg-soundlog-lime' : 'bg-white/10'
              }`}
            >
              <AppText
                className={`text-[10px] font-semibold ${
                  isLive ? 'text-soundlog-inverse' : 'text-white/55'
                }`}
              >
                {statusPillLabel}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {visibilityOptions.map((option) => {
          const selected = visibility === option.value;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`min-h-[44px] flex-1 basis-[92px] items-center justify-center rounded-full border px-3 ${
                selected
                  ? 'border-soundlog-lime bg-soundlog-lime'
                  : 'border-white/10 bg-white/10'
              }`}
              key={option.value}
              onPress={() => handleVisibilityPress(option.value)}
            >
              <AppText
                className={`text-xs font-semibold ${
                  selected ? 'text-soundlog-inverse' : 'text-white/70'
                }`}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {canSyncSoundMap && (isLoadingMateRequests || pendingMateRequests.length > 0) ? (
        <View className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-sm font-semibold text-white">동행 요청함</AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/55">
                수락 전에는 연락처와 정확한 위치를 공개하지 않아요.
              </AppText>
            </View>
            <View className="rounded-full bg-white/10 px-2.5 py-1">
              <AppText className="text-[10px] font-semibold text-white/55">
                {isLoadingMateRequests ? '동기화' : `${pendingMateRequests.length}건`}
              </AppText>
            </View>
          </View>

          <View className="mt-3 gap-2">
            {pendingMateRequests.map((request) => {
              const isIncoming = request.targetUserId === currentUserId;
              const isBusy = pendingMateRequestActionId === request.id;

              return (
                <View
                  className="rounded-[16px] border border-white/10 bg-white/5 px-3 py-3"
                  key={request.id}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <AppText className="text-xs font-semibold text-white">
                        {isIncoming ? '받은 요청' : '보낸 요청 대기'}
                      </AppText>
                      <AppText className="mt-1 text-xs leading-5 text-white/55">
                        {mateRequestMessageLabel[request.messageTemplate]}
                      </AppText>
                    </View>
                    <View className="rounded-full bg-white/10 px-2.5 py-1">
                      <AppText className="text-[10px] font-semibold text-white/50">
                        대기중
                      </AppText>
                    </View>
                  </View>

                  <View className="mt-3 flex-row gap-2">
                    {isIncoming ? (
                      <>
                        <Pressable
                          accessibilityRole="button"
                          className="min-h-[38px] flex-1 items-center justify-center rounded-full bg-soundlog-lime px-3"
                          disabled={isBusy}
                          onPress={() => void handleUpdateMateRequest(request, 'accept')}
                          style={{ opacity: isBusy ? 0.55 : 1 }}
                        >
                          <AppText className="text-xs font-semibold text-soundlog-inverse">
                            {isBusy ? '처리 중' : '수락'}
                          </AppText>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          className="min-h-[38px] flex-1 items-center justify-center rounded-full border border-white/10 bg-white/10 px-3"
                          disabled={isBusy}
                          onPress={() => void handleUpdateMateRequest(request, 'decline')}
                          style={{ opacity: isBusy ? 0.55 : 1 }}
                        >
                          <AppText className="text-xs font-semibold text-white/70">
                            거절
                          </AppText>
                        </Pressable>
                      </>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        className="min-h-[38px] flex-1 items-center justify-center rounded-full border border-white/10 bg-white/10 px-3"
                        disabled={isBusy}
                        onPress={() => void handleUpdateMateRequest(request, 'cancel')}
                        style={{ opacity: isBusy ? 0.55 : 1 }}
                      >
                        <AppText className="text-xs font-semibold text-white/70">
                          {isBusy ? '취소 중' : '요청 취소'}
                        </AppText>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {visibility !== 'nearby' ? (
        <Pressable
          accessibilityRole="button"
          className="mt-4 rounded-[18px] border border-soundlog-lime/30 bg-soundlog-lime/10 p-4"
          onPress={() => handleVisibilityPress('nearby')}
        >
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-sm font-semibold text-white">{nearbyCtaTitle}</AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/55">
                {nearbyCtaDescription}
              </AppText>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-soundlog-lime">
              <Feather color="#050916" name="users" size={17} />
            </View>
          </View>
        </Pressable>
      ) : (
        <View className="mt-4 gap-3">
          <View>
            <AppText className="text-base font-semibold text-white">주변 사운드 취향</AppText>
            <AppText className="mt-1 text-xs leading-5 text-white/55">
              대략 위치만 공개 · 2시간 후 자동 숨김
            </AppText>
          </View>

          <View className="flex-row gap-2">
            {matchModeTabs.map((label, index) => (
              <View
                className={`rounded-full px-3 py-1.5 ${
                  index === 0 ? 'bg-soundlog-lime' : 'bg-white/10'
                }`}
                key={label}
              >
                <AppText
                  className={`text-xs font-semibold ${
                    index === 0 ? 'text-soundlog-inverse' : 'text-white/65'
                  }`}
                >
                  {label}
                </AppText>
              </View>
            ))}
          </View>

          {visibleMatches.length > 0 ? (
            visibleMatches.map((match) => {
              const requested = Boolean(requestedMatchIds[match.id]);
              const disabled = requested || pendingMatchId === match.id;

              return (
                <View
                  className="rounded-[20px] border border-white/10 bg-black/20 p-4"
                  key={match.id}
                >
                  <View className="mb-4">
                    <AppText className="text-[20px] font-semibold text-white">
                      동행 매칭 요청
                    </AppText>
                    <AppText className="mt-1 text-xs leading-5 text-white/55">
                      취향 {match.matchScore}% 일치 · {match.pin.placeName ?? '성수 근처'} · 정확한 위치 비공개
                    </AppText>
                  </View>

                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
                        {match.pin.alias}
                      </AppText>
                      <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
                        {createProfileSummary(match)} · {match.pin.placeName ?? '대략 위치'} · 정확한 좌표 숨김
                      </AppText>
                    </View>
                    <View className="rounded-full bg-soundlog-lime px-3 py-1.5">
                      <AppText className="text-xs font-semibold text-soundlog-inverse">
                        {match.matchScore}%
                      </AppText>
                    </View>
                  </View>

                  <AppText className="mt-4 text-[11px] font-semibold text-white/40">
                    공개 사운드
                  </AppText>
                  <View className="mt-2 rounded-[16px] border border-white/10 bg-white/5 px-4 py-3">
                    <AppText className="text-xs font-semibold text-white">
                      {match.pin.track?.title ?? '공개한 음악'}
                    </AppText>
                    <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
                      {match.pin.track?.artist ?? match.pin.alias} · 음악 취향으로 먼저 판단해요
                    </AppText>
                  </View>

                  <View className="mt-3 gap-1.5">
                    <AppText className="text-[11px] text-white/40">
                      정확한 위치는 서로 수락 후에도 선택 공개
                    </AppText>
                    <AppText className="text-[11px] text-white/40">
                      첫 메시지는 템플릿으로만 시작
                    </AppText>
                  </View>

                  <View className="mt-3 flex-row gap-2">
                    <Pressable
                      accessibilityRole="button"
                      className={`min-h-[44px] flex-1 items-center justify-center rounded-full px-3 ${
                        disabled ? 'bg-white/10' : 'bg-soundlog-lime'
                      }`}
                      disabled={disabled}
                      onPress={() => void handleMateRequest(match)}
                    >
                      <AppText
                        className={`text-xs font-semibold ${
                          disabled ? 'text-white/45' : 'text-soundlog-inverse'
                        }`}
                      >
                        {requested ? '요청됨' : pendingMatchId === match.id ? '전송 중' : '취향으로 인사'}
                      </AppText>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      className="min-h-[44px] flex-1 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10 px-3"
                      onPress={() => void handleReportAndBlockMatch(match)}
                    >
                      <AppText className="text-xs font-semibold text-amber-100">차단/신고</AppText>
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <AppText className="text-sm font-semibold text-white">
                주변 공개 음악을 찾는 중이에요
              </AppText>
              <AppText className="mt-2 text-xs leading-5 text-white/55">
                아직 매칭 후보가 없어도 내 현재 음악 핀은 지도에 남고, 새 공개 핀이 들어오면 이 영역에 표시돼요.
              </AppText>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function toVisualPin(pin: ServerSoundMapPin, matchScore?: number): SoundMapPin {
  const kind = pin.isMine ? 'me' : pin.visibility === 'nearby' ? 'nearby' : 'companion';

  return {
    artistName: pin.track?.artist ?? pin.alias,
    id: pin.id,
    kind,
    label: pin.isMine ? '나' : matchScore ? `${matchScore}%` : pin.visibility === 'nearby' ? '취향' : '동행자',
    location: pin.location,
    matchScore,
    subtitle: pin.placeName ?? (pin.visibility === 'nearby' ? '대략 위치 공개' : '동행자 공개'),
    trackTitle: pin.track?.title ?? '선택한 음악 없음',
  };
}
