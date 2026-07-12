import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { HomeHeader } from '@/components/home/HomeHeader';
import { getTabBarHeight } from '@/constants/layout';
import type { HomeLocationStatus } from '@/store/travelSessionStore';
import type {
  FeaturedPlaylist,
  GeoPoint,
  MusicRecommendationMode,
  PlaceContext,
} from '@/types/domain';

type TravelSessionStatus = 'active' | 'ended' | 'idle';

type TravelModeHomeViewProps = {
  actionMessage?: string;
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  isOpeningPlaylist?: boolean;
  isRecommendationError?: boolean;
  isRecommendationLoading?: boolean;
  locationStatus: HomeLocationStatus;
  locationUpdatedAt?: string;
  moodLabel: string;
  needsLocation?: boolean;
  onCaptureMoment: () => void;
  onEditTravelState: () => void;
  onEndTravel: () => void;
  onOpenPlaylist: () => void;
  onRefreshLocation: () => void;
  onRetryRecommendation: () => void;
  onSelectRecommendationMode: (mode: MusicRecommendationMode) => void;
  onStartTravel: () => void;
  playlist?: FeaturedPlaylist;
  recommendationSource?: string;
  recommendationMode: MusicRecommendationMode;
  sessionStatus: TravelSessionStatus;
  startedAt?: string;
  travelLabel: string;
};

type NativeMapsModule = typeof import('react-native-maps');

const fallbackCenter: GeoPoint = {
  lat: 37.5512,
  lng: 126.9882,
};

let nativeMapsModule: NativeMapsModule | undefined;

function getNativeMaps() {
  if (Platform.OS === 'web') {
    return undefined;
  }

  nativeMapsModule ??= require('react-native-maps') as NativeMapsModule;
  return nativeMapsModule;
}

function getMapCenter(currentLocation?: GeoPoint, currentPlace?: PlaceContext) {
  return currentLocation ?? currentPlace?.location ?? fallbackCenter;
}

function getLocationTitle({
  currentLocation,
  currentPlace,
  locationStatus,
}: {
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  locationStatus: HomeLocationStatus;
}) {
  if (locationStatus === 'loading') {
    return '내 위치 확인 중';
  }

  if (currentPlace?.title) {
    return currentPlace.title;
  }

  if (currentLocation) {
    return '내 위치 주변';
  }

  if (locationStatus === 'denied') {
    return '위치 권한이 꺼져 있어요';
  }

  return '여행 시작 위치';
}

function getLocationCaption({
  currentLocation,
  currentPlace,
  locationStatus,
  locationUpdatedAt,
}: {
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  locationStatus: HomeLocationStatus;
  locationUpdatedAt?: string;
}) {
  if (locationStatus === 'loading') {
    return '현재 위치에 맞춰 지도를 준비하고 있어요.';
  }

  if (locationStatus === 'denied') {
    return '위치를 허용하면 지도에 내 위치를 표시해요.';
  }

  if (currentPlace?.address) {
    return currentPlace.address;
  }

  if (currentPlace?.category) {
    return currentPlace.category;
  }

  if (currentLocation && locationUpdatedAt) {
    return `최근 위치 · ${new Date(locationUpdatedAt).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  return '위치를 새로고침하면 지금 장소를 기준으로 시작해요.';
}

function getSessionElapsedLabel(startedAt?: string) {
  if (!startedAt) {
    return '방금 시작';
  }

  const startedTime = new Date(startedAt).getTime();

  if (Number.isNaN(startedTime)) {
    return '여행 기록 중';
  }

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - startedTime) / 60000));

  if (elapsedMinutes < 1) {
    return '방금 시작';
  }

  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}분째 기록 중`;
  }

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;

  return minutes ? `${hours}시간 ${minutes}분째 기록 중` : `${hours}시간째 기록 중`;
}

function getRecommendationSourceLabel(source?: string) {
  if (source === 'ml-recommendation') {
    return 'ML 추천';
  }

  if (source === 'seed-fallback') {
    return '기본 추천';
  }

  return '현재 장소 추천';
}

function TravelMapBackground({
  currentLocation,
  currentPlace,
  onInteractionEnd,
  onInteractionStart,
}: {
  currentLocation?: GeoPoint;
  currentPlace?: PlaceContext;
  onInteractionEnd: () => void;
  onInteractionStart: () => void;
}) {
  const NativeMaps = getNativeMaps();
  const center = useMemo(
    () => getMapCenter(currentLocation, currentPlace),
    [currentLocation, currentPlace],
  );
  const region = useMemo(
    () => ({
      latitude: center.lat,
      latitudeDelta: 0.012,
      longitude: center.lng,
      longitudeDelta: 0.012,
    }),
    [center],
  );
  const markerLocation = currentLocation ?? currentPlace?.location;

  if (!NativeMaps) {
    return <FallbackMapBackground hasLocation={Boolean(markerLocation)} />;
  }

  const MapView = NativeMaps.default;
  const Marker = NativeMaps.Marker;

  return (
    <MapView
      initialRegion={region}
      mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
      pitchEnabled={false}
      rotateEnabled={false}
      onPanDrag={onInteractionStart}
      onRegionChangeComplete={onInteractionEnd}
      scrollEnabled
      showsCompass={false}
      showsPointsOfInterests
      showsScale={false}
      style={StyleSheet.absoluteFill}
      toolbarEnabled={false}
      userInterfaceStyle="dark"
      zoomEnabled
    >
      {markerLocation ? (
        <Marker
          coordinate={{
            latitude: markerLocation.lat,
            longitude: markerLocation.lng,
          }}
        >
          <View style={styles.locationMarkerHalo}>
            <View style={styles.locationMarker} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
}

function FallbackMapBackground({ hasLocation }: { hasLocation: boolean }) {
  return (
    <View style={styles.fallbackMap}>
      <View style={[styles.mapRoad, styles.mapRoadPrimary]} />
      <View style={[styles.mapRoad, styles.mapRoadSecondary]} />
      <View style={[styles.mapRoad, styles.mapRoadTertiary]} />
      <View style={[styles.mapBlock, styles.mapBlockOne]} />
      <View style={[styles.mapBlock, styles.mapBlockTwo]} />
      <View style={[styles.mapBlock, styles.mapBlockThree]} />
      {hasLocation ? (
        <View style={styles.fallbackLocationMarker}>
          <View style={styles.locationMarker} />
        </View>
      ) : null}
    </View>
  );
}

function TravelStartPanel({
  isLocationLoading,
  locationCaption,
  locationTitle,
  onRefreshLocation,
  onStartTravel,
}: {
  isLocationLoading: boolean;
  locationCaption: string;
  locationTitle: string;
  onRefreshLocation: () => void;
  onStartTravel: () => void;
}) {
  return (
    <View className="items-center px-7">
      <View
        className="w-full rounded-[28px] border border-white/16 p-5"
        style={{ backgroundColor: 'rgba(5,9,22,0.92)' }}
      >
        <View className="flex-row items-start gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
            {isLocationLoading ? (
              <ActivityIndicator color="#B7E628" />
            ) : (
              <Feather color="#B7E628" name="map-pin" size={22} />
            )}
          </View>
          <View className="min-w-0 flex-1">
            <AppText className="text-[11px] font-semibold text-white/45">
              현재 위치
            </AppText>
            <AppText className="mt-1 text-[22px] font-semibold text-white" numberOfLines={1}>
              {locationTitle}
            </AppText>
            <AppText className="mt-1 text-xs leading-5 text-white/58" numberOfLines={2}>
              {locationCaption}
            </AppText>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          className="mt-5 h-[132px] w-[132px] self-center items-center justify-center rounded-full bg-soundlog-lime"
          onPress={onStartTravel}
        >
          <Feather color="#050916" name="navigation" size={24} />
          <AppText className="mt-2 text-[24px] font-semibold text-[#050916]">
            여행 시작
          </AppText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          className="mt-4 h-11 flex-row items-center justify-center gap-2 rounded-full bg-white/10"
          onPress={onRefreshLocation}
        >
          <Feather color="rgba(255,255,255,0.82)" name="crosshair" size={15} />
          <AppText className="text-sm font-semibold text-white/82">내 위치 새로고침</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ActiveRecommendationPanel({
  isOpeningPlaylist,
  isRecommendationError,
  isRecommendationLoading,
  moodLabel,
  needsLocation,
  onCaptureMoment,
  onEditTravelState,
  onEndTravel,
  onOpenPlaylist,
  onRefreshLocation,
  onRetryRecommendation,
  playlist,
  recommendationSource,
  sessionElapsedLabel,
  travelLabel,
}: {
  isOpeningPlaylist: boolean;
  isRecommendationError: boolean;
  isRecommendationLoading: boolean;
  moodLabel: string;
  needsLocation: boolean;
  onCaptureMoment: () => void;
  onEditTravelState: () => void;
  onEndTravel: () => void;
  onOpenPlaylist: () => void;
  onRefreshLocation: () => void;
  onRetryRecommendation: () => void;
  playlist?: FeaturedPlaylist;
  recommendationSource?: string;
  sessionElapsedLabel: string;
  travelLabel: string;
}) {
  const title = playlist?.regionName ?? `${travelLabel} 사운드트랙`;
  const description = playlist?.description ??
    (needsLocation
      ? '위치를 잡으면 지금 장소에 맞는 음악 추천이 지도 위에 떠요.'
      : '현재 장소와 분위기에 맞는 음악을 준비하고 있어요.');
  const meta = playlist
    ? `${playlist.trackCount}곡 · ${playlist.durationText}`
    : isRecommendationLoading
      ? '추천 준비 중'
      : needsLocation
        ? '위치 필요'
        : '추천 다시 시도';
  const playlistButtonDisabled = isRecommendationLoading || isOpeningPlaylist;

  return (
    <View
      className="mx-5 rounded-[30px] border border-white/16 p-5"
      style={{ backgroundColor: 'rgba(5,9,22,0.94)' }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full bg-soundlog-lime px-3 py-1.5">
              <AppText className="text-[11px] font-semibold text-[#050916]">
                여행 기록 중
              </AppText>
            </View>
            <View className="rounded-full bg-white/10 px-3 py-1.5">
              <AppText className="text-[11px] font-semibold text-white/72">
                {sessionElapsedLabel}
              </AppText>
            </View>
          </View>
          <AppText className="mt-3 text-[11px] font-semibold text-white/42">
            지도 위 음악 추천
          </AppText>
          <AppText className="mt-1 text-[24px] font-semibold text-white" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
          {isRecommendationLoading ? (
            <ActivityIndicator color="#B7E628" />
          ) : (
            <Feather color="#B7E628" name="music" size={22} />
          )}
        </View>
      </View>

      <AppText className="mt-3 text-sm leading-6 text-white/62" numberOfLines={2}>
        {description}
      </AppText>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="rounded-full bg-white/10 px-3 py-1.5">
          <AppText className="text-[11px] font-semibold text-white/60">{travelLabel}</AppText>
        </View>
        <View className="rounded-full bg-white/10 px-3 py-1.5">
          <AppText className="text-[11px] font-semibold text-white/60">{moodLabel}</AppText>
        </View>
        <View className="rounded-full bg-white/10 px-3 py-1.5">
          <AppText className="text-[11px] font-semibold text-white/60">
            {getRecommendationSourceLabel(recommendationSource)}
          </AppText>
        </View>
      </View>

      <View className="mt-4 flex-row items-center justify-between gap-3 rounded-[22px] bg-black/24 p-4">
        <View className="min-w-0 flex-1">
          <AppText className="text-xs font-semibold text-soundlog-lime">{meta}</AppText>
          <AppText className="mt-1 text-[11px] leading-4 text-white/42" numberOfLines={1}>
            {isRecommendationError ? '추천을 다시 시도할 수 있어요.' : '시작한 여행에 이 음악 맥락을 붙여요.'}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          className={`h-11 flex-row items-center justify-center gap-2 rounded-full px-4 ${
            playlistButtonDisabled ? 'bg-white/10' : 'bg-soundlog-lime'
          }`}
          disabled={playlistButtonDisabled}
          onPress={needsLocation && !playlist ? onRefreshLocation : onOpenPlaylist}
        >
          <Feather
            color={playlistButtonDisabled ? 'rgba(255,255,255,0.42)' : '#050916'}
            name={needsLocation && !playlist ? 'crosshair' : 'disc'}
            size={16}
          />
          <AppText
            className={`text-xs font-semibold ${
              playlistButtonDisabled ? 'text-white/40' : 'text-[#050916]'
            }`}
          >
            {isOpeningPlaylist ? '여는 중' : needsLocation && !playlist ? '위치 잡기' : '곡 보기'}
          </AppText>
        </Pressable>
      </View>

      <View className="mt-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white/10"
          onPress={onCaptureMoment}
        >
          <Feather color="#fff" name="camera" size={16} />
          <AppText className="text-sm font-semibold text-white">기록</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white/10"
          onPress={onRetryRecommendation}
        >
          <Feather color="#fff" name="refresh-cw" size={15} />
          <AppText className="text-sm font-semibold text-white">다시 추천</AppText>
        </Pressable>
      </View>

      <View className="mt-3 flex-row gap-3">
        <Pressable
          accessibilityLabel="현재 여행 상태 수정"
          accessibilityRole="button"
          className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10"
          onPress={onEditTravelState}
        >
          <Feather color="#fff" name="edit-2" size={14} />
          <AppText className="text-sm font-semibold text-white">상태 수정</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel="여행 모드 종료"
          accessibilityRole="button"
          className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-soundlog-warning"
          onPress={onEndTravel}
        >
          <Feather color="#050916" name="stop-circle" size={14} />
          <AppText className="text-sm font-semibold text-[#050916]">여행 종료</AppText>
        </Pressable>
      </View>
    </View>
  );
}

export function TravelModeHomeView({
  actionMessage,
  currentLocation,
  currentPlace,
  isOpeningPlaylist = false,
  isRecommendationError = false,
  isRecommendationLoading = false,
  locationStatus,
  locationUpdatedAt,
  moodLabel,
  needsLocation = false,
  onCaptureMoment,
  onEditTravelState,
  onEndTravel,
  onOpenPlaylist,
  onRefreshLocation,
  onRetryRecommendation,
  onSelectRecommendationMode,
  onStartTravel,
  playlist,
  recommendationSource,
  recommendationMode,
  sessionStatus,
  startedAt,
  travelLabel,
}: TravelModeHomeViewProps) {
  const insets = useSafeAreaInsets();
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const interactionEndTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const recommendationPanelOffset = useRef(new Animated.Value(0)).current;
  const locationTitle = getLocationTitle({ currentLocation, currentPlace, locationStatus });
  const locationCaption = getLocationCaption({
    currentLocation,
    currentPlace,
    locationStatus,
    locationUpdatedAt,
  });
  const sessionElapsedLabel = getSessionElapsedLabel(startedAt);
  const isActive = sessionStatus === 'active';
  const handleMapInteractionStart = useCallback(() => {
    if (interactionEndTimerRef.current) {
      clearTimeout(interactionEndTimerRef.current);
    }

    setIsMapInteracting(true);
  }, []);
  const handleMapInteractionEnd = useCallback(() => {
    if (interactionEndTimerRef.current) {
      clearTimeout(interactionEndTimerRef.current);
    }

    interactionEndTimerRef.current = setTimeout(() => {
      setIsMapInteracting(false);
    }, 760);
  }, []);

  useEffect(() => {
    Animated.timing(recommendationPanelOffset, {
      duration: isMapInteracting ? 220 : 320,
      easing: Easing.out(Easing.cubic),
      toValue: isMapInteracting ? 230 : 0,
      useNativeDriver: true,
    }).start();
  }, [isMapInteracting, recommendationPanelOffset]);

  useEffect(
    () => () => {
      if (interactionEndTimerRef.current) {
        clearTimeout(interactionEndTimerRef.current);
      }
    },
    [],
  );

  return (
    <View className="flex-1 overflow-hidden bg-[#050916]">
      <TravelMapBackground
        currentLocation={currentLocation}
        currentPlace={currentPlace}
        onInteractionEnd={handleMapInteractionEnd}
        onInteractionStart={handleMapInteractionStart}
      />
      <LinearGradient
        colors={['rgba(5,9,22,0.88)', 'rgba(5,9,22,0.32)', 'rgba(5,9,22,0)']}
        pointerEvents="none"
        style={styles.topFade}
      />
      <LinearGradient
        colors={['rgba(5,9,22,0)', 'rgba(5,9,22,0.64)', 'rgba(5,9,22,0.94)']}
        pointerEvents="none"
        style={styles.bottomFade}
      />

      <View
        className="absolute left-0 right-0 px-5"
        style={{ paddingTop: Math.max(insets.top + 4, 14), top: 0 }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
            <BrandLogo className="border border-white/25" size={34} />
            <View className="min-w-0">
              <AppText className="text-base font-semibold text-white">Soundlog</AppText>
              <AppText className="text-[11px] font-semibold text-soundlog-lime">
                여행 모드
              </AppText>
            </View>
          </View>
        </View>

        <View className="mt-2">
          <HomeHeader
            onSelectRecommendationMode={onSelectRecommendationMode}
            recommendationMode={recommendationMode}
          />
        </View>

        <View className="mt-3 flex-row items-center gap-2 rounded-full self-start bg-[#050916]/68 px-3 py-2">
          <Feather color="#B7E628" name="map-pin" size={14} />
          <AppText className="max-w-[260px] text-xs font-semibold text-white" numberOfLines={1}>
            {locationTitle}
          </AppText>
        </View>
      </View>

      <View
        className="absolute left-0 right-0"
        style={{
          bottom: getTabBarHeight(insets.bottom) + 18,
        }}
      >
        {isActive ? (
          <Animated.View style={{ transform: [{ translateY: recommendationPanelOffset }] }}>
            <ActiveRecommendationPanel
              isOpeningPlaylist={isOpeningPlaylist}
              isRecommendationError={isRecommendationError}
              isRecommendationLoading={isRecommendationLoading}
              moodLabel={moodLabel}
              needsLocation={needsLocation}
              onCaptureMoment={onCaptureMoment}
              onEditTravelState={onEditTravelState}
              onEndTravel={onEndTravel}
              onOpenPlaylist={onOpenPlaylist}
              onRefreshLocation={onRefreshLocation}
              onRetryRecommendation={onRetryRecommendation}
              playlist={playlist}
              recommendationSource={recommendationSource}
              sessionElapsedLabel={sessionElapsedLabel}
              travelLabel={travelLabel}
            />
          </Animated.View>
        ) : (
          <TravelStartPanel
            isLocationLoading={locationStatus === 'loading'}
            locationCaption={locationCaption}
            locationTitle={locationTitle}
            onRefreshLocation={onRefreshLocation}
            onStartTravel={onStartTravel}
          />
        )}

        {actionMessage ? (
          <View className="mx-5 mt-3 rounded-[16px] border border-amber-300/20 bg-amber-300/12 px-4 py-3">
            <AppText className="text-xs leading-5 text-amber-100">{actionMessage}</AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomFade: {
    bottom: 0,
    height: 360,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  fallbackLocationMarker: {
    left: '50%',
    marginLeft: -18,
    marginTop: -18,
    position: 'absolute',
    top: '48%',
  },
  fallbackMap: {
    backgroundColor: '#E9EEF5',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  locationMarker: {
    backgroundColor: '#1C8DFF',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 4,
    height: 28,
    shadowColor: '#000000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    width: 28,
  },
  locationMarkerHalo: {
    alignItems: 'center',
    backgroundColor: 'rgba(28,141,255,0.16)',
    borderRadius: 999,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  mapBlock: {
    backgroundColor: 'rgba(255,255,255,0.58)',
    borderColor: 'rgba(130,146,166,0.12)',
    borderRadius: 26,
    borderWidth: 1,
    position: 'absolute',
  },
  mapBlockOne: {
    height: 180,
    right: 36,
    top: 190,
    transform: [{ rotate: '12deg' }],
    width: 170,
  },
  mapBlockThree: {
    bottom: 190,
    height: 160,
    left: 40,
    transform: [{ rotate: '-18deg' }],
    width: 180,
  },
  mapBlockTwo: {
    height: 130,
    left: 28,
    top: 270,
    transform: [{ rotate: '-8deg' }],
    width: 138,
  },
  mapRoad: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(149,163,184,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    position: 'absolute',
    width: '120%',
  },
  mapRoadPrimary: {
    left: -40,
    top: '44%',
    transform: [{ rotate: '-18deg' }],
  },
  mapRoadSecondary: {
    left: -32,
    top: '58%',
    transform: [{ rotate: '24deg' }],
  },
  mapRoadTertiary: {
    left: -42,
    top: '30%',
    transform: [{ rotate: '38deg' }],
  },
  topFade: {
    height: 240,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
