import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  clusterRecapMarkers,
  type RecapMapClusteringViewport,
} from '@/utils/recapMapClustering';

import { SoundMapView } from '../live-sound-map/SoundMapView';
import { createSoundMapCenter } from '../live-sound-map/soundMapData';
import type {
  SoundMapPin,
  SoundMapRegion,
  SoundMapViewHandle,
  SoundMapViewportSize,
} from '../live-sound-map/types';
import { SelectedRecapPinPanel } from './SelectedRecapPinPanel';

type RecapMapFilter = 'mine' | 'place' | 'public';
type RecapMapPinGroup = {
  markers: RecapMapMarker[];
  pin: SoundMapPin;
};
type TourPlaceStatus =
  | 'disabled'
  | 'empty'
  | 'error'
  | 'loading'
  | 'ready'
  | 'unavailable';

type RecapMapSectionProps = {
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  isEndingTravel?: boolean;
  onCreateMoment: () => void;
  onEndTravel?: () => void;
  onOpenRecap: (recapId: string) => void;
  onStartTravel: () => void;
  overlayBottomInset?: number;
  overlayTopInset?: number;
  sessionStatus: 'active' | 'ended' | 'idle';
  tourPlaceStatus?: TourPlaceStatus;
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
    description: '내 공개/비공개 리캡을 방문 좌표별 묶음으로 봐요.',
    label: '내 리캡',
    value: 'mine',
  },
];

function createPlacePin(place: PlaceContext): SoundMapPin | undefined {
  if (!place.location) {
    return undefined;
  }

  return {
    artistName: '한국관광공사',
    id: `tour-place-${place.id}`,
    kind: 'place',
    label: '관광지',
    location: place.location,
    subtitle: place.address ?? place.category ?? '현재 위치 주변 관광지',
    trackTitle: place.title,
  };
}

function getTourPlaceLabel(
  currentPlace: PlaceContext | undefined,
  status: TourPlaceStatus,
) {
  if (currentPlace?.title) {
    return currentPlace.title;
  }

  if (status === 'loading') {
    return '주변 관광지를 찾는 중';
  }

  if (status === 'error') {
    return '관광지 정보를 불러오지 못했어요';
  }

  if (status === 'empty') {
    return '가까운 관광지가 없어요';
  }

  if (status === 'disabled') {
    return '위치 기반 관광지 찾기가 꺼져 있어요';
  }

  return '현재 위치를 확인할 수 없어요';
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

function getClusterPlaceSummary(markers: RecapMapMarker[]) {
  const placeNames = Array.from(
    new Set(markers.map((marker) => marker.placeName).filter(Boolean)),
  );
  const visiblePlaceNames = placeNames.slice(0, 2).join(' · ');
  const hiddenPlaceCount = Math.max(placeNames.length - 2, 0);

  if (hiddenPlaceCount > 0) {
    return `${visiblePlaceNames} 외 ${hiddenPlaceCount}곳`;
  }

  return visiblePlaceNames || '같은 지역에 남긴 리캡';
}

function toRecapMapPinGroups(
  markers: RecapMapMarker[],
  filter: Exclude<RecapMapFilter, 'place'>,
  viewport?: RecapMapClusteringViewport,
): RecapMapPinGroup[] {
  return clusterRecapMarkers(markers, viewport).map((cluster) => {
    if (cluster.markers.length === 1) {
      return {
        markers: cluster.markers,
        pin: toMapPin(cluster.markers[0]),
      };
    }

    return {
      markers: cluster.markers,
      pin: {
        artistName:
          filter === 'mine' ? '내 여행 지도' : '주변 공개 사운드 지도',
        id: cluster.id,
        kind: 'cluster',
        label: `${cluster.markers.length}`,
        location: cluster.location,
        subtitle: getClusterPlaceSummary(cluster.markers),
        trackTitle:
          filter === 'mine' ? '이 지역의 내 리캡' : '이 지역의 공개 리캡',
      },
    };
  });
}

function getMapLegendItems(filter: RecapMapFilter) {
  if (filter === 'place') {
    return [{ color: '#B7E628', label: '관광지' }];
  }

  if (filter === 'mine') {
    return [
      { color: '#B7E628', label: '내 리캡' },
      { color: '#8B72FF', label: '리캡 묶음' },
    ];
  }

  return [
    { color: '#FF8A3D', label: '공개 리캡' },
    { color: '#8B72FF', label: '리캡 묶음' },
  ];
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
    return '지도에 표시할 내 리캡이 아직 없어요. 리캡을 남기면 방문 좌표가 여기에 쌓여요.';
  }

  return '필터를 전체 리캡이나 내 리캡으로 바꾸면 지도에 남겨진 사운드 로그를 볼 수 있어요.';
}

export function RecapMapSection({
  currentLocation,
  currentPlace,
  isEndingTravel = false,
  onCreateMoment,
  onEndTravel,
  onOpenRecap,
  onStartTravel,
  overlayBottomInset = 112,
  overlayTopInset = 12,
  sessionStatus,
  tourPlaceStatus = currentPlace ? 'ready' : 'unavailable',
  variant = 'section',
}: RecapMapSectionProps) {
  const [filter, setFilter] = useState<RecapMapFilter>('place');
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);
  const [mapRegion, setMapRegion] = useState<SoundMapRegion>();
  const [mapMessage, setMapMessage] = useState<string>();
  const [mapViewportSize, setMapViewportSize] = useState<SoundMapViewportSize>({
    height: 0,
    width: 0,
  });
  const [selectedPinId, setSelectedPinId] = useState<string>();
  const [serverMarkers, setServerMarkers] = useState<RecapMapMarker[]>([]);
  const mapViewRef = useRef<SoundMapViewHandle | null>(null);
  const authStatus = useAuthStore((state) => state.status);
  const momentLogs = useMomentLogStore((state) => state.logs);
  const currentLocationCenter = useMemo(
    () => createSoundMapCenter(currentLocation, currentPlace),
    [currentLocation, currentPlace],
  );
  const placeCenter = currentPlace?.location ?? currentLocationCenter;
  const center = filter === 'place' ? placeCenter : currentLocationCenter;
  const placeName = getTourPlaceLabel(currentPlace, tourPlaceStatus);
  const scope = getScope(filter);
  const localMineMarkers = useMemo(
    () =>
      momentLogs
        .map(toMarkerFromLocalMoment)
        .filter((marker): marker is RecapMapMarker => Boolean(marker)),
    [momentLogs],
  );
  const pendingLocalMineMarkers = useMemo(
    () =>
      momentLogs
        .filter((log) => log.syncStatus !== 'synced')
        .map(toMarkerFromLocalMoment)
        .filter((marker): marker is RecapMapMarker => Boolean(marker)),
    [momentLogs],
  );
  const visibleMarkers = useMemo(() => {
    if (filter !== 'mine') {
      return serverMarkers;
    }

    if (serverMarkers.length === 0) {
      return localMineMarkers;
    }

    return [...pendingLocalMineMarkers, ...serverMarkers];
  }, [filter, localMineMarkers, pendingLocalMineMarkers, serverMarkers]);
  const placePin = useMemo(
    () => (currentPlace ? createPlacePin(currentPlace) : undefined),
    [currentPlace],
  );
  const clusteringViewport = useMemo<RecapMapClusteringViewport | undefined>(
    () =>
      mapRegion
        ? {
            height: mapViewportSize.height,
            region: mapRegion,
            width: mapViewportSize.width,
          }
        : undefined,
    [mapRegion, mapViewportSize.height, mapViewportSize.width],
  );
  const mapPinGroups = useMemo<RecapMapPinGroup[]>(() => {
    if (filter === 'place') {
      return placePin ? [{ markers: [], pin: placePin }] : [];
    }

    return toRecapMapPinGroups(visibleMarkers, filter, clusteringViewport);
  }, [clusteringViewport, filter, placePin, visibleMarkers]);
  const mapPins = useMemo(
    () => mapPinGroups.map((group) => group.pin),
    [mapPinGroups],
  );
  const selectedPinGroup = useMemo(
    () => mapPinGroups.find((group) => group.pin.id === selectedPinId),
    [mapPinGroups, selectedPinId],
  );
  const viewportKey = useMemo(() => {
    if (filter === 'place') {
      return `${filter}:${placePin?.id ?? 'empty'}`;
    }

    const markerKey = visibleMarkers
      .map(
        (marker) =>
          `${marker.id}:${marker.location.lat.toFixed(6)}:${marker.location.lng.toFixed(6)}`,
      )
      .sort((left, right) => left.localeCompare(right))
      .join('|');

    return `${filter}:${markerKey}`;
  }, [filter, placePin?.id, visibleMarkers]);
  const showTravelCta = filter === 'place';
  const mapTitle =
    filter === 'mine'
      ? '내가 다녀온 사운드 지도'
      : filter === 'public'
        ? '현재 위치 주변 공개 리캡'
        : placeName;
  const selectedFilter = filterOptions.find(
    (option) => option.value === filter,
  );
  const statusLabel =
    filter === 'public' ? 'PUBLIC' : filter === 'mine' ? 'MINE' : 'PLACE';
  const markerQueryLat =
    scope === 'public' ? currentLocationCenter.lat : undefined;
  const markerQueryLng =
    scope === 'public' ? currentLocationCenter.lng : undefined;
  const mapPinStatus =
    isLoadingMarkers || (filter === 'place' && tourPlaceStatus === 'loading')
      ? 'SYNC'
      : filter !== 'place'
        ? `${mapPins.length} PIN · ${visibleMarkers.length} LOG`
        : `${mapPins.length} PIN`;
  const handleRegionChangeComplete = useCallback((region: SoundMapRegion) => {
    setMapRegion(region);
  }, []);
  const handleViewportLayoutChange = useCallback(
    (size: SoundMapViewportSize) => {
      setMapViewportSize((currentSize) =>
        currentSize.height === size.height && currentSize.width === size.width
          ? currentSize
          : size,
      );
    },
    [],
  );

  useEffect(
    function fetchRecapMarkersForScope() {
      if (!scope) {
        setServerMarkers([]);
        setMapMessage(undefined);
        return;
      }

      if (authStatus !== 'authenticated') {
        setServerMarkers([]);
        setMapMessage(
          '로그인하면 주변 공개 리캡과 내 리캡을 지도에서 볼 수 있어요.',
        );
        return;
      }

      let ignore = false;

      setIsLoadingMarkers(true);
      setMapMessage(undefined);
      recapApi
        .getRecapMarkers(
          scope === 'mine'
            ? { scope }
            : {
                lat: markerQueryLat,
                lng: markerQueryLng,
                radiusMeters: DISCOVERY_RADIUS_METERS,
                scope,
              },
        )
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

      return function ignoreStaleRecapMarkerResponse() {
        ignore = true;
      };
    },
    [authStatus, markerQueryLat, markerQueryLng, scope],
  );

  useEffect(
    function clearUnavailablePinSelection() {
      if (
        selectedPinId &&
        !mapPinGroups.some((group) => group.pin.id === selectedPinId)
      ) {
        setSelectedPinId(undefined);
      }
    },
    [mapPinGroups, selectedPinId],
  );

  const isPageVariant = variant === 'page';
  const renderFilterChips = () => (
    <View
      className={isPageVariant ? 'flex-row gap-1.5' : 'mt-4 flex-row gap-1.5'}
    >
      {filterOptions.map((option) => {
        const selected = filter === option.value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className="min-h-[44px] flex-1 items-center justify-center px-0.5"
            key={option.value}
            onPress={() => {
              setSelectedPinId(undefined);
              setFilter(option.value);
            }}
          >
            <View
              className={`h-8 w-full items-center justify-center rounded-full border px-2 ${
                selected
                  ? 'border-soundlog-lime bg-soundlog-lime'
                  : 'border-white/10 bg-white/10'
              }`}
            >
              <AppText
                className={`text-[11px] font-semibold ${
                  selected ? 'text-soundlog-inverse' : 'text-white/70'
                }`}
                numberOfLines={1}
              >
                {option.label}
              </AppText>
            </View>
          </Pressable>
        );
      })}
      {isPageVariant ? (
        <Pressable
          accessibilityHint="지도를 현재 위치로 이동합니다."
          accessibilityLabel={
            currentLocation ? '내 위치 보기' : '현재 위치를 확인할 수 없음'
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: !currentLocation }}
          className="min-h-[44px] w-11 items-center justify-center"
          disabled={!currentLocation}
          hitSlop={6}
          onPress={() => mapViewRef.current?.focusCurrentLocation()}
          style={{ opacity: currentLocation ? 1 : 0.48 }}
        >
          <View className="h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/80">
            <Feather
              color={currentLocation ? '#FFFFFF' : 'rgba(255,255,255,0.42)'}
              name="crosshair"
              size={15}
            />
          </View>
        </Pressable>
      ) : null}
    </View>
  );

  if (isPageVariant) {
    return (
      <View className="flex-1 bg-soundlog-bg">
        <SoundMapView
          center={center}
          currentLocation={currentLocation}
          fullBleed
          legendItems={getMapLegendItems(filter)}
          onRegionChangeComplete={handleRegionChangeComplete}
          onViewportLayoutChange={handleViewportLayoutChange}
          onPinPress={
            filter === 'place' ? undefined : (pin) => setSelectedPinId(pin.id)
          }
          pins={mapPins}
          ref={mapViewRef}
          selectedPinId={selectedPinId}
          sessionStatus={sessionStatus}
          showChrome={false}
          showPinCallouts={false}
          statusLabel={statusLabel}
          visibility={filter === 'mine' ? 'private' : 'nearby'}
          viewportKey={viewportKey}
          viewportMode={filter === 'mine' ? 'overview' : 'auto'}
        />

        <View
          className="absolute left-4 right-4 gap-3"
          pointerEvents="box-none"
          style={{ top: overlayTopInset }}
        >
          <View className="overflow-hidden rounded-[24px] border border-white/12 bg-black/42 px-4 py-3">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <AppText className="text-[11px] font-semibold text-soundlog-lime">
                  지도 / 여행모드
                </AppText>
                <AppText
                  className="mt-1 text-lg font-semibold text-white"
                  numberOfLines={1}
                >
                  {mapTitle}
                </AppText>
              </View>
              <View className="rounded-full bg-white/12 px-3 py-1.5">
                <AppText
                  className="text-[11px] font-semibold text-white/65"
                  numberOfLines={1}
                >
                  {mapPinStatus}
                </AppText>
              </View>
            </View>
          </View>

          {renderFilterChips()}

          {mapMessage ? (
            <View className="rounded-[16px] bg-black/52 px-4 py-3">
              <AppText className="text-xs leading-5 text-white/70">
                {mapMessage}
              </AppText>
            </View>
          ) : null}
        </View>

        <View
          className="absolute left-4 right-4"
          style={{ bottom: overlayBottomInset }}
        >
          {showTravelCta ? (
            <View className="gap-2">
              <Pressable
                accessibilityRole="button"
                className="rounded-[22px] border border-soundlog-lime/35 bg-black/58 p-4"
                onPress={
                  sessionStatus === 'active' ? onCreateMoment : onStartTravel
                }
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="min-w-0 flex-1">
                    <AppText className="text-sm font-semibold text-white">
                      {sessionStatus === 'active'
                        ? '기록 남기기'
                        : '여행모드 시작'}
                    </AppText>
                    <AppText className="mt-1 text-xs leading-5 text-white/65">
                      {sessionStatus === 'active'
                        ? '사진, 음악과 촬영 시간을 현재 여행 로그에 저장해요.'
                        : '여행을 시작하면 새 기록들이 하나의 로그로 묶여요.'}
                    </AppText>
                  </View>
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-soundlog-lime">
                    <Feather
                      color="#050916"
                      name={
                        sessionStatus === 'active' ? 'camera' : 'navigation'
                      }
                      size={18}
                    />
                  </View>
                </View>
              </Pressable>
              {sessionStatus === 'active' && onEndTravel ? (
                <Pressable
                  accessibilityRole="button"
                  className="h-11 items-center justify-center rounded-full border border-white/15 bg-black/58"
                  disabled={isEndingTravel}
                  onPress={onEndTravel}
                  style={{ opacity: isEndingTravel ? 0.65 : 1 }}
                >
                  <AppText className="text-xs font-semibold text-white/75">
                    {isEndingTravel ? '여행 로그 정리 중' : '여행 종료'}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          ) : selectedPinGroup && selectedPinGroup.markers.length > 0 ? (
            <SelectedRecapPinPanel
              markers={selectedPinGroup.markers}
              onClose={() => setSelectedPinId(undefined)}
              onOpenRecap={onOpenRecap}
              pin={selectedPinGroup.pin}
            />
          ) : visibleMarkers.length === 0 ? (
            <View className="rounded-[18px] border border-white/10 bg-black/58 px-4 py-3">
              <AppText className="text-xs leading-5 text-white/65">
                {getEmptyCopy(filter)}
              </AppText>
            </View>
          ) : null}
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
              {filter === 'mine'
                ? '내가 방문했던 좌표를 지역별 묶음으로 한눈에 확인해요.'
                : `현재 위치 기준 ${DISCOVERY_RADIUS_METERS}m 안의 공개 리캡을 지도 핀으로 확인해요.`}
            </AppText>
          </View>
          <View className="rounded-full bg-white/10 px-3 py-1.5">
            <AppText className="text-[11px] font-semibold text-white/55">
              {mapPinStatus}
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
          legendItems={getMapLegendItems(filter)}
          onRegionChangeComplete={handleRegionChangeComplete}
          onViewportLayoutChange={handleViewportLayoutChange}
          pins={mapPins}
          sessionStatus={sessionStatus}
          statusLabel={statusLabel}
          visibility={filter === 'mine' ? 'private' : 'nearby'}
          viewportKey={viewportKey}
          viewportMode={filter === 'mine' ? 'overview' : 'auto'}
        />
      </View>

      {mapMessage ? (
        <View className="mt-4 rounded-[16px] bg-black/20 px-4 py-3">
          <AppText className="text-xs leading-5 text-white/60">
            {mapMessage}
          </AppText>
        </View>
      ) : null}

      {showTravelCta ? (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            className="mt-4 rounded-[18px] border border-soundlog-lime/35 bg-soundlog-lime/12 p-4"
            onPress={
              sessionStatus === 'active' ? onCreateMoment : onStartTravel
            }
          >
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <AppText className="text-sm font-semibold text-white">
                  {sessionStatus === 'active' ? '기록 남기기' : '여행모드 시작'}
                </AppText>
                <AppText className="mt-1 text-xs leading-5 text-white/55">
                  {sessionStatus === 'active'
                    ? '사진, 음악과 촬영 시간을 현재 여행 로그에 저장해요.'
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
          {sessionStatus === 'active' && onEndTravel ? (
            <Pressable
              accessibilityRole="button"
              className="h-11 items-center justify-center rounded-full border border-white/15"
              disabled={isEndingTravel}
              onPress={onEndTravel}
              style={{ opacity: isEndingTravel ? 0.65 : 1 }}
            >
              <AppText className="text-xs font-semibold text-white/70">
                {isEndingTravel ? '여행 로그 정리 중' : '여행 종료'}
              </AppText>
            </Pressable>
          ) : null}
        </View>
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
                  <AppText
                    className="text-sm font-semibold text-white"
                    numberOfLines={1}
                  >
                    {marker.title}
                  </AppText>
                  <AppText
                    className="mt-1 text-xs leading-5 text-white/55"
                    numberOfLines={2}
                  >
                    {marker.placeName} · {marker.trackTitle} -{' '}
                    {marker.artistName}
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
