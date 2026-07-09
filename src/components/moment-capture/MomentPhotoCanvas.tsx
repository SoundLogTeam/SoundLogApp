import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ComponentRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';

import { AppText } from '@/components/AppText';

type TimestampStickerTheme = 'glass' | 'lime' | 'mono';

export type MomentPhotoCanvasHandle = {
  capturePhoto: () => Promise<string | undefined>;
};

type MomentPhotoCanvasProps = {
  capturedAt?: string;
  isSaving: boolean;
  photoUri: string;
};

type CanvasSize = {
  height: number;
  width: number;
};

const CANVAS_PADDING = 16;
export const MOMENT_PHOTO_CANVAS_ASPECT_RATIO = 4 / 5;
const STICKER_HEIGHT = 86;
const STICKER_WIDTH = 176;

const timestampStickerThemes: Array<{
  label: string;
  value: TimestampStickerTheme;
}> = [
  { label: '글래스', value: 'glass' },
  { label: '라임', value: 'lime' },
  { label: '모노', value: 'mono' },
];

export const MomentPhotoCanvas = forwardRef<
  MomentPhotoCanvasHandle,
  MomentPhotoCanvasProps
>(function MomentPhotoCanvas({ capturedAt, isSaving, photoUri }, ref) {
  const photoCaptureRef = useRef<ComponentRef<typeof ViewShot>>(null);
  const stickerPan = useRef(
    new Animated.ValueXY({ x: CANVAS_PADDING, y: CANVAS_PADDING }),
  ).current;
  const stickerPositionRef = useRef({ x: CANVAS_PADDING, y: CANVAS_PADDING });
  const didPlaceStickerRef = useRef(false);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    height: 0,
    width: 0,
  });
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [stickerTheme, setStickerTheme] =
    useState<TimestampStickerTheme>('glass');
  const [stickerVisible, setStickerVisible] = useState(true);
  const stickerDateTime = useMemo(
    () => formatStickerDateTime(capturedAt),
    [capturedAt],
  );
  const stickerThemeStyle = getTimestampStickerThemeStyle(stickerTheme);
  const handleCanvasLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;

    setCanvasSize((current) =>
      current.height === height && current.width === width
        ? current
        : { height, width },
    );
  };
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => {
          setIsDraggingSticker(true);
          stickerPan.stopAnimation((value) => {
            const nextPosition = clampStickerPosition(value, canvasSize);
            stickerPositionRef.current = nextPosition;
            stickerPan.setValue(nextPosition);
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const nextPosition = clampStickerPosition(
            {
              x: stickerPositionRef.current.x + gestureState.dx,
              y: stickerPositionRef.current.y + gestureState.dy,
            },
            canvasSize,
          );

          stickerPan.setValue(nextPosition);
        },
        onPanResponderRelease: () => {
          setIsDraggingSticker(false);
          stickerPan.stopAnimation((value) => {
            stickerPositionRef.current = clampStickerPosition(
              value,
              canvasSize,
            );
            stickerPan.setValue(stickerPositionRef.current);
          });
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => {
          setIsDraggingSticker(false);
          stickerPan.stopAnimation((value) => {
            stickerPositionRef.current = clampStickerPosition(
              value,
              canvasSize,
            );
            stickerPan.setValue(stickerPositionRef.current);
          });
        },
        onStartShouldSetPanResponder: () => true,
      }),
    [canvasSize, stickerPan],
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
    didPlaceStickerRef.current = false;
  }, [photoUri]);

  useEffect(() => {
    if (!canvasSize.height || !canvasSize.width) {
      return;
    }

    if (!didPlaceStickerRef.current) {
      const defaultPosition = getDefaultStickerPosition(canvasSize);

      stickerPositionRef.current = defaultPosition;
      stickerPan.setValue(defaultPosition);
      didPlaceStickerRef.current = true;
      return;
    }

    const nextPosition = clampStickerPosition(
      stickerPositionRef.current,
      canvasSize,
    );
    stickerPositionRef.current = nextPosition;
    stickerPan.setValue(nextPosition);
  }, [canvasSize, stickerPan]);

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
          {stickerVisible ? (
            <Animated.View
              {...panResponder.panHandlers}
              accessibilityLabel={`${stickerDateTime.date} ${stickerDateTime.time} 날짜 스티커`}
              accessibilityRole="button"
              style={[
                styles.timestampSticker,
                stickerThemeStyle.container,
                isDraggingSticker ? styles.timestampStickerDragging : null,
                {
                  transform: [
                    ...stickerPan.getTranslateTransform(),
                    ...(isDraggingSticker ? [{ scale: 1.02 }] : []),
                  ],
                },
              ]}
            >
              <View className="flex-row items-center justify-between">
                <AppText
                  className="text-[9px] font-semibold uppercase"
                  style={stickerThemeStyle.metaText}
                >
                  Soundlog Moment
                </AppText>
                <Feather
                  color={stickerThemeStyle.iconColor}
                  name="move"
                  size={13}
                />
              </View>
              <AppText
                className="mt-1 text-[25px] font-semibold leading-8"
                style={stickerThemeStyle.timeText}
              >
                {stickerDateTime.time}
              </AppText>
              <AppText
                className="text-[12px] font-semibold"
                style={stickerThemeStyle.dateText}
              >
                {stickerDateTime.date}
              </AppText>
            </Animated.View>
          ) : null}
        </View>
      </ViewShot>

      <View className="mt-3 rounded-[18px] border border-white/10 bg-white/10 p-3">
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-black/25">
              <Feather
                color="rgba(255,255,255,0.76)"
                name="calendar"
                size={15}
              />
            </View>
            <AppText className="text-sm font-semibold text-white">
              날짜 스티커
            </AppText>
          </View>
          <Pressable
            accessibilityLabel={
              stickerVisible ? '날짜 스티커 숨기기' : '날짜 스티커 표시하기'
            }
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-full bg-black/25"
            disabled={isSaving}
            onPress={() => setStickerVisible((value) => !value)}
          >
            <Feather
              color="rgba(255,255,255,0.82)"
              name={stickerVisible ? 'eye' : 'eye-off'}
              size={16}
            />
          </Pressable>
        </View>
        <View className="mt-3 flex-row rounded-full bg-black/25 p-1">
          {timestampStickerThemes.map((option) => {
            const selected = option.value === stickerTheme;

            return (
              <Pressable
                accessibilityRole="button"
                className="h-9 flex-1 items-center justify-center rounded-full"
                disabled={isSaving}
                key={option.value}
                onPress={() => setStickerTheme(option.value)}
                style={{
                  backgroundColor: selected ? '#fff' : 'transparent',
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
      </View>
    </View>
  );
});

function clampStickerPosition(
  position: { x: number; y: number },
  canvasSize: CanvasSize,
) {
  if (!canvasSize.height || !canvasSize.width) {
    return { x: CANVAS_PADDING, y: CANVAS_PADDING };
  }

  const maxX = Math.max(
    CANVAS_PADDING,
    canvasSize.width - STICKER_WIDTH - CANVAS_PADDING,
  );
  const maxY = Math.max(
    CANVAS_PADDING,
    canvasSize.height - STICKER_HEIGHT - CANVAS_PADDING,
  );

  return {
    x: Math.min(Math.max(position.x, CANVAS_PADDING), maxX),
    y: Math.min(Math.max(position.y, CANVAS_PADDING), maxY),
  };
}

function getDefaultStickerPosition(canvasSize: CanvasSize) {
  return clampStickerPosition(
    {
      x: CANVAS_PADDING,
      y: canvasSize.height - STICKER_HEIGHT - 26,
    },
    canvasSize,
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

function getTimestampStickerThemeStyle(theme: TimestampStickerTheme) {
  if (theme === 'lime') {
    return {
      container: {
        backgroundColor: 'rgba(183,230,40,0.94)',
        borderColor: 'rgba(255,255,255,0.42)',
      },
      dateText: { color: 'rgba(5,9,22,0.72)' },
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
    iconColor: 'rgba(255,255,255,0.72)',
    metaText: { color: 'rgba(255,255,255,0.54)' },
    timeText: { color: '#fff' },
  };
}

const styles = StyleSheet.create({
  photoCanvas: {
    aspectRatio: MOMENT_PHOTO_CANVAS_ASPECT_RATIO,
    backgroundColor: '#10131f',
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
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
  timestampSticker: {
    borderRadius: 18,
    borderWidth: 1,
    left: 0,
    minHeight: STICKER_HEIGHT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    top: 0,
    width: STICKER_WIDTH,
  },
  timestampStickerDragging: {
    shadowOpacity: 0.38,
    shadowRadius: 22,
  },
});
