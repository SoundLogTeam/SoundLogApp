import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AppText } from '@/components/AppText';
import { RecordDisc } from '@/components/recap-share/RecordDisc';
import {
  GeoPoint,
  RecapShare,
  RecapShareMoment,
  RecapTemplateId,
  RoutePoint,
} from '@/types/domain';

type RecapPreviewCardProps = {
  musicSticker?: RecapMusicStickerSettings;
  onMusicStickerDragChange?: (isDragging: boolean) => void;
  recap: RecapShare;
  template?: RecapTemplateId;
};

export type RecapMusicStickerTemplate = 'badge' | 'label' | 'player';
export type RecapMusicStickerTheme = 'glass' | 'lime' | 'mono';

export type RecapMusicStickerSettings = {
  template: RecapMusicStickerTemplate;
  theme: RecapMusicStickerTheme;
  visible: boolean;
};

type RecapCanvasSize = {
  height: number;
  width: number;
};

const RECAP_STICKER_PADDING = 14;
const recapMusicStickerSizes: Record<RecapMusicStickerTemplate, { height: number; width: number }> = {
  badge: { height: 68, width: 190 },
  label: { height: 72, width: 214 },
  player: { height: 82, width: 226 },
};

function RecapBackground({
  imageUrl,
  overlayClassName = 'bg-black/35',
}: {
  imageUrl?: string;
  overlayClassName?: string;
}) {
  return (
    <>
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          transition={300}
        />
      ) : (
        <LinearGradient
          colors={['#10172A', '#251339', '#392136']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View className={`absolute inset-0 ${overlayClassName}`} />
    </>
  );
}

function RecapLpTemplate({ recap }: { recap: RecapShare }) {
  return (
    <>
      <LinearGradient
        colors={['#050916', '#070A12', '#17101B']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.4)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(183,230,40,0.12)', 'rgba(183,230,40,0)', 'rgba(0,0,0,0)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={styles.lpAccentWash}
      />
      <View className="absolute inset-4 rounded-[18px] border border-white/10" />

      <View className="absolute left-5 right-5 top-5 flex-row items-center justify-between">
        <View>
          <AppText className="text-[10px] font-semibold tracking-[2px] text-white/58">
            SOUNDLOG LP
          </AppText>
          <AppText
            className="mt-1 text-[18px] font-semibold text-white"
            numberOfLines={1}
          >
            {recap.placeName}
          </AppText>
        </View>
        <View className="h-9 w-9 items-center justify-center rounded-full border border-white/22 bg-white/10">
          <AppText className="text-[10px] font-semibold text-white/72">
            REC
          </AppText>
        </View>
      </View>

      <View className="absolute inset-x-0 top-[82px] items-center">
        <RecordDisc />
      </View>

      <View
        className="absolute bottom-5 left-5 right-5 rounded-[18px] border border-white/16 p-4"
        style={styles.lpTrackPanel}
      >
        <View className="mb-3 h-px w-14 bg-white/45" />
        <AppText
          className="text-[24px] font-semibold leading-8 text-white"
          numberOfLines={2}
        >
          {recap.trackTitle}
        </AppText>
        <View className="mt-3 flex-row items-center justify-between gap-3">
          <AppText
            className="min-w-0 flex-1 text-xs font-medium text-white/76"
            numberOfLines={1}
          >
            {recap.artistName}
          </AppText>
          <AppText className="text-[10px] font-semibold tracking-[1.6px] text-white/46">
            TRAVEL CUT
          </AppText>
        </View>
      </View>
    </>
  );
}

function RecapAlbumTemplate({ recap }: { recap: RecapShare }) {
  return (
    <>
      <RecapBackground
        imageUrl={recap.backgroundImageUrl}
        overlayClassName="bg-black/22"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.82)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-4 rounded-[18px] border border-white/22" />

      <View className="absolute left-7 right-7 top-7 flex-row items-center justify-between">
        <AppText className="text-[11px] font-semibold tracking-[2.5px] text-white/75">
          SOUNDLOG
        </AppText>
        <View className="rounded-full border border-white/22 bg-white/10 px-3 py-1">
          <AppText className="text-[10px] font-medium text-white/70">
            ALBUM
          </AppText>
        </View>
      </View>

      <View className="absolute bottom-8 left-7 right-7">
        <AppText
          className="text-[12px] font-semibold tracking-[1.8px] text-white/62"
          numberOfLines={1}
        >
          {recap.placeName}
        </AppText>
        <AppText
          className="mt-3 text-[32px] font-semibold leading-9 text-white"
          numberOfLines={2}
        >
          {recap.trackTitle}
        </AppText>
        <View className="mt-5 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-white/42" />
          <AppText className="text-[11px] font-semibold text-white/58">
            SIDE A
          </AppText>
        </View>
        <View className="mt-4 rounded-[16px] bg-white/12 px-4 py-3">
          <AppText
            className="text-sm font-medium text-white/82"
            numberOfLines={1}
          >
            {recap.artistName}
          </AppText>
        </View>
      </View>
    </>
  );
}

function createFallbackMoment(recap: RecapShare): RecapShareMoment {
  return {
    artistName: recap.artistName,
    id: recap.id,
    imageUrl: recap.backgroundImageUrl,
    placeName: recap.placeName,
    recordedAt: recap.recordedAt,
    trackTitle: recap.trackTitle,
  };
}

type LocatedRecapMoment = RecapShareMoment & {
  location: GeoPoint;
};

const fallbackMapPinPositions = [
  { left: 54, top: 126 },
  { left: 190, top: 92 },
  { left: 226, top: 220 },
  { left: 104, top: 270 },
];
const ROUTE_LINE_HEIGHT = 4;

function hasLocation(moment: RecapShareMoment): moment is LocatedRecapMoment {
  return Boolean(moment.location);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createLocationPositions(locations: GeoPoint[]) {
  const latValues = locations.map((location) => location.lat);
  const lngValues = locations.map((location) => location.lng);
  const minLat = Math.min(...latValues);
  const maxLat = Math.max(...latValues);
  const minLng = Math.min(...lngValues);
  const maxLng = Math.max(...lngValues);
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  return locations.map((location, index) => {
    if (latRange < 0.0001 && lngRange < 0.0001) {
      return fallbackMapPinPositions[index % fallbackMapPinPositions.length];
    }

    const normalizedLat =
      latRange < 0.0001 ? 0.5 : (location.lat - minLat) / latRange;
    const normalizedLng =
      lngRange < 0.0001 ? 0.5 : (location.lng - minLng) / lngRange;

    return {
      left: clamp(52 + normalizedLng * 178, 42, 232),
      top: clamp(272 - normalizedLat * 178, 86, 276),
    };
  });
}

function createLocationPinPositions(moments: LocatedRecapMoment[]) {
  return createLocationPositions(moments.map((moment) => moment.location));
}

function getRouteLocations(routePoints: RoutePoint[] | undefined, moments: LocatedRecapMoment[]) {
  if (routePoints && routePoints.length > 1) {
    return routePoints;
  }

  return moments.map((moment) => moment.location);
}

function createRouteSegments(positions: Array<{ left: number; top: number }>) {
  return positions.slice(1).flatMap((position, index) => {
    const previousPosition = positions[index];
    const deltaX = position.left - previousPosition.left;
    const deltaY = position.top - previousPosition.top;
    const length = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    if (length < 2) {
      return [];
    }

    return [
      {
        angle: `${Math.atan2(deltaY, deltaX) * (180 / Math.PI)}deg`,
        left: (previousPosition.left + position.left) / 2 - length / 2,
        top: (previousPosition.top + position.top) / 2 - ROUTE_LINE_HEIGHT / 2,
        width: length,
      },
    ];
  });
}

function RecapFilmTemplate({ recap }: { recap: RecapShare }) {
  const moments = (
    recap.moments?.length ? recap.moments : [createFallbackMoment(recap)]
  ).slice(0, 3);

  return (
    <>
      <LinearGradient
        colors={['#060812', '#15111E', '#2A1726']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-5 rounded-[18px] border border-white/10" />
      <View className="absolute inset-y-0 left-3 justify-around py-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`left-${index}`}
            className="h-3 w-2 rounded-sm bg-white/20"
          />
        ))}
      </View>
      <View className="absolute inset-y-0 right-3 justify-around py-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`right-${index}`}
            className="h-3 w-2 rounded-sm bg-white/20"
          />
        ))}
      </View>

      <View className="absolute left-8 right-8 top-6">
        <AppText className="text-[11px] font-semibold tracking-[2px] text-white/55">
          SOUNDLOG FILM
        </AppText>
        <AppText
          className="mt-2 text-[24px] font-semibold text-white"
          numberOfLines={1}
        >
          {recap.placeName}
        </AppText>
      </View>

      <View className="absolute bottom-6 left-8 right-8 gap-3">
        {moments.map((moment, index) => (
          <View
            key={moment.id}
            className="h-[82px] overflow-hidden rounded-[14px] border border-white/12 bg-white/[0.06]"
          >
            {moment.imageUrl ? (
              <Image
                contentFit="cover"
                source={{ uri: moment.imageUrl }}
                style={StyleSheet.absoluteFill}
                transition={250}
              />
            ) : (
              <LinearGradient
                colors={['#1F2A44', '#2B176C']}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View className="absolute inset-0 bg-black/34" />
            <View className="absolute bottom-3 left-3 right-3">
              <AppText className="text-[10px] font-semibold text-white/55">
                {String(index + 1).padStart(2, '0')}
              </AppText>
              <AppText
                className="mt-1 text-[13px] font-semibold text-white"
                numberOfLines={1}
              >
                {moment.trackTitle}
              </AppText>
              <AppText
                className="mt-1 text-[10px] text-white/68"
                numberOfLines={1}
              >
                {moment.placeName}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function RecapMapTemplate({ recap }: { recap: RecapShare }) {
  const recapMoments = recap.moments?.length
    ? recap.moments
    : [createFallbackMoment(recap)];
  const locatedMoments = recapMoments.filter(hasLocation);
  const hasRecordedLocations = locatedMoments.length > 0;
  const moments = (hasRecordedLocations ? locatedMoments : recapMoments).slice(
    0,
    4,
  );
  const routeLocations = getRouteLocations(recap.routePoints, locatedMoments);
  const routeSegments =
    routeLocations.length > 1
      ? createRouteSegments(createLocationPositions(routeLocations))
      : [];
  const pinPositions = hasRecordedLocations
    ? createLocationPinPositions(moments as LocatedRecapMoment[])
    : fallbackMapPinPositions;

  return (
    <>
      <LinearGradient
        colors={['#07131F', '#0E2532', '#1D1D36']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-5 overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
        {Array.from({ length: 5 }).map((_, index) => (
          <View
            className="absolute left-0 right-0 h-px"
            key={`h-${index}`}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              top: `${18 + index * 16}%`,
            }}
          />
        ))}
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            className="absolute bottom-0 top-0 w-px"
            key={`v-${index}`}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              left: `${20 + index * 20}%`,
            }}
          />
        ))}
        <View
          className="absolute h-20 w-[150%] rounded-full border"
          style={{
            borderColor: 'rgba(183,230,40,0.3)',
            left: '-20%',
            top: '42%',
            transform: [{ rotate: '-24deg' }],
          }}
        />
        <View
          className="absolute h-16 w-[130%] rounded-full border"
          style={{
            borderColor: 'rgba(158,168,255,0.24)',
            left: '-12%',
            top: '18%',
            transform: [{ rotate: '28deg' }],
          }}
        />
      </View>

      {routeSegments.map((segment, index) => (
        <View
          key={`route-${index}`}
          style={[
            styles.routeSegment,
            {
              left: segment.left,
              top: segment.top,
              transform: [{ rotate: segment.angle }],
              width: segment.width,
            },
          ]}
        />
      ))}

      <View className="absolute left-7 right-7 top-7">
        <AppText className="text-[11px] font-semibold tracking-[2px] text-[#B7E628]">
          {routeSegments.length ? 'TRAVEL ROUTE' : hasRecordedLocations ? 'MOMENT MAP' : 'SOUNDLOG MAP'}
        </AppText>
        <AppText className="mt-2 text-[25px] font-semibold leading-8 text-white" numberOfLines={2}>
          {recap.placeName}
        </AppText>
        <View className="mt-3 self-start rounded-full border border-white/12 bg-black/35 px-3 py-1.5">
          <AppText className="text-[10px] font-semibold text-white/66">
            {hasRecordedLocations
              ? routeSegments.length && recap.routePoints?.length
                ? `${recap.routePoints.length}개 이동 좌표 저장됨`
                : `${locatedMoments.length}개 촬영 위치 저장됨`
              : '장소 흐름 미리보기'}
          </AppText>
        </View>
      </View>

      {moments.map((moment, index) => (
        <View
          className="absolute items-center"
          key={moment.id}
          style={pinPositions[index % pinPositions.length]}
        >
          <View className="h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-[#B7E628]">
            <AppText className="text-[11px] font-semibold text-[#050916]">
              {index + 1}
            </AppText>
          </View>
          <View className="mt-1 rounded-full bg-black/60 px-2 py-1">
            <AppText className="text-[9px] font-semibold text-white" numberOfLines={1}>
              {moment.placeName}
            </AppText>
          </View>
        </View>
      ))}

      <View className="absolute bottom-6 left-6 right-6 rounded-[18px] border border-white/10 bg-black/60 p-4">
        <AppText className="text-[10px] font-semibold text-white/55">
          {hasRecordedLocations ? '촬영 위치와 대표 사운드' : '대표 사운드'}
        </AppText>
        <AppText className="mt-2 text-[22px] font-semibold text-white" numberOfLines={1}>
          {recap.trackTitle}
        </AppText>
        <AppText className="mt-2 text-xs font-medium text-white/70" numberOfLines={1}>
          {moments.length}개 장소 · {recap.artistName}
        </AppText>
      </View>
    </>
  );
}

function clampStickerPosition(
  position: { x: number; y: number },
  canvasSize: RecapCanvasSize,
  stickerSize: { height: number; width: number },
) {
  if (!canvasSize.height || !canvasSize.width) {
    return { x: RECAP_STICKER_PADDING, y: RECAP_STICKER_PADDING };
  }

  return {
    x: Math.min(
      Math.max(position.x, RECAP_STICKER_PADDING),
      Math.max(RECAP_STICKER_PADDING, canvasSize.width - stickerSize.width - RECAP_STICKER_PADDING),
    ),
    y: Math.min(
      Math.max(position.y, RECAP_STICKER_PADDING),
      Math.max(RECAP_STICKER_PADDING, canvasSize.height - stickerSize.height - RECAP_STICKER_PADDING),
    ),
  };
}

function getDefaultMusicStickerPosition(
  canvasSize: RecapCanvasSize,
  stickerSize: { height: number; width: number },
) {
  return clampStickerPosition(
    {
      x: canvasSize.width - stickerSize.width - RECAP_STICKER_PADDING,
      y: canvasSize.height - stickerSize.height - RECAP_STICKER_PADDING,
    },
    canvasSize,
    stickerSize,
  );
}

function getRecapMusicStickerThemeStyle(theme: RecapMusicStickerTheme) {
  if (theme === 'lime') {
    return {
      container: {
        backgroundColor: 'rgba(183,230,40,0.94)',
        borderColor: 'rgba(255,255,255,0.42)',
      },
      iconBubble: { backgroundColor: 'rgba(5,9,22,0.14)' },
      iconColor: '#050916',
      metaText: { color: 'rgba(5,9,22,0.62)' },
      primaryText: { color: '#050916' },
      secondaryText: { color: 'rgba(5,9,22,0.68)' },
    };
  }

  if (theme === 'mono') {
    return {
      container: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: 'rgba(255,255,255,0.66)',
      },
      iconBubble: { backgroundColor: 'rgba(5,9,22,0.08)' },
      iconColor: 'rgba(5,9,22,0.72)',
      metaText: { color: 'rgba(5,9,22,0.52)' },
      primaryText: { color: '#050916' },
      secondaryText: { color: 'rgba(5,9,22,0.62)' },
    };
  }

  return {
    container: {
      backgroundColor: 'rgba(5,9,22,0.7)',
      borderColor: 'rgba(255,255,255,0.2)',
    },
    iconBubble: { backgroundColor: 'rgba(255,255,255,0.1)' },
    iconColor: 'rgba(255,255,255,0.82)',
    metaText: { color: 'rgba(255,255,255,0.5)' },
    primaryText: { color: '#FFFFFF' },
    secondaryText: { color: 'rgba(255,255,255,0.66)' },
  };
}

function getRecapMusicStickerTemplateStyle(template: RecapMusicStickerTemplate) {
  if (template === 'badge') {
    return {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 10,
    };
  }

  if (template === 'label') {
    return {
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 10,
    };
  }

  return {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  };
}

function RecapMusicSticker({
  artist,
  isDragging,
  settings,
  title,
}: {
  artist: string;
  isDragging: boolean;
  settings: RecapMusicStickerSettings;
  title: string;
}) {
  const themeStyle = getRecapMusicStickerThemeStyle(settings.theme);

  if (settings.template === 'badge') {
    return (
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full" style={themeStyle.iconBubble}>
          <Feather color={themeStyle.iconColor} name="music" size={17} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-[9px] font-semibold uppercase" style={themeStyle.metaText}>
            Current music
          </AppText>
          <AppText className="mt-1 text-[14px] font-semibold" numberOfLines={1} style={themeStyle.primaryText}>
            {title}
          </AppText>
        </View>
        {isDragging ? <Feather color={themeStyle.iconColor} name="move" size={13} /> : null}
      </View>
    );
  }

  if (settings.template === 'label') {
    return (
      <View>
        <View className="flex-row items-center justify-between">
          <AppText className="text-[9px] font-semibold uppercase" style={themeStyle.metaText}>
            Soundlog pick
          </AppText>
          <Feather color={themeStyle.iconColor} name="move" size={13} />
        </View>
        <AppText className="mt-2 text-[17px] font-semibold" numberOfLines={1} style={themeStyle.primaryText}>
          {title}
        </AppText>
        <AppText className="mt-1 text-[11px] font-semibold" numberOfLines={1} style={themeStyle.secondaryText}>
          {artist}
        </AppText>
      </View>
    );
  }

  return (
    <>
      <View className="flex-row items-center justify-between">
        <AppText className="text-[9px] font-semibold uppercase" style={themeStyle.metaText}>
          Now playing
        </AppText>
        <Feather color={themeStyle.iconColor} name="move" size={13} />
      </View>
      <View className="mt-2 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full" style={themeStyle.iconBubble}>
          <Feather color={themeStyle.iconColor} name="headphones" size={17} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-[15px] font-semibold" numberOfLines={1} style={themeStyle.primaryText}>
            {title}
          </AppText>
          <AppText className="mt-0.5 text-[11px] font-semibold" numberOfLines={1} style={themeStyle.secondaryText}>
            {artist}
          </AppText>
        </View>
      </View>
    </>
  );
}

export function RecapPreviewCard({
  musicSticker = { template: 'player', theme: 'glass', visible: true },
  onMusicStickerDragChange,
  recap,
  template = 'lp',
}: RecapPreviewCardProps) {
  const stickerPan = useRef(
    new Animated.ValueXY({ x: RECAP_STICKER_PADDING, y: RECAP_STICKER_PADDING }),
  ).current;
  const stickerPositionRef = useRef({ x: RECAP_STICKER_PADDING, y: RECAP_STICKER_PADDING });
  const didPlaceStickerRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState<RecapCanvasSize>({ height: 0, width: 0 });
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const stickerSize = recapMusicStickerSizes[musicSticker.template];
  const stickerThemeStyle = getRecapMusicStickerThemeStyle(musicSticker.theme);
  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    setCanvasSize((current) =>
      current.height === height && current.width === width
        ? current
        : { height, width },
    );
  };
  const finishDragging = useCallback(() => {
    setIsDraggingSticker(false);
    onMusicStickerDragChange?.(false);
    stickerPan.stopAnimation((value) => {
      stickerPositionRef.current = clampStickerPosition(value, canvasSize, stickerSize);
      stickerPan.setValue(stickerPositionRef.current);
    });
  }, [canvasSize, onMusicStickerDragChange, stickerPan, stickerSize]);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => {
          setIsDraggingSticker(true);
          onMusicStickerDragChange?.(true);
          stickerPan.stopAnimation((value) => {
            const nextPosition = clampStickerPosition(value, canvasSize, stickerSize);
            stickerPositionRef.current = nextPosition;
            stickerPan.setValue(nextPosition);
          });
        },
        onPanResponderMove: (_, gestureState) => {
          stickerPan.setValue(
            clampStickerPosition(
              {
                x: stickerPositionRef.current.x + gestureState.dx,
                y: stickerPositionRef.current.y + gestureState.dy,
              },
              canvasSize,
              stickerSize,
            ),
          );
        },
        onPanResponderRelease: finishDragging,
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: finishDragging,
        onShouldBlockNativeResponder: () => true,
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
      }),
    [canvasSize, finishDragging, onMusicStickerDragChange, stickerPan, stickerSize],
  );

  useEffect(() => {
    didPlaceStickerRef.current = false;
  }, [recap.id, template]);

  useEffect(() => {
    if (!canvasSize.height || !canvasSize.width) {
      return;
    }

    if (!didPlaceStickerRef.current) {
      const defaultPosition = getDefaultMusicStickerPosition(canvasSize, stickerSize);

      stickerPositionRef.current = defaultPosition;
      stickerPan.setValue(defaultPosition);
      didPlaceStickerRef.current = true;
      return;
    }

    const nextPosition = clampStickerPosition(
      stickerPositionRef.current,
      canvasSize,
      stickerSize,
    );

    stickerPositionRef.current = nextPosition;
    stickerPan.setValue(nextPosition);
  }, [canvasSize, stickerPan, stickerSize]);

  return (
    <View
      className="h-full w-full overflow-hidden rounded-[20px] border border-white/15 bg-black/60"
      onLayout={handleLayout}
    >
      {template === 'album' ? <RecapAlbumTemplate recap={recap} /> : null}
      {template === 'lp' ? <RecapLpTemplate recap={recap} /> : null}
      {template === 'film' ? <RecapFilmTemplate recap={recap} /> : null}
      {template === 'map' ? <RecapMapTemplate recap={recap} /> : null}
      {musicSticker.visible ? (
        <Animated.View
          {...panResponder.panHandlers}
          accessibilityLabel={`${recap.trackTitle} 음악 스티커`}
          accessibilityRole="button"
          style={[
            styles.recapMusicSticker,
            stickerThemeStyle.container,
            getRecapMusicStickerTemplateStyle(musicSticker.template),
            isDraggingSticker ? styles.recapMusicStickerDragging : null,
            {
              minHeight: stickerSize.height,
              transform: [
                ...stickerPan.getTranslateTransform(),
                ...(isDraggingSticker ? [{ scale: 1.02 }] : []),
              ],
              width: stickerSize.width,
            },
          ]}
        >
          <RecapMusicSticker
            artist={recap.artistName}
            isDragging={isDraggingSticker}
            settings={musicSticker}
            title={recap.trackTitle}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lpAccentWash: {
    height: 180,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  lpTrackPanel: {
    backgroundColor: 'rgba(5,9,22,0.88)',
  },
  routeSegment: {
    backgroundColor: 'rgba(183,230,40,0.88)',
    borderRadius: 999,
    height: ROUTE_LINE_HEIGHT,
    position: 'absolute',
    shadowColor: '#B7E628',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  recapMusicSticker: {
    borderWidth: 1,
    left: 0,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    top: 0,
  },
  recapMusicStickerDragging: {
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
});
