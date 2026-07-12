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
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

import { AppText } from '@/components/AppText';
import type { Track } from '@/types/domain';

type StickerTheme = 'glass' | 'lime' | 'mono';
type TimestampStickerTemplate = 'card' | 'stamp' | 'type';
type MusicStickerTemplate = 'player' | 'label' | 'vinyl';
type StickerKind = 'music' | 'timestamp';
type FeatherIconName = ComponentProps<typeof Feather>['name'];

export type MomentPhotoCanvasHandle = {
  capturePhoto: () => Promise<string | undefined>;
};

type MomentPhotoCanvasProps = {
  capturedAt?: string;
  isSaving: boolean;
  onStickerDragChange?: (isDragging: boolean) => void;
  photoUri: string;
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

export const MomentPhotoCanvas = forwardRef<
  MomentPhotoCanvasHandle,
  MomentPhotoCanvasProps
>(function MomentPhotoCanvas(
  { capturedAt, isSaving, onStickerDragChange, photoUri, track },
  ref,
) {
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
  const [timestampTheme, setTimestampTheme] = useState<StickerTheme>('glass');
  const [timestampTemplate, setTimestampTemplate] =
    useState<TimestampStickerTemplate>('card');
  const [timestampVisible, setTimestampVisible] = useState(true);
  const [customTimeText, setCustomTimeText] = useState('');
  const [customCaptionText, setCustomCaptionText] =
    useState('Soundlog Recap');
  const [musicTheme, setMusicTheme] = useState<StickerTheme>('glass');
  const [musicTemplate, setMusicTemplate] =
    useState<MusicStickerTemplate>('player');
  const [musicVisible, setMusicVisible] = useState(Boolean(track));
  const stickerDateTime = useMemo(
    () => formatStickerDateTime(capturedAt),
    [capturedAt],
  );
  const timestampStickerSize = timestampStickerSizes[timestampTemplate];
  const musicStickerSize = musicStickerSizes[musicTemplate];
  const timestampThemeStyle = getStickerThemeStyle(timestampTheme);
  const musicThemeStyle = getStickerThemeStyle(musicTheme);
  const isDraggingTimestamp = activeSticker === 'timestamp';
  const isDraggingMusic = activeSticker === 'music';

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

  const timestampPanResponder = useMemo(
    () =>
      createStickerPanResponder({
        canvasSize,
        onDragEnd: handleDragEnd,
        onDragStart: () => handleDragStart('timestamp'),
        pan: timestampPan,
        positionRef: timestampPositionRef,
        size: timestampStickerSize,
      }),
    [canvasSize, handleDragEnd, handleDragStart, timestampPan, timestampStickerSize],
  );
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
    setCustomTimeText(stickerDateTime.time);
    setCustomCaptionText('Soundlog Recap');
  }, [photoUri, stickerDateTime.time]);

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
          collapsable={false}
          onLayout={handleCanvasLayout}
          style={styles.photoCanvas}
        >
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

          {timestampVisible ? (
            <Animated.View
              {...timestampPanResponder.panHandlers}
              accessibilityLabel={`${customTimeText} 시간 스티커`}
              accessibilityRole="button"
              style={[
                styles.timestampSticker,
                timestampThemeStyle.container,
                getTimestampTemplateStyle(timestampTemplate),
                isDraggingTimestamp ? styles.stickerDragging : null,
                {
                  minHeight: timestampStickerSize.height,
                  transform: [
                    ...timestampPan.getTranslateTransform(),
                    ...(isDraggingTimestamp ? [{ scale: 1.02 }] : []),
                  ],
                  width: timestampStickerSize.width,
                },
              ]}
            >
              <TimestampStickerContent
                caption={customCaptionText}
                date={stickerDateTime.date}
                iconColor={timestampThemeStyle.iconColor}
                template={timestampTemplate}
                textStyle={timestampThemeStyle}
                time={customTimeText}
              />
            </Animated.View>
          ) : null}

          {musicVisible && track ? (
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
        <View className="rounded-[18px] border border-white/10 bg-white/10 p-3">
          <StickerControlHeader
            icon="clock"
            isSaving={isSaving}
            onToggle={() => setTimestampVisible((value) => !value)}
            title="시간·문구 스티커"
            visible={timestampVisible}
          />

          <View className="mt-3 gap-2">
            <View className="flex-row gap-2">
              <View className="min-w-0 flex-1">
                <AppText className="mb-1 text-[11px] text-white/45">
                  시간
                </AppText>
                <TextInput
                  className="h-10 rounded-[13px] border border-white/10 bg-black/25 px-3 text-sm font-semibold text-white"
                  editable={!isSaving}
                  onChangeText={setCustomTimeText}
                  placeholder="18:30"
                  placeholderTextColor="rgba(255,255,255,0.32)"
                  value={customTimeText}
                />
              </View>
              <View className="min-w-0 flex-[1.45]">
                <AppText className="mb-1 text-[11px] text-white/45">
                  문구
                </AppText>
                <TextInput
                  className="h-10 rounded-[13px] border border-white/10 bg-black/25 px-3 text-sm font-semibold text-white"
                  editable={!isSaving}
                  onChangeText={setCustomCaptionText}
                  placeholder="오늘의 사운드"
                  placeholderTextColor="rgba(255,255,255,0.32)"
                  value={customCaptionText}
                />
              </View>
            </View>
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

        <View className="rounded-[18px] border border-white/10 bg-white/10 p-3">
          <StickerControlHeader
            disabled={!track}
            icon="music"
            isSaving={isSaving}
            onToggle={() => setMusicVisible((value) => !value)}
            title="현재 음악 스티커"
            visible={musicVisible && Boolean(track)}
          />
          <AppText className="mt-2 text-xs leading-5 text-white/50" numberOfLines={2}>
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
        </View>
      </View>
    </View>
  );
});

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
  caption,
  date,
  iconColor,
  template,
  textStyle,
  time,
}: {
  caption: string;
  date: string;
  iconColor: string;
  template: TimestampStickerTemplate;
  textStyle: ReturnType<typeof getStickerThemeStyle>;
  time: string;
}) {
  if (template === 'stamp') {
    return (
      <View className="items-center justify-center">
        <AppText
          className="text-[9px] font-semibold uppercase"
          numberOfLines={1}
          style={textStyle.metaText}
        >
          {caption || 'Soundlog'}
        </AppText>
        <View className="my-1 h-px w-14" style={textStyle.divider} />
        <AppText className="text-[23px] font-semibold leading-7" style={textStyle.timeText}>
          {time || '--:--'}
        </AppText>
        <AppText className="text-[10px] font-semibold" style={textStyle.dateText}>
          {date}
        </AppText>
      </View>
    );
  }

  if (template === 'type') {
    return (
      <View>
        <AppText
          className="text-[10px] font-semibold uppercase"
          numberOfLines={1}
          style={textStyle.metaText}
        >
          {caption || 'Soundlog Recap'}
        </AppText>
        <View className="mt-1 flex-row items-end gap-2">
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
        <AppText
          className="text-[9px] font-semibold uppercase"
          numberOfLines={1}
          style={textStyle.metaText}
        >
          {caption || 'Soundlog Recap'}
        </AppText>
        <Feather color={iconColor} name="move" size={13} />
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

const styles = StyleSheet.create({
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
    borderRadius: 28,
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
    borderRadius: 28,
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
