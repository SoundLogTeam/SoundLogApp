import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  type ComponentProps,
  type ComponentRef,
  forwardRef,
  type MutableRefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  type LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import type { MapStyleElement } from 'react-native-maps';

import { AppText } from '@/components/AppText';
import type { GeoPoint, RecapTemplateId, Track } from '@/types/domain';

type NativeMapsModule = typeof import('react-native-maps');

type StickerTheme = 'glass' | 'lime' | 'mono';
type TimestampStickerTemplate = 'card' | 'stamp' | 'type';
type MusicStickerTemplate = 'player' | 'label' | 'vinyl';
type StickerKind = 'music';
type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type MomentPhotoCanvasHandle = {
  capturePhoto: () => Promise<string | undefined>;
};

type MomentPhotoCanvasProps = {
  capturedAt?: string;
  isSaving: boolean;
  location?: GeoPoint;
  onStickerDragChange?: (isDragging: boolean) => void;
  photoUri: string;
  placeName?: string;
  selectedTemplate: RecapTemplateId;
  track?: Track;
};

type CanvasSize = {
  height: number;
  width: number;
};

type StickerSize = {
  height: number;
  width: number;
};

type StickerPosition = {
  x: number;
  y: number;
};

const CANVAS_PADDING = 16;
export const MOMENT_PHOTO_CANVAS_ASPECT_RATIO = 4 / 5;
const recapMapDarkStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#10172A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#B8C0D8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B1020' }] },
  {
    elementType: 'geometry',
    featureType: 'poi.park',
    stylers: [{ color: '#163020' }],
  },
  {
    elementType: 'geometry',
    featureType: 'road',
    stylers: [{ color: '#273147' }],
  },
  {
    elementType: 'geometry',
    featureType: 'road.highway',
    stylers: [{ color: '#38435C' }],
  },
  {
    elementType: 'geometry',
    featureType: 'water',
    stylers: [{ color: '#0A2238' }],
  },
];

let nativeMapsModule: NativeMapsModule | undefined;

function getNativeMaps() {
  if (Platform.OS === 'web') {
    return undefined;
  }

  nativeMapsModule ??= require('react-native-maps') as NativeMapsModule;
  return nativeMapsModule;
}

const timestampStickerSizes: Record<TimestampStickerTemplate, StickerSize> = {
  card: { height: 90, width: 184 },
  stamp: { height: 78, width: 164 },
  type: { height: 82, width: 206 },
};

const musicStickerSizes: Record<MusicStickerTemplate, StickerSize> = {
  label: { height: 70, width: 206 },
  player: { height: 82, width: 228 },
  vinyl: { height: 88, width: 218 },
};

const timestampStickerTemplates: Array<{
  label: string;
  value: TimestampStickerTemplate;
}> = [
  { label: '카드', value: 'card' },
  { label: '스탬프', value: 'stamp' },
  { label: '타이포', value: 'type' },
];

const musicStickerTemplates: Array<{
  label: string;
  value: MusicStickerTemplate;
}> = [
  { label: '플레이어', value: 'player' },
  { label: '라벨', value: 'label' },
  { label: '바이닐', value: 'vinyl' },
];

const stickerThemes: Array<{
  label: string;
  value: StickerTheme;
}> = [
  { label: '글래스', value: 'glass' },
  { label: '라임', value: 'lime' },
  { label: '모노', value: 'mono' },
];

const recapTemplatePresets: Record<
  RecapTemplateId,
  {
    musicTemplate: MusicStickerTemplate;
    musicTheme: StickerTheme;
    timestampTemplate: TimestampStickerTemplate;
    timestampTheme: StickerTheme;
  }
> = {
  album: {
    musicTemplate: 'player',
    musicTheme: 'glass',
    timestampTemplate: 'card',
    timestampTheme: 'glass',
  },
  film: {
    musicTemplate: 'label',
    musicTheme: 'glass',
    timestampTemplate: 'type',
    timestampTheme: 'glass',
  },
  lp: {
    musicTemplate: 'vinyl',
    musicTheme: 'mono',
    timestampTemplate: 'stamp',
    timestampTheme: 'mono',
  },
  map: {
    musicTemplate: 'label',
    musicTheme: 'lime',
    timestampTemplate: 'card',
    timestampTheme: 'lime',
  },
};

export const MomentPhotoCanvas = forwardRef<
  MomentPhotoCanvasHandle,
  MomentPhotoCanvasProps
>(function MomentPhotoCanvas(
  {
    capturedAt,
    isSaving,
    location,
    onStickerDragChange,
    photoUri,
    placeName,
    selectedTemplate,
    track,
  },
  ref,
) {
  const initialPreset = recapTemplatePresets[selectedTemplate];
  const photoCaptureRef = useRef<ComponentRef<typeof ViewShot>>(null);
  const timestampPan = useRef(
    new Animated.ValueXY({ x: CANVAS_PADDING, y: CANVAS_PADDING }),
  ).current;
  const musicPan = useRef(
    new Animated.ValueXY({ x: CANVAS_PADDING, y: CANVAS_PADDING }),
  ).current;
  const timestampPositionRef = useRef<StickerPosition>({
    x: CANVAS_PADDING,
    y: CANVAS_PADDING,
  });
  const musicPositionRef = useRef<StickerPosition>({
    x: CANVAS_PADDING,
    y: CANVAS_PADDING,
  });
  const didPlaceTimestampRef = useRef(false);
  const didPlaceMusicRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    height: 0,
    width: 0,
  });
  const [activeSticker, setActiveSticker] = useState<StickerKind>();
  const [timestampTheme, setTimestampTheme] = useState<StickerTheme>(
    initialPreset.timestampTheme,
  );
  const [timestampTemplate, setTimestampTemplate] =
    useState<TimestampStickerTemplate>(initialPreset.timestampTemplate);
  const [musicTheme, setMusicTheme] = useState<StickerTheme>(
    initialPreset.musicTheme,
  );
  const [musicTemplate, setMusicTemplate] =
    useState<MusicStickerTemplate>(initialPreset.musicTemplate);
  const [musicVisible, setMusicVisible] = useState(Boolean(track));
  const stickerDateTime = useMemo(
    () => formatStickerDateTime(capturedAt),
    [capturedAt],
  );
  const timestampStickerSize = timestampStickerSizes[timestampTemplate];
  const musicStickerSize = musicStickerSizes[musicTemplate];
  const timestampThemeStyle = getStickerThemeStyle(timestampTheme);
  const musicThemeStyle = getStickerThemeStyle(musicTheme);
  const isDraggingMusic = activeSticker === 'music';
  const isMapTemplate = selectedTemplate === 'map';

  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    setCanvasSize((current) =>
      current.height === height && current.width === width
        ? current
        : { height, width },
    );
  };

  const handleDragStart = useCallback(
    (sticker: StickerKind) => {
      setActiveSticker(sticker);
      onStickerDragChange?.(true);
    },
    [onStickerDragChange],
  );

  const handleDragEnd = useCallback(() => {
    setActiveSticker(undefined);
    onStickerDragChange?.(false);
  }, [onStickerDragChange]);

  const musicPanResponder = useMemo(
    () =>
      createStickerPanResponder({
        canvasSize,
        onDragEnd: handleDragEnd,
        onDragStart: () => handleDragStart('music'),
        pan: musicPan,
        positionRef: musicPositionRef,
        size: musicStickerSize,
      }),
    [canvasSize, handleDragEnd, handleDragStart, musicPan, musicStickerSize],
  );

  useImperativeHandle(
    ref,
    () => ({
      capturePhoto: () =>
        photoCaptureRef.current?.capture?.() ?? Promise.resolve(undefined),
    }),
    [],
  );

  useEffect(() => {
    didPlaceTimestampRef.current = false;
    didPlaceMusicRef.current = false;
  }, [photoUri]);

  useEffect(() => {
    const preset = recapTemplatePresets[selectedTemplate];

    setTimestampTemplate(preset.timestampTemplate);
    setTimestampTheme(preset.timestampTheme);
    setMusicTemplate(preset.musicTemplate);
    setMusicTheme(preset.musicTheme);
    didPlaceTimestampRef.current = false;
    didPlaceMusicRef.current = false;
  }, [photoUri, selectedTemplate]);

  useEffect(() => {
    setMusicVisible(Boolean(track));
    didPlaceMusicRef.current = false;
  }, [photoUri, track?.id, track]);

  useEffect(() => {
    if (!canvasSize.height || !canvasSize.width) {
      return;
    }

    if (!didPlaceTimestampRef.current) {
      const defaultPosition = getDefaultTimestampStickerPosition(
        canvasSize,
        timestampStickerSize,
      );

      timestampPositionRef.current = defaultPosition;
      timestampPan.setValue(defaultPosition);
      didPlaceTimestampRef.current = true;
    } else {
      const nextPosition = clampStickerPosition(
        timestampPositionRef.current,
        canvasSize,
        timestampStickerSize,
      );

      timestampPositionRef.current = nextPosition;
      timestampPan.setValue(nextPosition);
    }

    if (!didPlaceMusicRef.current) {
      const defaultPosition = getDefaultMusicStickerPosition(
        canvasSize,
        musicStickerSize,
      );

      musicPositionRef.current = defaultPosition;
      musicPan.setValue(defaultPosition);
      didPlaceMusicRef.current = true;
      return;
    }

    const nextMusicPosition = clampStickerPosition(
      musicPositionRef.current,
      canvasSize,
      musicStickerSize,
    );

    musicPositionRef.current = nextMusicPosition;
    musicPan.setValue(nextMusicPosition);
  }, [canvasSize, musicPan, musicStickerSize, timestampPan, timestampStickerSize]);

  return (
    <View className="mt-8">
      <ViewShot
        ref={photoCaptureRef}
        options={{ format: 'jpg', quality: 0.96, result: 'tmpfile' }}
        style={styles.photoCaptureFrame}
      >
        <View
          accessibilityLabel={`${selectedTemplate} 리캡 템플릿 미리보기`}
          collapsable={false}
          onLayout={handleCanvasLayout}
          style={[
            styles.photoCanvas,
            getPhotoCanvasTemplateStyle(selectedTemplate),
          ]}
        >
          {isMapTemplate ? (
            <MapTemplateBackground
              location={location}
              placeName={placeName}
              track={track}
            />
          ) : (
            <>
              <Image
                contentFit="cover"
                source={{ uri: photoUri }}
                style={StyleSheet.absoluteFill}
              />
              <View pointerEvents="none" style={styles.photoCanvasShade} />
              <LinearGradient
                colors={['rgba(5,9,22,0)', 'rgba(5,9,22,0.98)']}
                pointerEvents="none"
                style={styles.photoCanvasBottomVignette}
              />
              <View pointerEvents="none" style={styles.photoCanvasBottomCover} />
            </>
          )}

          <Animated.View
            accessibilityLabel={`${stickerDateTime.time} 고정 촬영 시간`}
            accessibilityRole="image"
            style={[
              styles.timestampSticker,
              timestampThemeStyle.container,
              getTimestampTemplateStyle(timestampTemplate),
              {
                minHeight: timestampStickerSize.height,
                transform: timestampPan.getTranslateTransform(),
                width: timestampStickerSize.width,
              },
            ]}
          >
            <TimestampStickerContent
              date={stickerDateTime.date}
              iconColor={timestampThemeStyle.iconColor}
              template={timestampTemplate}
              textStyle={timestampThemeStyle}
              time={stickerDateTime.time}
            />
          </Animated.View>

          {!isMapTemplate && musicVisible && track ? (
            <Animated.View
              {...musicPanResponder.panHandlers}
              accessibilityLabel={`${track.title} 음악 스티커`}
              accessibilityRole="button"
              style={[
                styles.musicSticker,
                musicThemeStyle.container,
                getMusicTemplateStyle(musicTemplate),
                isDraggingMusic ? styles.stickerDragging : null,
                {
                  minHeight: musicStickerSize.height,
                  transform: [
                    ...musicPan.getTranslateTransform(),
                    ...(isDraggingMusic ? [{ scale: 1.02 }] : []),
                  ],
                  width: musicStickerSize.width,
                },
              ]}
            >
              <MusicStickerContent
                artist={track.artist}
                iconColor={musicThemeStyle.iconColor}
                template={musicTemplate}
                textStyle={musicThemeStyle}
                title={track.title}
              />
            </Animated.View>
          ) : null}
        </View>
      </ViewShot>

      <View className="mt-3 gap-3">
        <View className="border-t border-white/10 pt-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1 flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-black/25">
                <Feather color="rgba(255,255,255,0.76)" name="clock" size={15} />
              </View>
              <View className="min-w-0 flex-1">
                <AppText className="text-sm font-semibold text-white">
                  촬영 시간
                </AppText>
                <AppText className="mt-0.5 text-[11px] text-white/45">
                  촬영 시각으로 고정되며 이동할 수 없어요.
                </AppText>
              </View>
            </View>
            <AppText className="text-sm font-semibold text-white/72">
              {stickerDateTime.time}
            </AppText>
          </View>

          <View className="mt-3 gap-2">
            <StickerSegment
              disabled={isSaving}
              onChange={setTimestampTemplate}
              options={timestampStickerTemplates}
              value={timestampTemplate}
            />
            <StickerSegment
              disabled={isSaving}
              onChange={setTimestampTheme}
              options={stickerThemes}
              value={timestampTheme}
            />
          </View>
        </View>

        <View className="border-t border-white/10 pt-4">
          {isMapTemplate ? (
            <View className="flex-row items-center gap-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-soundlog-lime">
                <Feather color="#050916" name="map-pin" size={15} />
              </View>
              <View className="min-w-0 flex-1">
                <AppText className="text-sm font-semibold text-white">
                  지도 음악 핀
                </AppText>
                <AppText
                  className="mt-1 text-xs leading-5 text-white/50"
                  numberOfLines={2}
                >
                  {track
                    ? `${track.title} - ${track.artist}가 저장 위치 핀에 고정돼요.`
                    : '음악을 선택하면 저장 위치 핀에 곡 정보가 표시돼요.'}
                </AppText>
              </View>
            </View>
          ) : (
            <>
              <StickerControlHeader
                disabled={!track}
                icon="music"
                isSaving={isSaving}
                onToggle={() => setMusicVisible((value) => !value)}
                title="현재 음악 스티커"
                visible={musicVisible && Boolean(track)}
              />
              <AppText
                className="mt-2 text-xs leading-5 text-white/50"
                numberOfLines={2}
              >
                {track
                  ? `${track.title} - ${track.artist}`
                  : '선택한 음악이 있으면 사진 위에 함께 배치할 수 있어요.'}
              </AppText>
              <View className="mt-3 gap-2">
                <StickerSegment
                  disabled={isSaving || !track}
                  onChange={setMusicTemplate}
                  options={musicStickerTemplates}
                  value={musicTemplate}
                />
                <StickerSegment
                  disabled={isSaving || !track}
                  onChange={setMusicTheme}
                  options={stickerThemes}
                  value={musicTheme}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
});

function MapTemplateBackground({
  location,
  placeName,
  track,
}: {
  location?: GeoPoint;
  placeName?: string;
  track?: Track;
}) {
  const NativeMaps = getNativeMaps();
  const placeLabel = placeName?.trim() || (location ? '저장 위치' : '위치 정보 없음');

  if (!NativeMaps || !location) {
    return (
      <FallbackRecapMap placeLabel={placeLabel} track={track} />
    );
  }

  const MapView = NativeMaps.default;
  const Marker = NativeMaps.Marker;

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        customMapStyle={Platform.OS === 'android' ? recapMapDarkStyle : undefined}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        pitchEnabled={false}
        pointerEvents="none"
        region={{
          latitude: location.lat,
          latitudeDelta: 0.012,
          longitude: location.lng,
          longitudeDelta: 0.012,
        }}
        rotateEnabled={false}
        scrollEnabled={false}
        showsBuildings={false}
        showsCompass={false}
        showsPointsOfInterests
        showsScale={false}
        style={StyleSheet.absoluteFill}
        toolbarEnabled={false}
        userInterfaceStyle="dark"
        zoomEnabled={false}
      >
        <Marker
          anchor={{ x: 0.5, y: 1 }}
          coordinate={{ latitude: location.lat, longitude: location.lng }}
        >
          <MapMusicPin track={track} />
        </Marker>
      </MapView>
      <View pointerEvents="none" style={styles.mapEdgeShade} />
      <MapPlaceLabel label={placeLabel} />
    </View>
  );
}

function MapMusicPin({ track }: { track?: Track }) {
  return (
    <View
      accessibilityLabel={track ? `${track.title} 음악 위치 핀` : '음악 없는 위치 핀'}
      style={styles.mapPinContainer}
    >
      <View style={styles.mapMusicBubble}>
        {track?.albumImageUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: track.albumImageUrl }}
            style={styles.mapMusicArtwork}
          />
        ) : (
          <View
            style={[
              styles.mapMusicArtworkFallback,
              { backgroundColor: track?.fallbackColor ?? '#B7E628' },
            ]}
          >
            <Feather color="#050916" name="music" size={16} />
          </View>
        )}
        <View style={styles.mapMusicText}>
          <AppText numberOfLines={1} style={styles.mapMusicTitle}>
            {track?.title ?? '음악을 선택해 주세요'}
          </AppText>
          <AppText numberOfLines={1} style={styles.mapMusicArtist}>
            {track?.artist ?? 'Soundlog'}
          </AppText>
        </View>
      </View>
      <View style={styles.mapPinConnector} />
      <View style={styles.mapPinHead}>
        <Feather color="#050916" name="music" size={15} />
      </View>
      <View style={styles.mapPinPoint} />
    </View>
  );
}

function MapPlaceLabel({ label }: { label: string }) {
  return (
    <View pointerEvents="none" style={styles.mapPlaceLabel}>
      <Feather color="#B7E628" name="map-pin" size={12} />
      <AppText numberOfLines={1} style={styles.mapPlaceLabelText}>
        {label}
      </AppText>
    </View>
  );
}

function FallbackRecapMap({
  placeLabel,
  track,
}: {
  placeLabel: string;
  track?: Track;
}) {
  return (
    <View style={styles.fallbackMap}>
      <View style={[styles.fallbackRoad, styles.fallbackRoadOne]} />
      <View style={[styles.fallbackRoad, styles.fallbackRoadTwo]} />
      <View style={[styles.fallbackRoad, styles.fallbackRoadThree]} />
      <View style={[styles.fallbackBlock, styles.fallbackBlockOne]} />
      <View style={[styles.fallbackBlock, styles.fallbackBlockTwo]} />
      <View style={[styles.fallbackBlock, styles.fallbackBlockThree]} />
      <View style={styles.fallbackMapPin}>
        <MapMusicPin track={track} />
      </View>
      <MapPlaceLabel label={placeLabel} />
    </View>
  );
}

function createStickerPanResponder({
  canvasSize,
  onDragEnd,
  onDragStart,
  pan,
  positionRef,
  size,
}: {
  canvasSize: CanvasSize;
  onDragEnd: () => void;
  onDragStart: () => void;
  pan: Animated.ValueXY;
  positionRef: MutableRefObject<StickerPosition>;
  size: StickerSize;
}) {
  const finishDrag = () => {
    onDragEnd();
    pan.stopAnimation((value) => {
      positionRef.current = clampStickerPosition(value, canvasSize, size);
      pan.setValue(positionRef.current);
    });
  };

  return PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
    onMoveShouldSetPanResponderCapture: (_, gestureState) =>
      Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
    onPanResponderGrant: () => {
      onDragStart();
      pan.stopAnimation((value) => {
        const nextPosition = clampStickerPosition(value, canvasSize, size);
        positionRef.current = nextPosition;
        pan.setValue(nextPosition);
      });
    },
    onPanResponderMove: (_, gestureState) => {
      const nextPosition = clampStickerPosition(
        {
          x: positionRef.current.x + gestureState.dx,
          y: positionRef.current.y + gestureState.dy,
        },
        canvasSize,
        size,
      );

      pan.setValue(nextPosition);
    },
    onPanResponderRelease: finishDrag,
    onPanResponderTerminationRequest: () => false,
    onPanResponderTerminate: finishDrag,
    onShouldBlockNativeResponder: () => true,
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
  });
}

function TimestampStickerContent({
  date,
  iconColor,
  template,
  textStyle,
  time,
}: {
  date: string;
  iconColor: string;
  template: TimestampStickerTemplate;
  textStyle: ReturnType<typeof getStickerThemeStyle>;
  time: string;
}) {
  if (template === 'stamp') {
    return (
      <View className="items-center justify-center">
        <AppText className="text-[23px] font-semibold leading-7" style={textStyle.timeText}>
          {time || '--:--'}
        </AppText>
        <View className="my-1 h-px w-14" style={textStyle.divider} />
        <AppText className="text-[10px] font-semibold" style={textStyle.dateText}>
          {date}
        </AppText>
      </View>
    );
  }

  if (template === 'type') {
    return (
      <View>
        <View className="flex-row items-end gap-2">
          <AppText className="text-[28px] font-semibold leading-8" style={textStyle.timeText}>
            {time || '--:--'}
          </AppText>
          <AppText className="pb-1 text-[11px] font-semibold" style={textStyle.dateText}>
            {date}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="flex-row items-center justify-between">
        <AppText className="text-[9px] font-semibold" style={textStyle.metaText}>
          촬영 시간
        </AppText>
        <Feather color={iconColor} name="lock" size={12} />
      </View>
      <AppText className="mt-1 text-[25px] font-semibold leading-8" style={textStyle.timeText}>
        {time || '--:--'}
      </AppText>
      <AppText className="text-[12px] font-semibold" style={textStyle.dateText}>
        {date}
      </AppText>
    </>
  );
}

function MusicStickerContent({
  artist,
  iconColor,
  template,
  textStyle,
  title,
}: {
  artist: string;
  iconColor: string;
  template: MusicStickerTemplate;
  textStyle: ReturnType<typeof getStickerThemeStyle>;
  title: string;
}) {
  if (template === 'label') {
    return (
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full" style={textStyle.iconBubble}>
          <Feather color={iconColor} name="music" size={16} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-[9px] font-semibold uppercase" style={textStyle.metaText}>
            Now playing
          </AppText>
          <AppText className="mt-1 text-[14px] font-semibold" numberOfLines={1} style={textStyle.timeText}>
            {title}
          </AppText>
          <AppText className="mt-0.5 text-[10px] font-semibold" numberOfLines={1} style={textStyle.dateText}>
            {artist}
          </AppText>
        </View>
      </View>
    );
  }

  if (template === 'vinyl') {
    return (
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-black/80">
          <View className="h-5 w-5 items-center justify-center rounded-full" style={textStyle.iconBubble}>
            <View className="h-1.5 w-1.5 rounded-full bg-black/60" />
          </View>
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-[9px] font-semibold uppercase" style={textStyle.metaText}>
            Soundtrack
          </AppText>
          <AppText className="mt-1 text-[15px] font-semibold" numberOfLines={1} style={textStyle.timeText}>
            {title}
          </AppText>
          <AppText className="mt-0.5 text-[10px] font-semibold" numberOfLines={1} style={textStyle.dateText}>
            {artist}
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <>
      <View className="flex-row items-center justify-between">
        <AppText className="text-[9px] font-semibold uppercase" style={textStyle.metaText}>
          Current music
        </AppText>
        <Feather color={iconColor} name="move" size={13} />
      </View>
      <View className="mt-2 flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full" style={textStyle.iconBubble}>
          <Feather color={iconColor} name="music" size={16} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-[15px] font-semibold" numberOfLines={1} style={textStyle.timeText}>
            {title}
          </AppText>
          <AppText className="mt-0.5 text-[11px] font-semibold" numberOfLines={1} style={textStyle.dateText}>
            {artist}
          </AppText>
        </View>
      </View>
    </>
  );
}

function StickerControlHeader({
  disabled,
  icon,
  isSaving,
  onToggle,
  title,
  visible,
}: {
  disabled?: boolean;
  icon: FeatherIconName;
  isSaving: boolean;
  onToggle: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-black/25">
          <Feather color="rgba(255,255,255,0.76)" name={icon} size={15} />
        </View>
        <AppText className="text-sm font-semibold text-white">{title}</AppText>
      </View>
      <Pressable
        accessibilityLabel={visible ? `${title} 숨기기` : `${title} 표시하기`}
        accessibilityRole="button"
        className="h-9 w-9 items-center justify-center rounded-full bg-black/25"
        disabled={isSaving || disabled}
        onPress={onToggle}
        style={{ opacity: disabled ? 0.45 : 1 }}
      >
        <Feather
          color="rgba(255,255,255,0.82)"
          name={visible ? 'eye' : 'eye-off'}
          size={16}
        />
      </Pressable>
    </View>
  );
}

function StickerSegment<T extends string,>({
  disabled,
  onChange,
  options,
  value,
}: {
  disabled?: boolean;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T;
}) {
  return (
    <View className="flex-row rounded-full bg-black/25 p-1">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            className="h-9 flex-1 items-center justify-center rounded-full"
            disabled={disabled}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={{
              backgroundColor: selected ? '#fff' : 'transparent',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <AppText
              className="text-xs font-semibold"
              style={{
                color: selected ? '#050916' : 'rgba(255,255,255,0.6)',
              }}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function clampStickerPosition(
  position: StickerPosition,
  canvasSize: CanvasSize,
  size: StickerSize,
) {
  if (!canvasSize.height || !canvasSize.width) {
    return { x: CANVAS_PADDING, y: CANVAS_PADDING };
  }

  const maxX = Math.max(
    CANVAS_PADDING,
    canvasSize.width - size.width - CANVAS_PADDING,
  );
  const maxY = Math.max(
    CANVAS_PADDING,
    canvasSize.height - size.height - CANVAS_PADDING,
  );

  return {
    x: Math.min(Math.max(position.x, CANVAS_PADDING), maxX),
    y: Math.min(Math.max(position.y, CANVAS_PADDING), maxY),
  };
}

function getDefaultTimestampStickerPosition(
  canvasSize: CanvasSize,
  size: StickerSize,
) {
  return clampStickerPosition(
    {
      x: CANVAS_PADDING,
      y: canvasSize.height - size.height - 26,
    },
    canvasSize,
    size,
  );
}

function getDefaultMusicStickerPosition(canvasSize: CanvasSize, size: StickerSize) {
  return clampStickerPosition(
    {
      x: canvasSize.width - size.width - CANVAS_PADDING,
      y: CANVAS_PADDING,
    },
    canvasSize,
    size,
  );
}

function formatTwoDigits(value: number) {
  return String(value).padStart(2, '0');
}

function formatStickerDateTime(value?: string) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return {
      date: '--.--.--',
      time: '--:--:--',
    };
  }

  return {
    date: `${formatTwoDigits(date.getFullYear() % 100)}.${formatTwoDigits(date.getMonth() + 1)}.${formatTwoDigits(date.getDate())}`,
    time: `${formatTwoDigits(date.getHours())}:${formatTwoDigits(date.getMinutes())}:${formatTwoDigits(date.getSeconds())}`,
  };
}

function getStickerThemeStyle(theme: StickerTheme) {
  if (theme === 'lime') {
    return {
      container: {
        backgroundColor: 'rgba(183,230,40,0.94)',
        borderColor: 'rgba(255,255,255,0.42)',
      },
      dateText: { color: 'rgba(5,9,22,0.72)' },
      divider: { backgroundColor: 'rgba(5,9,22,0.28)' },
      iconBubble: { backgroundColor: 'rgba(5,9,22,0.13)' },
      iconColor: 'rgba(5,9,22,0.78)',
      metaText: { color: 'rgba(5,9,22,0.66)' },
      timeText: { color: '#050916' },
    };
  }

  if (theme === 'mono') {
    return {
      container: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderColor: 'rgba(255,255,255,0.66)',
      },
      dateText: { color: 'rgba(5,9,22,0.6)' },
      divider: { backgroundColor: 'rgba(5,9,22,0.22)' },
      iconBubble: { backgroundColor: 'rgba(5,9,22,0.08)' },
      iconColor: 'rgba(5,9,22,0.64)',
      metaText: { color: 'rgba(5,9,22,0.5)' },
      timeText: { color: '#050916' },
    };
  }

  return {
    container: {
      backgroundColor: 'rgba(5,9,22,0.58)',
      borderColor: 'rgba(255,255,255,0.28)',
    },
    dateText: { color: 'rgba(255,255,255,0.66)' },
    divider: { backgroundColor: 'rgba(255,255,255,0.2)' },
    iconBubble: { backgroundColor: 'rgba(255,255,255,0.1)' },
    iconColor: 'rgba(255,255,255,0.72)',
    metaText: { color: 'rgba(255,255,255,0.54)' },
    timeText: { color: '#fff' },
  };
}

function getTimestampTemplateStyle(template: TimestampStickerTemplate) {
  if (template === 'stamp') {
    return {
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 10,
    };
  }

  if (template === 'type') {
    return {
      borderRadius: 10,
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

function getMusicTemplateStyle(template: MusicStickerTemplate) {
  if (template === 'label') {
    return {
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 10,
    };
  }

  if (template === 'vinyl') {
    return {
      borderRadius: 22,
      paddingHorizontal: 12,
      paddingVertical: 12,
    };
  }

  return {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  };
}

function getPhotoCanvasTemplateStyle(template: RecapTemplateId) {
  if (template === 'lp') {
    return {
      borderColor: 'rgba(255,255,255,0.72)',
      borderRadius: 16,
      borderWidth: 2,
    };
  }

  if (template === 'film') {
    return {
      borderColor: 'rgba(255,255,255,0.34)',
      borderRadius: 4,
      borderWidth: 3,
    };
  }

  if (template === 'map') {
    return {
      borderColor: 'rgba(183,230,40,0.88)',
      borderRadius: 8,
      borderWidth: 2,
    };
  }

  return {
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 8,
    borderWidth: 1,
  };
}

const styles = StyleSheet.create({
  fallbackBlock: {
    backgroundColor: '#16263B',
    borderColor: '#263852',
    borderRadius: 5,
    borderWidth: 1,
    position: 'absolute',
  },
  fallbackBlockOne: {
    height: 92,
    left: 24,
    top: 32,
    width: 118,
  },
  fallbackBlockThree: {
    bottom: 58,
    height: 88,
    right: 18,
    width: 124,
  },
  fallbackBlockTwo: {
    height: 112,
    right: 26,
    top: 72,
    width: 102,
  },
  fallbackMap: {
    backgroundColor: '#0D1725',
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  fallbackMapPin: {
    left: '50%',
    marginLeft: -110,
    marginTop: -54,
    position: 'absolute',
    top: '48%',
  },
  fallbackRoad: {
    backgroundColor: '#46516A',
    borderColor: '#59647A',
    borderWidth: 1,
    height: 18,
    position: 'absolute',
    width: '150%',
  },
  fallbackRoadOne: {
    left: -70,
    top: 202,
    transform: [{ rotate: '-18deg' }],
  },
  fallbackRoadThree: {
    left: -92,
    top: 334,
    transform: [{ rotate: '12deg' }],
  },
  fallbackRoadTwo: {
    left: -76,
    top: 105,
    transform: [{ rotate: '42deg' }],
  },
  mapEdgeShade: {
    backgroundColor: 'rgba(5,9,22,0.12)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  mapMusicArtist: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  mapMusicArtwork: {
    borderRadius: 6,
    height: 38,
    width: 38,
  },
  mapMusicArtworkFallback: {
    alignItems: 'center',
    borderRadius: 6,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  mapMusicBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,9,22,0.96)',
    borderColor: '#B7E628',
    borderRadius: 8,
    borderWidth: 2,
    flexDirection: 'row',
    padding: 7,
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    width: 220,
  },
  mapMusicText: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0,
  },
  mapMusicTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  mapPinConnector: {
    backgroundColor: '#B7E628',
    height: 8,
    width: 2,
  },
  mapPinContainer: {
    alignItems: 'center',
    width: 220,
  },
  mapPinHead: {
    alignItems: 'center',
    backgroundColor: '#B7E628',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 32,
  },
  mapPinPoint: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 5,
    borderRightColor: 'transparent',
    borderRightWidth: 5,
    borderTopColor: '#B7E628',
    borderTopWidth: 8,
    height: 0,
    marginTop: -2,
    width: 0,
  },
  mapPlaceLabel: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,9,22,0.86)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    left: 12,
    maxWidth: 210,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    top: 12,
  },
  mapPlaceLabelText: {
    color: '#FFFFFF',
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  musicSticker: {
    borderWidth: 1,
    left: 0,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    top: 0,
  },
  photoCanvas: {
    aspectRatio: MOMENT_PHOTO_CANVAS_ASPECT_RATIO,
    backgroundColor: '#10131f',
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  photoCanvasBottomCover: {
    backgroundColor: 'rgba(5,9,22,0.96)',
    bottom: 0,
    height: '34%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  photoCanvasBottomVignette: {
    bottom: 0,
    height: '52%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  photoCanvasShade: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  photoCaptureFrame: {
    aspectRatio: MOMENT_PHOTO_CANVAS_ASPECT_RATIO,
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
  },
  stickerDragging: {
    shadowOpacity: 0.38,
    shadowRadius: 22,
  },
  timestampSticker: {
    borderWidth: 1,
    left: 0,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    top: 0,
  },
});
