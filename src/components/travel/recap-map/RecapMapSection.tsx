import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { recapApi } from '@/api/recapApi';
import { AppText } from '@/components/AppText';
import { useAuthStore } from '@/store/authStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import type {
  GeoPoint,
  MomentLog,
  PlaceContext,
  RecapMapMarker,
  RecapMapScope,
} from '@/types/domain';
import { formatPlaceLabel } from '@/utils/placeLabel';

import { SoundMapView } from '../live-sound-map/SoundMapView';
import { createSoundMapCenter } from '../live-sound-map/soundMapData';
import type { SoundMapPin } from '../live-sound-map/types';

type RecapMapFilter = 'mine' | 'place' | 'public';

type RecapMapSectionProps = {
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  onCreateMoment: () => void;
  onOpenRecap: (recapId: string) => void;
  onStartTravel: () => void;
  overlayBottomInset?: number;
  overlayTopInset?: number;
  sessionStatus: 'active' | 'ended' | 'idle';
  variant?: 'page' | 'section';
};

const DISCOVERY_RADIUS_METERS = 300;

const filterOptions: Array<{
  description: string;
  label: string;
  value: RecapMapFilter;
}> = [
  {
    description: '여행 시작 CTA와 현재 장소를 중심으로 봐요.',
    label: '장소 보기',
    value: 'place',
  },
  {
    description: '현재 위치 300m 안의 공개 리캡을 봐요.',
    label: '전체 리캡',
    value: 'public',
  },
  {
    description: '내 공개/비공개 리캡을 지도에서 봐요.',
    label: '내 리캡',
    value: 'mine',
  },
];

function createPlacePin(center: GeoPoint, placeName: string): SoundMapPin {
  return {
    artistName: 'Soundlog',
    id: 'current-place',
    kind: 'me',
    label: '현재',
    location: center,
    subtitle: '여행모드 시작 위치',
    trackTitle: placeName,
  };
}

function toMarkerFromLocalMoment(log: MomentLog): RecapMapMarker | undefined {
  if (!log.location) {
    return undefined;
  }

  return {
    artistName: log.track?.artist ?? '음악 없음',
    createdAt: log.createdAt,
    id: `local-marker-${log.id}`,
    imageUrl: log.photoUri,
    location: log.location,
    ownerAlias: '나',
    placeName: log.placeName ?? '위치 없음',
    recapId: log.id,
    templateId: 'album',
    title: log.note?.trim() || log.placeName || '내 리캡',
    trackTitle: log.track?.title ?? '저장된 리캡',
    visibility: 'private',
  };
}

function toMapPin(marker: RecapMapMarker): SoundMapPin {
  const isMine = marker.ownerAlias === '나' || marker.visibility === 'private';

  return {
    artistName: marker.artistName,
    id: marker.id,
    kind: isMine ? 'me' : 'nearby',
    label: isMine ? '내 리캡' : '공개',
    location: marker.location,
    subtitle: marker.placeName,
    trackTitle: marker.trackTitle,
  };
}

function getScope(filter: RecapMapFilter): RecapMapScope | undefined {
  if (filter === 'place') {
    return undefined;
  }

  return filter;
}

function getEmptyCopy(filter: RecapMapFilter) {
  if (filter === 'public') {
    return '현재 300m 안에 공개된 리캡이 없어요. 이 장소의 첫 사운드 로그를 남겨보세요.';
  }

  if (filter === 'mine') {
    return '지도에 표시할 내 리캡이 아직 없어요. 내 로그를 전체공개하면 여기에 보여요.';
  }

  return '필터를 전체 리캡이나 내 리캡으로 바꾸면 지도에 남겨진 사운드 로그를 볼 수 있어요.';
}

export function RecapMapSection({
  currentLocation,
  currentPlace,
  onCreateMoment,
  onOpenRecap,
  onStartTravel,
  overlayBottomInset = 112,
  overlayTopInset = 12,
  sessionStatus,
  variant = 'section',
}: RecapMapSectionProps) {
  const [filter, setFilter] = useState<RecapMapFilter>('place');
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);
  const [mapMessage, setMapMessage] = useState<string>();
  const [serverMarkers, setServerMarkers] = useState<RecapMapMarker[]>([]);
  const authStatus = useAuthStore((state) => state.status);
  const momentLogs = useMomentLogStore((state) => state.logs);
  const center = useMemo(
    () => createSoundMapCenter(currentLocation, currentPlace),
    [currentLocation, currentPlace],
  );
  const placeName = currentPlace?.title ?? formatPlaceLabel(center);
  const scope = getScope(filter);
  const localMineMarkers = useMemo(
    () =>
      momentLogs
        .map(toMarkerFromLocalMoment)
        .filter((marker): marker is RecapMapMarker => Boolean(marker)),
    [momentLogs],
  );
  const visibleMarkers = filter === 'mine' && serverMarkers.length === 0
    ? localMineMarkers
    : serverMarkers;
  const mapPins = filter === 'place'
    ? [createPlacePin(center, placeName)]
    : visibleMarkers.map(toMapPin);
  const showTravelCta = filter === 'place';
  const selectedFilter = filterOptions.find((option) => option.value === filter);
  const statusLabel =
    filter === 'public' ? 'PUBLIC' : filter === 'mine' ? 'MINE' : 'PLACE';

  useEffect(() => {
    if (!scope) {
      setServerMarkers([]);
      setMapMessage(undefined);
      return;
    }

    if (authStatus !== 'authenticated') {
      setServerMarkers([]);
      setMapMessage('로그인하면 주변 공개 리캡과 내 리캡을 지도에서 볼 수 있어요.');
      return;
    }

    let ignore = false;

    setIsLoadingMarkers(true);
    setMapMessage(undefined);
    recapApi
      .getRecapMarkers({
        lat: center.lat,
        lng: center.lng,
        radiusMeters: DISCOVERY_RADIUS_METERS,
        scope,
      })
      .then((markers) => {
        if (!ignore) {
          setServerMarkers(markers);
        }
      })
      .catch(() => {
        if (!ignore) {
          setServerMarkers([]);
          setMapMessage(
            scope === 'mine'
              ? '서버 내 리캡을 불러오지 못해 로컬 리캡을 먼저 보여드려요.'
              : '주변 공개 리캡을 불러오지 못했어요.',
          );
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingMarkers(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [authStatus, center.lat, center.lng, scope]);

  const isPageVariant = variant === 'page';
  const renderFilterChips = () => (
    <View className={isPageVariant ? "flex-row gap-2" : "mt-4 flex-row gap-2"}>
      {filterOptions.map((option) => {
        const selected = filter === option.value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`min-h-[42px] flex-1 items-center justify-center rounded-full border px-3 ${
              selected
                ? 'border-soundlog-lime bg-soundlog-lime'
                : 'border-white/10 bg-white/10'
            }`}
            key={option.value}
            onPress={() => setFilter(option.value)}
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
  );

  if (isPageVariant) {
    return (
      <View className="flex-1 bg-soundlog-bg">
        <SoundMapView
          center={center}
          fullBleed
          legendItems={[
            { color: '#B7E628', label: '내 리캡' },
            { color: '#FF8A3D', label: '공개 리캡' },
          ]}
          pins={mapPins}
          sessionStatus={sessionStatus}
          showChrome={false}
          statusLabel={statusLabel}
          visibility={filter === 'mine' ? 'private' : 'nearby'}
        />

        <View className="absolute left-4 right-4 gap-3" style={{ top: overlayTopInset }}>
          <View className="overflow-hidden rounded-[24px] border border-white/12 bg-black/42 px-4 py-3">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <AppText className="text-[11px] font-semibold text-soundlog-lime">
                  지도 / 여행모드
                </AppText>
                <AppText className="mt-1 text-lg font-semibold text-white" numberOfLines={1}>
                  {placeName}
                </AppText>
              </View>
              <View className="rounded-full bg-white/12 px-3 py-1.5">
                <AppText className="text-[11px] font-semibold text-white/65">
                  {isLoadingMarkers ? 'SYNC' : `${mapPins.length} PIN`}
                </AppText>
              </View>
            </View>
          </View>

          {renderFilterChips()}

          {mapMessage ? (
            <View className="rounded-[16px] bg-black/52 px-4 py-3">
              <AppText className="text-xs leading-5 text-white/70">{mapMessage}</AppText>
            </View>
          ) : null}
        </View>

        <View className="absolute left-4 right-4" style={{ bottom: overlayBottomInset }}>
          {showTravelCta ? (
            <Pressable
              accessibilityRole="button"
              className="rounded-[22px] border border-soundlog-lime/35 bg-black/58 p-4"
              onPress={sessionStatus === 'active' ? onCreateMoment : onStartTravel}
            >
              <View className="flex-row items-center justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <AppText className="text-sm font-semibold text-white">
                    {sessionStatus === 'active' ? '기록 남기기' : '여행모드 시작'}
                  </AppText>
                  <AppText className="mt-1 text-xs leading-5 text-white/65">
                    {sessionStatus === 'active'
                      ? '사진, 음악, 시간, 문구를 현재 여행 로그에 저장해요.'
                      : '여행을 시작하면 새 기록들이 하나의 로그로 묶여요.'}
                  </AppText>
                </View>
                <View className="h-11 w-11 items-center justify-center rounded-full bg-soundlog-lime">
                  <Feather
                    color="#050916"
                    name={sessionStatus === 'active' ? 'camera' : 'navigation'}
                    size={18}
                  />
                </View>
              </View>
            </Pressable>
          ) : visibleMarkers.length > 0 ? (
            <View className="gap-2">
              {visibleMarkers.slice(0, 2).map((marker) => (
                <Pressable
                  accessibilityRole="button"
                  className="rounded-[18px] border border-white/10 bg-black/58 px-4 py-3"
                  key={marker.id}
                  onPress={() => onOpenRecap(marker.recapId)}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="min-w-0 flex-1">
                      <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
                        {marker.title}
                      </AppText>
                      <AppText className="mt-1 text-xs leading-5 text-white/60" numberOfLines={1}>
                        {marker.placeName} · {marker.trackTitle}
                      </AppText>
                    </View>
                    <View className="rounded-full bg-white/12 px-2.5 py-1">
                      <AppText className="text-[10px] font-semibold text-white/60">
                        {marker.visibility === 'public' ? '전체공개' : '나만보기'}
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View className="rounded-[18px] border border-white/10 bg-black/58 px-4 py-3">
              <AppText className="text-xs leading-5 text-white/65">
                {getEmptyCopy(filter)}
              </AppText>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="mt-8 rounded-[28px] border border-white/10 bg-white/10 p-5">
      <>
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full bg-soundlog-lime" />
              <AppText className="text-xs font-semibold text-soundlog-lime">
                Travel Mode Map
              </AppText>
            </View>
            <AppText className="mt-3 text-[24px] font-semibold leading-8 text-white">
              장소에 남겨진 사운드 로그
            </AppText>
            <AppText className="mt-2 text-sm leading-6 text-white/60">
              현재 위치 기준 {DISCOVERY_RADIUS_METERS}m 안의 공개 리캡과 내 리캡을 지도
              핀으로 확인해요.
            </AppText>
          </View>
          <View className="rounded-full bg-white/10 px-3 py-1.5">
            <AppText className="text-[11px] font-semibold text-white/55">
              {isLoadingMarkers ? 'SYNC' : `${mapPins.length} PIN`}
            </AppText>
          </View>
        </View>

        {renderFilterChips()}

        {selectedFilter ? (
          <AppText className="mt-3 text-xs leading-5 text-white/45">
            {selectedFilter.description}
          </AppText>
        ) : null}
      </>

      <View className="mt-5">
        <SoundMapView
          center={center}
          legendItems={[
            { color: '#B7E628', label: '내 리캡' },
            { color: '#FF8A3D', label: '공개 리캡' },
          ]}
          pins={mapPins}
          sessionStatus={sessionStatus}
          statusLabel={statusLabel}
          visibility={filter === 'mine' ? 'private' : 'nearby'}
        />
      </View>

      {mapMessage ? (
        <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/60">{mapMessage}</AppText>
        </View>
      ) : null}

      {showTravelCta ? (
        <Pressable
          accessibilityRole="button"
          className="mt-4 rounded-[18px] border border-soundlog-lime/35 bg-soundlog-lime/12 p-4"
          onPress={sessionStatus === 'active' ? onCreateMoment : onStartTravel}
        >
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-sm font-semibold text-white">
                {sessionStatus === 'active' ? '기록 남기기' : '여행모드 시작'}
              </AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/55">
                {sessionStatus === 'active'
                  ? '사진, 음악, 시간, 문구를 현재 여행 로그에 저장해요.'
                  : '여행을 시작하면 새 기록들이 하나의 로그로 묶여요.'}
              </AppText>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-soundlog-lime">
              <Feather
                color="#050916"
                name={sessionStatus === 'active' ? 'camera' : 'navigation'}
                size={17}
              />
            </View>
          </View>
        </Pressable>
      ) : visibleMarkers.length > 0 ? (
        <View className="mt-4 gap-2">
          {visibleMarkers.slice(0, 3).map((marker) => (
            <Pressable
              accessibilityRole="button"
              className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3"
              key={marker.id}
              onPress={() => onOpenRecap(marker.recapId)}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
                    {marker.title}
                  </AppText>
                  <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
                    {marker.placeName} · {marker.trackTitle} - {marker.artistName}
                  </AppText>
                </View>
                <View className="rounded-full bg-white/10 px-2.5 py-1">
                  <AppText className="text-[10px] font-semibold text-white/55">
                    {marker.visibility === 'public' ? '전체공개' : '나만보기'}
                  </AppText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View className="mt-4 rounded-[16px] border border-white/10 bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/55">
            {getEmptyCopy(filter)}
          </AppText>
        </View>
      )}
    </View>
  );
}
