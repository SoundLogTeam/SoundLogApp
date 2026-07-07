import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { communityApi } from '@/api/communityApi';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import type {
  GeoPoint,
  MusicMatch,
  PlaceContext,
  SoundMapPin as ServerSoundMapPin,
  Track,
  TravelMode,
} from '@/types/domain';
import { formatPlaceLabel } from '@/utils/placeLabel';

import { OpenLayersSoundMap } from './OpenLayersSoundMap';
import { createSoundMapCenter, createSoundMapPins } from './soundMapData';
import type { SoundMapPin, SoundMapVisibility } from './types';

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
  const [requestedMatchIds, setRequestedMatchIds] = useState<Record<string, string>>({});
  const [hiddenMatchIds, setHiddenMatchIds] = useState<Record<string, true>>({});
  const [pendingMatchId, setPendingMatchId] = useState<string>();
  const addEvent = useRecommendationEventStore((state) => state.addEvent);
  const center = useMemo(
    () => createSoundMapCenter(currentLocation, currentPlace),
    [currentLocation, currentPlace],
  );
  const isTravelActive = sessionStatus === 'active';
  const isLive = isTravelActive && visibility !== 'private';
  const syncLocation = currentLocation ?? currentPlace?.location;
  const locationLabel = currentPlace?.title ?? formatPlaceLabel(center);
  const visibilityMessage = visibilityCopy[visibility];
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

    return createSoundMapPins({ center, currentTrack, visibility });
  }, [center, currentTrack, matches, serverPins, visibility]);

  useEffect(() => {
    if (!isTravelActive) {
      setServerPins([]);
      setMatches([]);
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
  }, [isTravelActive, syncLocation?.lat, syncLocation?.lng, visibility]);

  useEffect(() => {
    if (!isLive || !currentTrack || !syncLocation) {
      return;
    }

    let ignore = false;

    communityApi
      .upsertCurrentTrack({
        artistName: currentTrack.artist,
        location: syncLocation,
        moodTags: [],
        placeName: currentPlace?.title,
        sessionId,
        trackId: currentTrack.id,
        trackTitle: currentTrack.title,
        travelMode: selectedMode,
        visibility,
      })
      .then((pin) => {
        if (!pin || ignore) {
          return;
        }

        setServerPins((pins) => [pin, ...pins.filter((item) => item.id !== pin.id)]);
        setMapMessage(undefined);
      })
      .catch(() => {
        if (!ignore) {
          setMapMessage('현재 곡 공개 상태를 서버에 저장하지 못했어요.');
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    currentPlace?.title,
    currentTrack?.artist,
    currentTrack?.id,
    currentTrack?.title,
    isLive,
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
      setMapMessage('동행 요청을 보냈어요. 상대가 수락하기 전까지 연락처와 정확한 위치는 숨겨져요.');
    } catch {
      setMapMessage('동행 요청을 보내지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setPendingMatchId(undefined);
    }
  };
  const handleReportMatch = async (match: MusicMatch) => {
    try {
      await communityApi.reportTarget({
        reason: 'safety',
        targetPinId: match.targetPinId,
      });
      setMapMessage('신고를 접수했어요. 이 매칭은 계속 볼 수 있지만 정확한 위치와 연락처는 노출되지 않아요.');
    } catch {
      setMapMessage('신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  };
  const handleBlockMatch = async (match: MusicMatch) => {
    try {
      await communityApi.blockUser({ targetPinId: match.targetPinId });
      setHiddenMatchIds((state) => ({ ...state, [match.id]: true }));
      setMatches((items) => items.filter((item) => item.id !== match.id));
      setServerPins((items) => items.filter((item) => item.id !== match.targetPinId));
      setMapMessage('차단했어요. 해당 여행자의 공개 음악은 더 이상 추천에 보이지 않아요.');
    } catch {
      setMapMessage('차단하지 못했어요. 잠시 후 다시 시도해주세요.');
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
          <AppText className="mt-2 text-sm leading-6 text-white/58">
            OpenLayers 지도를 Soundlog 다크 테마로 조정하고, 여행 모드 중인 내 음악과
            동행자/주변 익명 핀을 함께 보여줘요.
          </AppText>
        </View>
        <View
          className={`rounded-full px-3 py-1.5 ${
            isLive ? 'bg-soundlog-lime' : 'bg-white/10'
          }`}
        >
          <AppText
            className={`text-[11px] font-semibold ${
              isLive ? 'text-soundlog-inverse' : 'text-white/55'
            }`}
          >
            {isLive ? 'LIVE' : 'PREVIEW'}
          </AppText>
        </View>
      </View>

      <View className="mt-5">
        <OpenLayersSoundMap
          center={center}
          pins={pins}
          selectedTrack={currentTrack}
          sessionStatus={sessionStatus}
          visibility={visibility}
        />
      </View>

      {mapMessage ? (
        <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/62">{mapMessage}</AppText>
        </View>
      ) : null}

      <View className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Feather color="#B7E628" name={isLive ? 'radio' : 'lock'} size={18} />
          </View>
          <View className="min-w-0 flex-1">
            <AppText className="text-sm font-semibold text-white">
              {isTravelActive ? visibilityMessage.title : '여행 모드 OFF'}
            </AppText>
            <AppText className="mt-1 text-xs leading-5 text-white/55">
              {isTravelActive
                ? visibilityMessage.description
                : '여행을 시작하면 현재 위치와 Soundlog에서 선택한 음악을 지도에 표시할 수 있어요.'}
            </AppText>
            <AppText className="mt-2 text-xs text-white/40" numberOfLines={1}>
              {locationLabel} · {currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : '선택한 음악 없음'}
            </AppText>
          </View>
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
                  : 'border-white/12 bg-white/10'
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

      {visibility === 'nearby' && matches.length > 0 ? (
        <View className="mt-4 gap-2">
          <AppText className="text-sm font-semibold text-white">주변 음악 취향 매칭</AppText>
          {matches.filter((match) => !hiddenMatchIds[match.id]).slice(0, 2).map((match) => {
            const requested = Boolean(requestedMatchIds[match.id]);
            const disabled = requested || pendingMatchId === match.id;

            return (
              <View
                className="rounded-[18px] border border-white/10 bg-black/20 p-4"
                key={match.id}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
                      {match.pin.track?.title ?? '공개한 음악'} · {match.matchScore}%
                    </AppText>
                    <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
                      {match.pin.alias} · {match.pin.placeName ?? '대략 위치'} · 정확한 좌표 숨김
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    className={`min-h-[44px] shrink-0 justify-center rounded-full px-3 ${
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
                      {requested ? '요청됨' : pendingMatchId === match.id ? '전송 중' : '동행 요청'}
                    </AppText>
                  </Pressable>
                </View>
                <View className="mt-3 flex-row gap-2">
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[44px] flex-1 items-center justify-center rounded-full bg-white/10 px-3"
                    onPress={() => void handleReportMatch(match)}
                  >
                    <AppText className="text-xs font-semibold text-white/65">신고</AppText>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[44px] flex-1 items-center justify-center rounded-full bg-white/10 px-3"
                    onPress={() => void handleBlockMatch(match)}
                  >
                    <AppText className="text-xs font-semibold text-white/65">차단</AppText>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
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
