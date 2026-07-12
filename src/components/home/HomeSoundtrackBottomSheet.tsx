import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TrackList } from '@/components/playlist/TrackList';
import type { PlaylistCuration, Track } from '@/types/domain';

type HomeSoundtrackBottomSheetProps = {
  actionMessage?: string;
  currentTrackId?: string;
  eyebrowLabel?: string;
  isLoading?: boolean;
  likedTrackIds: Set<string>;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
  onToggleLike: (track: Track) => void;
  onToggleSave: (track: Track) => void;
  playlist?: PlaylistCuration;
  savedTrackIds: Set<string>;
  visible: boolean;
};

const CLOSE_DRAG_DISTANCE = 86;
const CLOSE_DRAG_VELOCITY = 0.75;
const CLOSE_ANIMATION_DURATION = 180;
const OPEN_BACKDROP_OPACITY = 1;
const EXPANDED_OFFSET = 0;
const RESTING_OFFSET_MAX = 136;
const RESTING_OFFSET_MIN = 82;

function getRestingOffset(height: number) {
  return Math.min(RESTING_OFFSET_MAX, Math.max(RESTING_OFFSET_MIN, height * 0.12));
}

function getResistedOffset(offset: number, restingOffset: number) {
  if (offset < EXPANDED_OFFSET) {
    return offset * 0.28;
  }

  if (offset > restingOffset) {
    return restingOffset + (offset - restingOffset) * 0.42;
  }

  return offset;
}

export function HomeSoundtrackBottomSheet({
  actionMessage,
  currentTrackId,
  eyebrowLabel = '오늘의 사운드트랙',
  isLoading = false,
  likedTrackIds,
  onClose,
  onSelectTrack,
  onToggleLike,
  onToggleSave,
  playlist,
  savedTrackIds,
  visible,
}: HomeSoundtrackBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetTopGap = Math.max(insets.top + 8, 22);
  const sheetHeight = Math.max(360, height - sheetTopGap);
  const restingOffset = getRestingOffset(height);
  const sheetHiddenOffset = sheetHeight + insets.bottom + 48;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(sheetHiddenOffset)).current;
  const currentSnapOffset = useRef(restingOffset);
  const dragStartOffset = useRef(restingOffset);
  const [isMounted, setIsMounted] = useState(visible);
  const listBottomPadding = insets.bottom + 40;

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    if (visible) {
      backdropOpacity.stopAnimation();
      translateY.stopAnimation();
      backdropOpacity.setValue(0);
      translateY.setValue(sheetHiddenOffset);
      currentSnapOffset.current = restingOffset;
      dragStartOffset.current = restingOffset;
      const animationFrame = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            duration: 140,
            easing: Easing.out(Easing.quad),
            toValue: OPEN_BACKDROP_OPACITY,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            damping: 24,
            mass: 0.8,
            stiffness: 230,
            toValue: restingOffset,
            useNativeDriver: true,
          }),
        ]).start();
      });

      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: CLOSE_ANIMATION_DURATION,
        easing: Easing.in(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        duration: CLOSE_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        toValue: sheetHiddenOffset,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsMounted(false);
      }
    });
  }, [backdropOpacity, isMounted, restingOffset, sheetHiddenOffset, translateY, visible]);

  const snapTo = useCallback((offset: number) => {
    currentSnapOffset.current = offset;
    Animated.spring(translateY, {
      damping: 24,
      mass: 0.82,
      stiffness: 230,
      toValue: offset,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          dragStartOffset.current = currentSnapOffset.current;
        },
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          const nextOffset = dragStartOffset.current + gesture.dy;
          translateY.setValue(getResistedOffset(nextOffset, restingOffset));
        },
        onPanResponderRelease: (_, gesture) => {
          const nextOffset = dragStartOffset.current + gesture.dy;
          const shouldClose =
            nextOffset > restingOffset + CLOSE_DRAG_DISTANCE ||
            (gesture.vy > CLOSE_DRAG_VELOCITY && nextOffset > restingOffset - 12);

          if (shouldClose) {
            onClose();
            return;
          }

          if (gesture.vy < -0.34 || nextOffset < restingOffset * 0.54) {
            snapTo(EXPANDED_OFFSET);
            return;
          }

          snapTo(restingOffset);
        },
        onPanResponderTerminate: () => {
          snapTo(currentSnapOffset.current);
        },
      }),
    [onClose, restingOffset, snapTo, translateY],
  );

  if (!isMounted && !visible) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={isMounted || visible}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel={`${eyebrowLabel} 닫기`}
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View
            className="bg-black/58"
            style={[StyleSheet.absoluteFill, { opacity: backdropOpacity }]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateY }],
            },
          ]}
        >
          <View
            {...panResponder.panHandlers}
            accessible
            accessibilityHint="위아래로 드래그해 펼치거나 닫을 수 있습니다."
            accessibilityLabel={`${eyebrowLabel} 핸들`}
            style={styles.dragRegion}
          >
            <View style={styles.dragHandle} />
            <View className="flex-row items-start justify-between gap-4">
              <View className="min-w-0 flex-1">
                <AppText className="text-[11px] font-semibold text-[#B7E628]">
                  {eyebrowLabel}
                </AppText>
                <AppText className="mt-1 text-[24px] font-semibold leading-8 text-white" numberOfLines={1}>
                  {playlist?.regionName ?? '추천 곡'}
                </AppText>
                {playlist ? (
                  <AppText className="mt-2 text-xs leading-5 text-white/55" numberOfLines={2}>
                    {playlist.reason}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel={`${eyebrowLabel} 닫기`}
                accessibilityRole="button"
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                onPress={onClose}
              >
                <Feather color="#FFFFFF" name="x" size={18} />
              </Pressable>
            </View>

            {playlist ? (
              <View className="mt-4 flex-row gap-2">
                <View className="rounded-full bg-white/10 px-3 py-1.5">
                  <AppText className="text-[11px] font-semibold text-white/70">
                    {playlist.trackCount}곡
                  </AppText>
                </View>
                <View className="rounded-full bg-white/10 px-3 py-1.5">
                  <AppText className="text-[11px] font-semibold text-white/70">
                    {playlist.durationText}
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>

          {isLoading ? (
            <View className="items-center justify-center px-7 py-12">
              <ActivityIndicator color="#B7E628" />
              <AppText className="mt-4 text-sm font-semibold text-white">
                추천 곡을 불러오고 있어요
              </AppText>
            </View>
          ) : playlist ? (
            <ScrollView
              className="mt-6"
              showsVerticalScrollIndicator={false}
              style={styles.trackScroller}
            >
              <TrackList
                bottomPadding={listBottomPadding}
                currentTrackId={currentTrackId}
                likedTrackIds={likedTrackIds}
                onSelectTrack={onSelectTrack}
                onToggleLike={onToggleLike}
                onToggleSave={onToggleSave}
                savedTrackIds={savedTrackIds}
                tracks={playlist.tracks}
              />
            </ScrollView>
          ) : (
            <View className="px-7 py-10">
              <AppText className="text-center text-base font-semibold text-white">
                추천 곡을 열지 못했어요
              </AppText>
            </View>
          )}

          {actionMessage ? (
            <View className="mx-7 mt-3 rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
              <AppText className="text-center text-xs leading-5 text-amber-100">
                {actionMessage}
              </AppText>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dragHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 999,
    height: 5,
    marginBottom: 18,
    width: 54,
  },
  dragRegion: {
    paddingBottom: 10,
    paddingHorizontal: 28,
    paddingTop: 18,
  },
  sheet: {
    backgroundColor: '#08101D',
    borderColor: 'rgba(255,255,255,0.14)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  trackScroller: {
    flex: 1,
  },
});
